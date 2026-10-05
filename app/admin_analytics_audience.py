"""Helpers de agregação de audiência para analytics administrativo."""

from datetime import datetime, timedelta
from typing import Dict
from urllib.parse import urlparse

from sqlalchemy import func

from app.schema import PageView


def traffic_channel(referrer: str) -> str:
    """Classifica a origem sem armazenar IP, cookie ou identificador pessoal."""
    host = urlparse(referrer).netloc.lower()
    if not host:
        return "Direto"
    if any(name in host for name in ("google.", "bing.", "duckduckgo.", "yahoo.")):
        return "Busca"
    if any(name in host for name in ("facebook.", "instagram.", "x.com", "twitter.", "t.co", "linkedin.")):
        return "Social"
    if "whatsapp" in host or "web.whatsapp" in host:
        return "Mensagens"
    return "Referência"


def audience_insights(db, start_date: datetime, now: datetime, days: int) -> Dict:
    """Consolida audiência agregada do período, sem perfil individual do leitor."""
    rows = (
        db.query(PageView.path, PageView.referrer, func.count().label("views"))
        .filter(PageView.created_at >= start_date)
        .group_by(PageView.path, PageView.referrer)
        .all()
    )
    path_views, channels = {}, {}
    for row in rows:
        views = int(row.views)
        path_views[row.path] = path_views.get(row.path, 0) + views
        channel = traffic_channel(row.referrer or "")
        channels[channel] = channels.get(channel, 0) + views

    previous_start = start_date - timedelta(days=days)
    previous_views = (
        db.query(func.count(PageView.id))
        .filter(PageView.created_at >= previous_start, PageView.created_at < start_date)
        .scalar()
        or 0
    )
    period_views = sum(path_views.values())
    change = round(((period_views - previous_views) / previous_views) * 100, 1) if previous_views else None
    top_pages = [
        {"path": path, "views": views, "type": "Matéria" if path.startswith("/noticia/") else "Página"}
        for path, views in sorted(path_views.items(), key=lambda item: item[1], reverse=True)[:10]
    ]
    return {
        "previous_pageviews": previous_views,
        "pageview_change_percent": change,
        "traffic_channels": [
            {"channel": name, "views": views, "percentage": round(views / period_views * 100, 1) if period_views else 0}
            for name, views in sorted(channels.items(), key=lambda item: item[1], reverse=True)
        ],
        "top_pages": top_pages,
        "tracked_note": "Métricas agregadas first-party; não há identificação individual de leitores.",
    }
