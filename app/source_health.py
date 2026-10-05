"""Persistência leve da saúde operacional das fontes editoriais."""

import os
from datetime import datetime, timezone
from urllib.parse import urlsplit

import requests

from app.database import get_session
from app.schema import ScrapingTask, SourcePortal


def _base_url(url: str) -> str:
    parsed = urlsplit(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def image_is_hotlink_blocked(source_url: str, image_url: str) -> bool:
    """Detecta rejeição explícita da imagem no contexto do Portal.

    A verificação ocorre somente para artigo novo e já extraído; assim a taxa
    reflete o que o Portal de fato tentou usar como imagem de capa.
    """
    if not image_url:
        return False
    site_url = os.getenv("SITE_URL") or os.getenv("NEXT_PUBLIC_SITE_URL") or "https://www.portalcerrado.com.br"
    try:
        response = requests.get(
            image_url,
            headers={"Referer": site_url.rstrip("/") + "/", "User-Agent": "PortalCerrado/1.0"},
            timeout=5,
            stream=True,
        )
        response.close()
        return response.status_code in {401, 403}
    except requests.RequestException:
        # Falhas transitórias não desativam uma fonte; ficam registradas nos
        # erros normais da coleta.
        return False


def record_scan_health(scan_results: dict, persistence: dict) -> None:
    """Registra uma linha auditável por fonte, sem interromper a coleta."""
    by_source = persistence.get("by_source", {})
    db = get_session()
    try:
        for name, result in (scan_results.get("portals") or {}).items():
            url = result.get("url") or ""
            if not url:
                continue
            base = _base_url(url)
            portal = db.query(SourcePortal).filter(SourcePortal.url == base).first()
            if portal is None:
                portal = SourcePortal(name=name, url=base)
                db.add(portal)
                db.flush()
            metrics = by_source.get(name, {})
            status = result.get("status") or "failed"
            articles_found = len(result.get("articles") or [])
            duplicates = metrics.get("duplicates", 0)
            portal.last_checked = datetime.now(timezone.utc)
            portal.last_error = result.get("error") if status != "success" else None
            db.add(
                ScrapingTask(
                    portal_id=portal.id,
                    task_type="scan",
                    status=status,
                    completed_at=datetime.now(timezone.utc),
                    error_message=result.get("error"),
                    result_json={
                        "articles_found": articles_found,
                        "inserted": metrics.get("inserted", 0),
                        "duplicates": duplicates,
                        "errors": metrics.get("errors", 0),
                        "success_rate": 1.0 if status == "success" else 0.0,
                        "duplicate_rate": round(duplicates / articles_found, 4) if articles_found else 0.0,
                        "robots_blocked": status == "blocked",
                        "image_blocked": metrics.get("image_blocked", 0),
                    },
                )
            )
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
