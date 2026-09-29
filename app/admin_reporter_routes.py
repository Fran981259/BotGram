"""Rotas do painel admin — gestão e evolução de repórteres/agentes IA.

Endpoints:
  GET    /api/admin/reporters              → lista todos os repórteres com métricas
  POST   /api/admin/reporters              → cria novo repórter IA
  GET    /api/admin/reporters/{slug}       → detalhes, persona, prompt e artigos recentes
  PATCH  /api/admin/reporters/{slug}       → atualiza dados, persona e toggle ativo/inativo
  GET    /api/admin/reporters/{slug}/articles → lista artigos paginados do repórter
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

from app.contracts import iso_utc
from app.database import get_db, get_session
from app.personality import _age_days
from app.schema import NewsArticle, Reporter
from app.security import require_api_key

router = APIRouter(prefix="/api/admin/reporters", tags=["admin-reporters"])


class ReporterCreatePayload(BaseModel):
    slug: str = Field(..., min_length=2, max_length=100)
    display_name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(default="general", max_length=50)
    specialties: Optional[List[str]] = Field(default_factory=list)
    voice_profile: Optional[Dict[str, Any]] = Field(default_factory=dict)
    prompt_system: Optional[Any] = None
    attribution: Optional[str] = None
    active: bool = True


class ReporterUpdatePayload(BaseModel):
    display_name: Optional[str] = None
    role: Optional[str] = None
    specialties: Optional[List[str]] = None
    voice_profile: Optional[Dict[str, Any]] = None
    prompt_system: Optional[Any] = None
    attribution: Optional[str] = None
    active: Optional[bool] = None
    personality_stage: Optional[str] = None


def _serialize_reporter(r: Reporter, db=None) -> dict:
    """Serializa repórter incluindo métricas e data de publicação recente."""
    last_pub = None
    if db is not None:
        last_article = (
            db.query(NewsArticle.published_at)
            .filter(NewsArticle.reporter_id == r.id, NewsArticle.status == "published")
            .order_by(NewsArticle.published_at.desc())
            .first()
        )
        if last_article and last_article[0]:
            last_pub = iso_utc(last_article[0])

    return {
        "id": r.id,
        "slug": r.slug,
        "display_name": r.display_name,
        "email": r.email,
        "role": r.role,
        "specialties": r.specialties or [],
        "voice_profile": r.voice_profile or {},
        "prompt_system": r.prompt_system,
        "attribution": r.attribution,
        "articles_published": r.articles_published or 0,
        "experience_points": r.experience_points or 0,
        "personality_stage": r.personality_stage or "newborn",
        "age_days": _age_days(getattr(r, "birth_date", None)),
        "birth_date": iso_utc(r.birth_date),
        "active": bool(r.active),
        "last_published_at": last_pub,
        "created_at": iso_utc(r.created_at),
        "updated_at": iso_utc(r.updated_at),
    }


@router.get("")
def list_admin_reporters(db=Depends(get_db), _auth=Depends(require_api_key)):
    """Lista todos os repórteres (ativos e inativos) com métricas completas."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        reporters = db.query(Reporter).order_by(Reporter.articles_published.desc()).all()
        return {
            "total": len(reporters),
            "reporters": [_serialize_reporter(r, db) for r in reporters],
        }
    except Exception as exc:
        logger.error("list_admin_reporters falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro ao listar repórteres") from None
    finally:
        if owns_session:
            db.close()


@router.post("", status_code=201)
def create_admin_reporter(
    payload: ReporterCreatePayload, db=Depends(get_db), _auth=Depends(require_api_key)
):
    """Cria um novo repórter digital."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        slug = payload.slug.strip().lower()
        exists = db.query(Reporter).filter(Reporter.slug == slug).first()
        if exists:
            raise HTTPException(status_code=409, detail=f"Repórter com slug '{slug}' já existe.")

        now = datetime.now(timezone.utc)
        reporter = Reporter(
            slug=slug,
            display_name=payload.display_name.strip(),
            role=payload.role.strip(),
            specialties=payload.specialties or [],
            voice_profile=payload.voice_profile or {},
            prompt_system=payload.prompt_system,
            attribution=payload.attribution,
            active=payload.active,
            articles_published=0,
            experience_points=0,
            personality_stage="newborn",
            birth_date=now,
            created_at=now,
            updated_at=now,
        )
        db.add(reporter)
        db.commit()
        db.refresh(reporter)
        return _serialize_reporter(reporter, db)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("create_admin_reporter falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Erro ao criar repórter") from None
    finally:
        if owns_session:
            db.close()


@router.get("/{slug}")
def get_admin_reporter(slug: str, db=Depends(get_db), _auth=Depends(require_api_key)):
    """Retorna detalhes completos do repórter e os 8 artigos mais recentes."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        r = db.query(Reporter).filter(Reporter.slug == slug).first()
        if not r:
            raise HTTPException(status_code=404, detail="Repórter não encontrado.")

        articles = (
            db.query(
                NewsArticle.id,
                NewsArticle.slug,
                NewsArticle.title,
                NewsArticle.category,
                NewsArticle.status,
                NewsArticle.published_at,
                NewsArticle.created_at,
            )
            .filter(NewsArticle.reporter_id == r.id)
            .order_by(NewsArticle.created_at.desc())
            .limit(8)
            .all()
        )

        serialized = _serialize_reporter(r, db)
        serialized["recent_articles"] = [
            {
                "id": a.id,
                "slug": a.slug,
                "title": a.title,
                "category": a.category,
                "status": a.status,
                "published_at": iso_utc(a.published_at),
                "created_at": iso_utc(a.created_at),
            }
            for a in articles
        ]
        return serialized
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("get_admin_reporter falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Erro ao buscar repórter") from None
    finally:
        if owns_session:
            db.close()


@router.patch("/{slug}")
def patch_admin_reporter(
    slug: str,
    payload: ReporterUpdatePayload,
    db=Depends(get_db),
    _auth=Depends(require_api_key),
):
    """Atualiza atributos, persona, prompt ou toggle ativo/inativo do repórter."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        r = db.query(Reporter).filter(Reporter.slug == slug).first()
        if not r:
            raise HTTPException(status_code=404, detail="Repórter não encontrado.")

        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(r, field, value)

        r.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(r)
        return _serialize_reporter(r, db)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("patch_admin_reporter falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Erro ao atualizar repórter") from None
    finally:
        if owns_session:
            db.close()
