"""Rotas do painel admin — Redes Sociais & Distribuição (Twitter/X).

Endpoints:
  GET  /api/admin/social/status           → status da integração e credenciais Twitter/X
  GET  /api/admin/social/history          → histórico de publicações nas redes
  POST /api/admin/social/tweet            → disparo manual de post/tweet de artigo
  POST /api/admin/social/trigger-top-news → dispara task Celery post_top_news_twitter
"""

import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import func

from app.contracts import iso_utc
from app.database import get_db, get_session
from app.schema import NewsArticle, PublicationLog
from app.security import require_api_key
from app.social.twitter import get_twitter_client, post_to_twitter

router = APIRouter(prefix="/api/admin/social", tags=["admin-social"])


class ManualTweetPayload(BaseModel):
    slug: str = Field(..., min_length=2, max_length=500)
    custom_text: Optional[str] = Field(default=None, max_length=280)


@router.get("/status")
def social_status(db=Depends(get_db), _auth=Depends(require_api_key)):
    """Retorna o status da integração com redes sociais e contadores."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        has_api_key = bool(os.getenv("TWITTER_API_KEY"))
        has_api_secret = bool(os.getenv("TWITTER_API_SECRET"))
        has_access_token = bool(os.getenv("TWITTER_ACCESS_TOKEN"))
        has_access_secret = bool(os.getenv("TWITTER_ACCESS_SECRET"))

        is_configured = all([has_api_key, has_api_secret, has_access_token, has_access_secret])

        total_posted = (
            db.query(func.count(PublicationLog.id))
            .filter(PublicationLog.action.like("social_%"))
            .scalar()
            or 0
        )

        last_post = (
            db.query(PublicationLog)
            .filter(PublicationLog.action.like("social_%"))
            .order_by(PublicationLog.created_at.desc())
            .first()
        )

        return {
            "twitter": {
                "configured": is_configured,
                "api_key_set": has_api_key,
                "access_token_set": has_access_token,
                "schedule": "3x ao dia (08:00, 14:00, 20:00 UTC)",
                "total_posts": total_posted,
                "last_post_at": iso_utc(last_post.created_at) if last_post else None,
            }
        }
    except Exception as exc:
        logger.error("social_status falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro ao consultar status social") from None
    finally:
        if owns_session:
            db.close()


@router.get("/history")
def social_history(limit: int = 30, db=Depends(get_db), _auth=Depends(require_api_key)):
    """Retorna histórico de postagens em redes sociais."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        logs = (
            db.query(PublicationLog)
            .filter(PublicationLog.action.like("social_%"))
            .order_by(PublicationLog.created_at.desc())
            .limit(limit)
            .all()
        )

        article_ids = [entry.article_id for entry in logs if entry.article_id]
        article_map = {}
        if article_ids:
            articles = (
                db.query(NewsArticle.id, NewsArticle.title, NewsArticle.slug, NewsArticle.category)
                .filter(NewsArticle.id.in_(article_ids))
                .all()
            )
            for a in articles:
                article_map[a.id] = {
                    "title": a.title,
                    "slug": a.slug,
                    "category": a.category,
                }

        result = []
        for entry in logs:
            art = article_map.get(entry.article_id, {})
            result.append(
                {
                    "id": entry.id,
                    "article_id": entry.article_id,
                    "action": entry.action,
                    "details": entry.details,
                    "article_title": art.get("title"),
                    "article_slug": art.get("slug"),
                    "category": art.get("category"),
                    "created_at": iso_utc(entry.created_at),
                }
            )

        return {"total": len(result), "history": result}
    except Exception as exc:
        logger.error("social_history falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro ao carregar histórico") from None
    finally:
        if owns_session:
            db.close()


@router.post("/tweet")
def manual_tweet(payload: ManualTweetPayload, db=Depends(get_db), _auth=Depends(require_api_key)):
    """Dispara postagem manual de um artigo para o Twitter/X."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        article = db.query(NewsArticle).filter(NewsArticle.slug == payload.slug).first()
        if not article:
            raise HTTPException(status_code=404, detail="Artigo não encontrado.")

        creds = get_twitter_client()
        if not creds:
            raise HTTPException(
                status_code=400,
                detail="Twitter não configurado. Verifique as credenciais TWITTER_* no .env.",
            )

        success = post_to_twitter(
            title=article.title,
            category=article.category or "Geral",
            slug=article.slug,
        )

        if not success:
            raise HTTPException(status_code=502, detail="Falha ao publicar tweet na API do Twitter.")

        log = PublicationLog(
            article_id=article.id,
            action="social_twitter_manual",
            reporter_id=article.reporter_id,
            details=f"Postado manualmente no Twitter por admin: {article.title[:80]}",
        )
        db.add(log)
        db.commit()

        return {"status": "success", "message": "Tweet publicado com sucesso!", "article_id": article.id}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("manual_tweet falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Erro ao processar tweet") from None
    finally:
        if owns_session:
            db.close()


@router.post("/trigger-top-news")
def trigger_social_top_news(_auth=Depends(require_api_key)):
    """Dispara task Celery assíncrona para postar a Top News recente no Twitter."""
    try:
        from app.tasks.social_tasks import post_top_news_twitter
        result = post_top_news_twitter.apply_async()
        return {
            "status": "queued",
            "task_id": result.id,
            "message": "Task de publicação no Twitter enfileirada no Celery.",
        }
    except Exception as exc:
        logger.error("trigger_social_top_news falhou (%s)", type(exc).__name__)
        raise HTTPException(
            status_code=503,
            detail="Não foi possível disparar a task. Verifique se o worker/broker está online.",
        ) from None
