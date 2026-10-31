"""First-party, rate-limited page-view tracking routes."""

import ipaddress
import json
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from loguru import logger
from pydantic import BaseModel, Field

from app.database import get_db
from app.rate_limit import is_rate_limited
from app.security import trusted_proxy_hosts

router = APIRouter()
_WINDOW_SECONDS = 60
_MAX_REQUESTS = 30
_GEO_TTL = 86_400  # 24h cache por IP


class TrackRequest(BaseModel):
    path: str = Field(..., max_length=500)
    referrer: str = Field(default="", max_length=500)


class UpdateTimeRequest(BaseModel):
    view_id: int
    seconds: int = Field(..., ge=1, le=86400)


@router.post("/api/analytics/track")
def track_pageview(request_data: TrackRequest, request: Request, db=Depends(get_db)):
    """Registra pageview com cidade, device e retorna view_id para atualizar tempo depois."""
    try:
        limited = _is_rate_limited(request)
    except RuntimeError:
        return JSONResponse(status_code=503, content={"status": "rate_limit_unavailable"})
    if limited:
        return {"status": "rate_limited"}

    client_ip = _client_ip(request)
    city, country = _lookup_geo(client_ip)
    device = _detect_device(request.headers.get("user-agent", ""))

    try:
        from app.schema import PageView

        pv = PageView(
            path=request_data.path,
            referrer=request_data.referrer.split("?")[0] if request_data.referrer else "",
            city=city,
            country=country,
            device_type=device,
        )
        db.add(pv)
        db.commit()
        db.refresh(pv)
        return {"status": "ok", "view_id": pv.id}
    except Exception as error:
        logger.error("Erro no tracking de analytics (%s)", type(error).__name__)
        raise HTTPException(status_code=503, detail="Analytics temporariamente indisponível") from None


@router.post("/api/analytics/update_time")
def update_time_on_page(payload: UpdateTimeRequest, db=Depends(get_db)):
    """Atualiza o tempo gasto na página enviado pelo beacon ao sair."""
    try:
        from app.schema import PageView

        pv = db.get(PageView, payload.view_id)
        if pv and pv.time_on_page is None:
            pv.time_on_page = min(payload.seconds, 86400)
            db.commit()
        return {"status": "ok"}
    except Exception as error:
        logger.error("Erro ao atualizar time_on_page (%s)", type(error).__name__)
        return {"status": "error"}


# ── helpers ──────────────────────────────────────────────────────────────────

def _lookup_geo(ip: str) -> tuple[str | None, str | None]:
    """Retorna (city, country) do IP via ip-api.com com cache Redis de 24h."""
    try:
        import redis as redis_lib

        redis_url = os.environ.get("REDIS_URL", "")
        r = redis_lib.from_url(redis_url, socket_timeout=1)
        cache_key = f"geo:{ip}"
        cached = r.get(cache_key)
        if cached:
            data = json.loads(cached)
            return data.get("city"), data.get("country")
    except Exception:
        r = None

    # IPs privados / locais não têm geo
    try:
        addr = ipaddress.ip_address(ip)
        if addr.is_private or addr.is_loopback or addr.is_unspecified:
            return None, None
    except ValueError:
        return None, None

    try:
        resp = httpx.get(
            f"http://ip-api.com/json/{ip}",
            params={"fields": "status,city,country", "lang": "pt"},
            timeout=2.0,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "success":
                city = data.get("city") or None
                country = data.get("country") or None
                if r:
                    try:
                        r.setex(cache_key, _GEO_TTL, json.dumps({"city": city, "country": country}))
                    except Exception:
                        pass
                return city, country
    except Exception:
        pass

    return None, None


def _detect_device(ua: str) -> str:
    ua_lower = ua.lower()
    if "tablet" in ua_lower or "ipad" in ua_lower:
        return "tablet"
    if "mobile" in ua_lower or "android" in ua_lower or "iphone" in ua_lower:
        return "mobile"
    return "desktop"


def _is_rate_limited(request: Request) -> bool:
    client_ip = _client_ip(request)
    return is_rate_limited(f"portal:analytics:{client_ip}", _MAX_REQUESTS, _WINDOW_SECONDS)


def _client_ip(request: Request) -> str:
    immediate = request.client.host if request.client else "unknown"
    hosts = trusted_proxy_hosts()
    if immediate not in hosts and "*" not in hosts:
        return immediate
    forwarded = request.headers.get("x-forwarded-for", "")
    for candidate in forwarded.split(","):
        value = candidate.strip()
        try:
            ipaddress.ip_address(value)
            return value
        except ValueError:
            continue
    return immediate
