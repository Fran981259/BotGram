"""Rotas do painel admin — Auditoria, Logs, Moderação e Segurança.

Endpoints:
  GET  /api/admin/audit/logs       → listagem paginada e filtrada de logs de publicação e auditoria
  GET  /api/admin/audit/stats      → contadores e resumo de auditoria
  GET  /api/admin/moderation/items → artigos pendentes de moderação ou com falha
  POST /api/admin/moderation/action→ aprovação, rejeição ou arquivamento de item moderado
  GET  /api/admin/security/info    → status de segurança, chaves ativas e políticas
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import func

from app.contracts import iso_utc
from app.database import get_db, get_session
from app.schema import NewsArticle, PublicationLog, Reporter
from app.security import require_api_key

router = APIRouter(prefix="/api/admin", tags=["admin-audit"])


class ModerationActionPayload(BaseModel):
    article_id: int
    action: str = Field(..., pattern="^(approve|reject|archive)$")
    reason: Optional[str] = Field(default="Ação executada via painel administrativo")


@router.get("/audit/logs")
def get_audit_logs(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=30, ge=1, le=100),
    action: Optional[str] = None,
    q: Optional[str] = None,
    db=Depends(get_db),
    _auth=Depends(require_api_key),
):
    """Lista paginada e filtrada de registros de auditoria."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        query = db.query(PublicationLog)

        if action and action != "all":
            query = query.filter(PublicationLog.action == action)

        if q and q.strip():
            query = query.filter(PublicationLog.details.ilike(f"%{q.strip()}%"))

        total = query.count()
        logs = query.order_by(PublicationLog.created_at.desc()).offset(offset).limit(limit).all()

        article_ids = [entry.article_id for entry in logs if entry.article_id]
        reporter_ids = [entry.reporter_id for entry in logs if entry.reporter_id]

        article_map = {}
        if article_ids:
            arts = (
                db.query(NewsArticle.id, NewsArticle.title, NewsArticle.slug, NewsArticle.category)
                .filter(NewsArticle.id.in_(article_ids))
                .all()
            )
            for a in arts:
                article_map[a.id] = {"title": a.title, "slug": a.slug, "category": a.category}

        reporter_map = {}
        if reporter_ids:
            reps = db.query(Reporter.id, Reporter.display_name, Reporter.slug).filter(Reporter.id.in_(reporter_ids)).all()
            for r in reps:
                reporter_map[r.id] = {"name": r.display_name, "slug": r.slug}

        items = []
        for entry in logs:
            art = article_map.get(entry.article_id, {})
            rep = reporter_map.get(entry.reporter_id, {})
            items.append(
                {
                    "id": entry.id,
                    "action": entry.action,
                    "details": entry.details,
                    "article_id": entry.article_id,
                    "article_title": art.get("title"),
                    "article_slug": art.get("slug"),
                    "category": art.get("category"),
                    "reporter_name": rep.get("name"),
                    "reporter_slug": rep.get("slug"),
                    "created_at": iso_utc(entry.created_at),
                }
            )

        return {"total": total, "offset": offset, "limit": limit, "logs": items}
    except Exception as exc:
        logger.error("get_audit_logs falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro ao listar logs") from None
    finally:
        if owns_session:
            db.close()


@router.get("/audit/stats")
def get_audit_stats(db=Depends(get_db), _auth=Depends(require_api_key)):
    """Retorna contadores de ações de auditoria."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)

        total_logs = db.query(func.count(PublicationLog.id)).scalar() or 0
        today_logs = db.query(func.count(PublicationLog.id)).filter(PublicationLog.created_at >= today_start).scalar() or 0
        week_logs = db.query(func.count(PublicationLog.id)).filter(PublicationLog.created_at >= week_start).scalar() or 0

        action_counts = (
            db.query(PublicationLog.action, func.count().label("n"))
            .group_by(PublicationLog.action)
            .order_by(func.count().desc())
            .all()
        )

        return {
            "total_logs": total_logs,
            "today_logs": today_logs,
            "week_logs": week_logs,
            "actions_breakdown": {r.action: r.n for r in action_counts},
        }
    except Exception as exc:
        logger.error("get_audit_stats falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro ao gerar estatísticas") from None
    finally:
        if owns_session:
            db.close()


@router.get("/moderation/items")
def get_moderation_items(db=Depends(get_db), _auth=Depends(require_api_key)):
    """Retorna artigos que necessitam de intervenção ou moderação."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        articles = (
            db.query(
                NewsArticle.id,
                NewsArticle.slug,
                NewsArticle.title,
                NewsArticle.category,
                NewsArticle.status,
                NewsArticle.importance_score,
                NewsArticle.engagement_score,
                NewsArticle.created_at,
            )
            .filter(NewsArticle.status.in_(["review", "failed"]))
            .order_by(NewsArticle.created_at.desc())
            .limit(50)
            .all()
        )

        return {
            "total": len(articles),
            "items": [
                {
                    "id": a.id,
                    "slug": a.slug,
                    "title": a.title,
                    "category": a.category,
                    "status": a.status,
                    "importance_score": a.importance_score,
                    "engagement_score": a.engagement_score,
                    "created_at": iso_utc(a.created_at),
                }
                for a in articles
            ],
        }
    except Exception as exc:
        logger.error("get_moderation_items falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro ao listar itens de moderação") from None
    finally:
        if owns_session:
            db.close()


@router.post("/moderation/action")
def resolve_moderation(
    payload: ModerationActionPayload, db=Depends(get_db), _auth=Depends(require_api_key)
):
    """Executa ação de moderação em um artigo."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        article = db.query(NewsArticle).filter(NewsArticle.id == payload.article_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="Artigo não encontrado.")

        now = datetime.now(timezone.utc)
        if payload.action == "approve":
            article.status = "published"
            article.published_at = now
            action_desc = "Artigo aprovado e publicado via moderação"
        elif payload.action == "archive":
            article.status = "archived"
            action_desc = f"Artigo arquivado via moderação: {payload.reason}"
        else:
            article.status = "failed"
            action_desc = f"Artigo rejeitado via moderação: {payload.reason}"

        article.updated_at = now

        log = PublicationLog(
            article_id=article.id,
            action=f"moderation_{payload.action}",
            reporter_id=article.reporter_id,
            details=f"{action_desc} ({payload.reason})",
        )
        db.add(log)
        db.commit()

        return {"status": "success", "article_id": article.id, "new_status": article.status}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("resolve_moderation falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Erro ao processar moderação") from None
    finally:
        if owns_session:
            db.close()


@router.get("/security/info")
def get_security_info(_auth=Depends(require_api_key)):
    """Retorna informações de segurança do ambiente e políticas ativas."""
    has_key = bool(os.getenv("PUBLISH_API_KEY"))
    env = os.getenv("ENVIRONMENT", "development")
    cors_raw = os.getenv("CORS_ALLOWED_ORIGINS") or os.getenv("CORS_ORIGINS") or "default"
    trusted_proxies = os.getenv("TRUSTED_PROXY_HOSTS", "127.0.0.1,::1")

    return {
        "environment": env,
        "auth_method": "X-API-Key (Header)",
        "api_key_configured": has_key,
        "key_strength_policy": "Enforced in production (min 32 chars)",
        "trusted_proxies": trusted_proxies.split(","),
        "cors_origins": cors_raw.split(","),
        "active_operator": "Admin Master",
        "policies": {
            "rate_limiting": "Ativo em endpoints públicos (Redis counter)",
            "cors_policy": "Fail-closed (sem wildcard em produção)",
            "data_retention": "30 dias de logs e backups operacionais",
        },
    }
