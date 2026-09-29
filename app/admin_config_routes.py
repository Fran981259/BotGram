"""Rotas do painel admin — Configurações do Sistema, Scheduler e Modelos LLM.

Endpoints:
  GET  /api/admin/config/all      → scheduler, provedores LLM, cadeia de failover e runtime
  POST /api/admin/config/test-llm → testa conexão com provedor LLM (Gemini, Groq, OpenAI)
  GET  /api/admin/config/sources  → lista portais e fontes monitoradas
"""

import os
import time
from pathlib import Path
from typing import Optional

import yaml
from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

from app.database import get_db, get_session
from app.llm_client import SUPPORTED_PROVIDERS, LLMClient, test_llm_connection
from app.schema import SourcePortal
from app.security import require_api_key

router = APIRouter(prefix="/api/admin/config", tags=["admin-config"])


class TestLLMPayload(BaseModel):
    provider: Optional[str] = Field(default=None)


def _load_scheduler_raw() -> dict:
    """Lê config/scheduler.yaml integralmente."""
    path = Path(__file__).resolve().parents[1] / "config" / "scheduler.yaml"
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


@router.get("/all")
def get_all_config(_auth=Depends(require_api_key)):
    """Retorna configuração completa do scheduler, LLMs e variáveis de runtime."""
    try:
        scheduler_data = _load_scheduler_raw()
        vol = scheduler_data.get("volume", {})
        anti = scheduler_data.get("anti_spam", {})
        peak = scheduler_data.get("peak_hours", {})

        active_provider = (os.getenv("LLM_PROVIDER") or "gemini").strip().lower()
        fallback_raw = os.getenv("LLM_FALLBACK_CHAIN", "gemini,groq,openai")
        fallback_chain = [p.strip().lower() for p in fallback_raw.split(",") if p.strip()]

        providers_info = []
        for p in SUPPORTED_PROVIDERS:
            is_active = p == active_provider
            api_key_set = False
            model = ""
            if p == "gemini":
                api_key_set = bool(os.getenv("GEMINI_API_KEY"))
                model = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
            elif p == "groq":
                api_key_set = bool(os.getenv("GROQ_API_KEY"))
                model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
            elif p == "openai":
                api_key_set = bool(os.getenv("OPENAI_API_KEY"))
                model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

            providers_info.append(
                {
                    "provider": p,
                    "is_primary": is_active,
                    "is_in_chain": p in fallback_chain,
                    "api_key_configured": api_key_set,
                    "model": model,
                }
            )

        return {
            "scheduler": {
                "update_interval_minutes": vol.get("update_interval_minutes", 30),
                "min_articles_per_day": vol.get("min_articles_per_day", 12),
                "ideal_articles_per_day": vol.get("ideal_articles_per_day", 20),
                "max_articles_per_day": vol.get("max_articles_per_day", 30),
                "articles_per_cycle": vol.get("articles_per_cycle", 2),
                "curiosities_enabled": vol.get("curiosities", {}).get("enabled", False),
                "anti_spam": {
                    "max_per_source_per_hour": anti.get("max_per_source_per_hour", 3),
                    "max_per_topic_per_day": anti.get("max_per_topic_per_day", 5),
                    "similarity_threshold": anti.get("similarity_threshold", 0.85),
                },
                "peak_hours": peak,
            },
            "llm": {
                "active_provider": active_provider,
                "fallback_chain": fallback_chain,
                "providers": providers_info,
            },
            "environment": {
                "env": os.getenv("ENVIRONMENT", "development"),
                "log_level": os.getenv("LOG_LEVEL", "INFO"),
                "redis_url_set": bool(os.getenv("REDIS_URL")),
                "sentry_enabled": bool(os.getenv("SENTRY_DSN")),
            },
        }
    except Exception as exc:
        logger.error("get_all_config falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro ao carregar configurações") from None


@router.post("/test-llm")
def test_llm_endpoint(payload: TestLLMPayload, _auth=Depends(require_api_key)):
    """Testa a conectividade com o provedor LLM especificado ou primário."""
    target_provider = (payload.provider or os.getenv("LLM_PROVIDER") or "gemini").strip().lower()
    if target_provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Provedor inválido. Suportados: {SUPPORTED_PROVIDERS}",
        )

    t0 = time.time()
    try:
        client = LLMClient(provider=target_provider)
        if not client.api_key:
            return {
                "provider": target_provider,
                "status": "error",
                "message": f"API key não configurada no .env para {target_provider}.",
                "latency_ms": 0,
            }

        ok = test_llm_connection(provider=target_provider)
        latency_ms = round((time.time() - t0) * 1000)

        if ok:
            return {
                "provider": target_provider,
                "status": "success",
                "message": f"Conexão com {target_provider.upper()} ({client.model}) estabelecida com sucesso!",
                "latency_ms": latency_ms,
            }
        else:
            return {
                "provider": target_provider,
                "status": "error",
                "message": f"Falha ao validar resposta do modelo {client.model}.",
                "latency_ms": latency_ms,
            }
    except Exception as exc:
        latency_ms = round((time.time() - t0) * 1000)
        logger.error("test_llm_endpoint falhou (%s)", type(exc).__name__)
        return {
            "provider": target_provider,
            "status": "error",
            "message": f"Erro de conexão ({type(exc).__name__}): {exc}",
            "latency_ms": latency_ms,
        }


@router.get("/sources")
def get_sources_list(db=Depends(get_db), _auth=Depends(require_api_key)):
    """Retorna lista de portais de notícias monitorados."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        sources = db.query(SourcePortal).all()
        return {
            "total": len(sources),
            "sources": [
                {
                    "id": s.id,
                    "name": s.name,
                    "url": s.url,
                    "type": s.type,
                }
                for s in sources
            ],
        }
    except Exception as exc:
        logger.error("get_sources_list falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro ao listar fontes") from None
    finally:
        if owns_session:
            db.close()
