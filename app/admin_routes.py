"""Rotas do painel administrativo — gestão completa de artigos.

Regras:
- Todos os endpoints exigem require_api_key (PUBLISH_API_KEY).
- Nenhuma operação destrutiva é irreversível: delete → status archived.
- Campos extras (title, image_url, summary) estendidos além do UpdateReviewRequest.
"""

from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from pydantic import BaseModel, Field
from sqlalchemy import func

from app.contracts import CATEGORIES, category_name, iso_utc
from app.database import get_db, get_session
from app.publisher import ArticlePublisher
from app.schema import NewsArticle, PublicationLog, Reporter
from app.security import require_api_key

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ─── Modelos de entrada ───────────────────────────────────────────────────────


class AdminArticleUpdate(BaseModel):
    """Campos editáveis via painel admin."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    summary: Optional[str] = Field(default=None, max_length=2_000)
    content: Optional[str] = Field(default=None, min_length=1)
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    image_url: Optional[str] = Field(default=None, max_length=500)
    importance_score: Optional[int] = Field(default=None, ge=0, le=100)
    engagement_score: Optional[int] = Field(default=None, ge=0, le=100)
    status: Optional[Literal["draft", "classified", "review", "rewritten", "failed", "published", "archived"]] = None


# ─── Serialização ─────────────────────────────────────────────────────────────


def _article_payload(a: NewsArticle) -> dict:
    """Serializa um artigo para o painel admin (mais campos que a fila editorial)."""
    reporter_name = None
    try:
        if a.reporter:
            reporter_name = a.reporter.display_name
    except Exception:
        pass
    return {
        "id": a.id,
        "slug": a.slug,
        "title": a.title,
        "summary": a.summary,
        "category": a.category,
        "status": a.status,
        "image_url": a.image_url,
        "reporter": reporter_name,
        "reporter_slug": getattr(a.reporter, "slug", None) if a.reporter else None,
        "importance_score": a.importance_score,
        "engagement_score": a.engagement_score,
        "published_at": iso_utc(a.published_at),
        "created_at": iso_utc(a.created_at),
        "updated_at": iso_utc(a.updated_at),
        "region": a.region,
        "visibility": a.visibility,
    }


# ─── Listagem ─────────────────────────────────────────────────────────────────


@router.get("/articles")
def admin_list_articles(
    limit: int = Query(30, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="Busca parcial no título"),
    db=Depends(get_db),
    _auth=Depends(require_api_key),
):
    """Lista todos os artigos com filtros opcionais (admin completo)."""
    try:
        base_query = db.query(NewsArticle)

        # Filtros
        if status and status != "all":
            statuses = [s.strip() for s in status.split(",") if s.strip()]
            if len(statuses) == 1:
                base_query = base_query.filter(NewsArticle.status == statuses[0])
            else:
                base_query = base_query.filter(NewsArticle.status.in_(statuses))
        if category and category != "all":
            base_query = base_query.filter(NewsArticle.category == category)
        if q:
            base_query = base_query.filter(NewsArticle.title.ilike(f"%{q}%"))

        # COUNT via subquery — um único passe na tabela
        total = db.query(func.count()).select_from(
            base_query.order_by(None).subquery()
        ).scalar() or 0

        articles = (
            base_query.order_by(NewsArticle.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "articles": [_article_payload(a) for a in articles],
        }
    except Exception as exc:
        logger.error("admin_list_articles falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro interno") from None


# ─── Detalhe ──────────────────────────────────────────────────────────────────


@router.get("/articles/{slug}")
def admin_get_article(slug: str, db=Depends(get_db), _auth=Depends(require_api_key)):
    """Retorna um artigo completo (inclui content) para edição."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        article = db.query(NewsArticle).filter(NewsArticle.slug == slug).first()
        if not article:
            raise HTTPException(status_code=404, detail="Artigo não encontrado")
        payload = _article_payload(article)
        payload["content"] = article.content
        payload["sources"] = article.sources
        return payload
    finally:
        if owns_session:
            db.close()


# ─── Atualização ─────────────────────────────────────────────────────────────


@router.patch("/articles/{slug}")
def admin_update_article(
    slug: str,
    data: AdminArticleUpdate,
    db=Depends(get_db),
    _auth=Depends(require_api_key),
):
    """Atualiza campos editáveis de um artigo (title, summary, content, category, image_url, scores, status)."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        article = (
            db.query(NewsArticle)
            .filter(NewsArticle.slug == slug)
            .with_for_update()
            .first()
        )
        if not article:
            raise HTTPException(status_code=404, detail="Artigo não encontrado")

        changes = data.model_dump(exclude_unset=True)

        # Valida categoria se fornecida
        if "category" in changes:
            cat = category_name(changes["category"])
            if cat not in CATEGORIES:
                raise HTTPException(status_code=422, detail="Categoria inválida")
            changes["category"] = cat

        # Valida image_url básica
        if "image_url" in changes and changes["image_url"]:
            url = changes["image_url"]
            if not url.startswith(("http://", "https://")):
                raise HTTPException(status_code=422, detail="image_url deve começar com http/https")

        # Promoção para published usa publisher
        if changes.get("status") == "published" and article.status != "published":
            ArticlePublisher(db).publish_existing(article)
            changes.pop("status", None)  # publisher já trata

        for field, value in changes.items():
            if hasattr(article, field):
                setattr(article, field, value)

        article.updated_at = datetime.now(timezone.utc)
        changed_fields = ",".join(sorted(changes)) or "none"
        db.add(
            PublicationLog(
                article_id=article.id,
                action="admin_update",
                reporter_id=article.reporter_id,
                details=f"Admin editou: {changed_fields}",
            )
        )
        db.commit()
        return {"status": "ok", "slug": slug, "updated": sorted(changes.keys())}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("admin_update_article falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro interno") from None
    finally:
        if owns_session:
            db.close()


# ─── Arquivar (soft delete) ───────────────────────────────────────────────────


@router.delete("/articles/{slug}")
def admin_archive_article(slug: str, db=Depends(get_db), _auth=Depends(require_api_key)):
    """Arquiva um artigo (soft delete — status → archived, nunca excluído do banco)."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        article = (
            db.query(NewsArticle)
            .filter(NewsArticle.slug == slug)
            .with_for_update()
            .first()
        )
        if not article:
            raise HTTPException(status_code=404, detail="Artigo não encontrado")
        if article.status == "archived":
            return {"status": "ok", "slug": slug, "message": "Já arquivado"}

        article.status = "archived"
        article.updated_at = datetime.now(timezone.utc)
        db.add(
            PublicationLog(
                article_id=article.id,
                action="admin_archive",
                reporter_id=article.reporter_id,
                details="Arquivado via painel admin",
            )
        )
        db.commit()
        return {"status": "ok", "slug": slug}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("admin_archive_article falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro interno") from None
    finally:
        if owns_session:
            db.close()


# ─── Stats rápidas para dashboard ────────────────────────────────────────────


@router.get("/stats")
def admin_stats(db=Depends(get_db), _auth=Depends(require_api_key)):
    """Contagens por status para o dashboard."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        rows = (
            db.query(NewsArticle.status, func.count().label("n"))
            .group_by(NewsArticle.status)
            .all()
        )
        by_status = {r.status: r.n for r in rows}
        total_reporters = db.query(Reporter).count()
        return {
            "by_status": by_status,
            "total_published": by_status.get("published", 0),
            "total_pending": sum(
                by_status.get(s, 0) for s in ("draft", "classified", "review", "rewritten")
            ),
            "total_reporters": total_reporters,
            "total_archived": by_status.get("archived", 0),
        }
    except Exception as exc:
        logger.error("admin_stats falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro interno") from None
    finally:
        if owns_session:
            db.close()
