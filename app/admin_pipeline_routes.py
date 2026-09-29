"""Rotas do painel admin — pipeline de coleta e status Celery.

Endpoints:
  GET  /api/admin/pipeline/status   → status dos workers + fila por stage
  POST /api/admin/pipeline/trigger  → dispara run_full_pipeline manual
  GET  /api/admin/pipeline/schedule → lê o beat schedule configurado
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy import func

from app.contracts import iso_utc
from app.database import get_db, get_session
from app.runtime_config import get_scheduler_settings
from app.schema import NewsArticle, PublicationLog
from app.security import require_api_key

router = APIRouter(prefix="/api/admin/pipeline", tags=["admin-pipeline"])

# ─── Status do pipeline ───────────────────────────────────────────────────────


def _redis_client():
    """Retorna cliente Redis ou None se indisponível."""
    import os
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return None
    try:
        import redis
        client = redis.from_url(redis_url, socket_connect_timeout=2, socket_timeout=2)
        client.ping()
        return client
    except Exception:
        return None


def _celery_worker_status() -> dict:
    """Inspeciona workers Celery via Redis broker ping."""
    try:
        from app.celery_app import celery_app
        inspect = celery_app.control.inspect(timeout=2)
        ping = inspect.ping() or {}
        workers = []
        for name, result in ping.items():
            workers.append({"name": name, "status": "online" if result else "offline"})
        return {"workers": workers, "total": len(workers), "online": sum(1 for w in workers if w["status"] == "online")}
    except Exception:
        return {"workers": [], "total": 0, "online": 0, "error": "Broker inacessível"}


def _pipeline_lock_status(redis) -> dict:
    """Verifica se o pipeline está rodando via lock Redis."""
    if not redis:
        return {"running": False, "redis": "offline"}
    try:
        locked = redis.get("lock:run_full_pipeline")
        ttl = redis.ttl("lock:run_full_pipeline") if locked else -1
        return {"running": bool(locked), "redis": "online", "lock_ttl_seconds": int(ttl)}
    except Exception:
        return {"running": False, "redis": "error"}


def _queue_counts(db) -> dict:
    """Conta artigos em cada estágio do pipeline."""
    try:
        rows = (
            db.query(NewsArticle.status, func.count().label("n"))
            .group_by(NewsArticle.status)
            .all()
        )
        by_status = {r.status: r.n for r in rows}
        return {
            "draft":      by_status.get("draft", 0),
            "classified": by_status.get("classified", 0),
            "review":     by_status.get("review", 0),
            "rewritten":  by_status.get("rewritten", 0),
            "published":  by_status.get("published", 0),
            "failed":     by_status.get("failed", 0),
            "archived":   by_status.get("archived", 0),
        }
    except Exception:
        return {}


def _recent_pipeline_runs(db, limit: int = 8) -> list:
    """Últimas execuções do pipeline via PublicationLog."""
    try:
        rows = (
            db.query(PublicationLog)
            .filter(PublicationLog.action.in_(["published", "admin_update", "editorial_review"]))
            .order_by(PublicationLog.created_at.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "action": r.action,
                "article_id": r.article_id,
                "details": r.details,
                "at": iso_utc(r.created_at),
            }
            for r in rows
        ]
    except Exception:
        return []


@router.get("/status")
def pipeline_status(db=Depends(get_db), _auth=Depends(require_api_key)):
    """Retorna status completo: workers, lock, fila por estágio, schedule."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        redis = _redis_client()
        settings = get_scheduler_settings()
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        published_today = (
            db.query(func.count())
            .filter(
                NewsArticle.status == "published",
                NewsArticle.published_at >= today_start,
            )
            .scalar() or 0
        )

        return {
            "checked_at": iso_utc(now),
            "worker_status": _celery_worker_status(),
            "pipeline_lock": _pipeline_lock_status(redis),
            "queue": _queue_counts(db),
            "schedule": {
                "interval_minutes": settings.update_interval_minutes,
                "min_articles_per_day": settings.min_articles_per_day,
            },
            "metrics": {
                "published_today": published_today,
                "target_today": settings.min_articles_per_day,
            },
            "recent_logs": _recent_pipeline_runs(db),
        }
    except Exception as exc:
        logger.error("pipeline_status falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro interno") from None
    finally:
        if owns_session:
            db.close()


# ─── Trigger manual ───────────────────────────────────────────────────────────


@router.post("/trigger")
def pipeline_trigger(_auth=Depends(require_api_key)):
    """Dispara run_full_pipeline manualmente. Retorna o task_id para rastreamento."""
    try:
        from app.tasks.scan_tasks import run_full_pipeline
        result = run_full_pipeline.apply_async()
        return {
            "status": "queued",
            "task_id": result.id,
            "message": "Pipeline disparado. Acompanhe via logs.",
        }
    except Exception as exc:
        logger.error("Trigger manual falhou (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503,
            detail="Não foi possível disparar o pipeline. Verifique se o broker Redis está online.",
        ) from None


# ─── Task result ──────────────────────────────────────────────────────────────


@router.get("/task/{task_id}")
def pipeline_task_result(task_id: str, _auth=Depends(require_api_key)):
    """Consulta o resultado de uma task pelo ID."""
    try:
        from celery.result import AsyncResult

        from app.celery_app import celery_app
        result = AsyncResult(task_id, app=celery_app)
        return {
            "task_id": task_id,
            "state": result.state,
            "result": result.result if result.ready() and not isinstance(result.result, Exception) else None,
            "error": str(result.result) if result.failed() else None,
        }
    except Exception:
        raise HTTPException(status_code=503, detail="Erro ao consultar task") from None
