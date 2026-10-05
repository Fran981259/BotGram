"""Rotas do painel admin — Analytics & Métricas de Alcance.

Endpoints:
  GET /api/admin/analytics/overview → KPIs consolidados, histórico diário, top artigos, categorias e repórteres.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from loguru import logger
from sqlalchemy import func

from app.admin_analytics_audience import audience_insights
from app.contracts import iso_utc
from app.database import get_db, get_session
from app.schema import NewsArticle, PageView, Reporter
from app.security import require_api_key

router = APIRouter(prefix="/api/admin/analytics", tags=["admin-analytics"])


def _calculate_timeline(db, start_date: datetime, end_date: datetime, days: int) -> List[Dict]:
    """Agrupa pageviews e artigos publicados por dia."""
    daily_data = {}
    for i in range(days + 1):
        d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        daily_data[d] = {"date": d, "views": 0, "articles": 0}

    # Contagem de pageviews por dia
    try:
        pvs = (
            db.query(
                func.date(PageView.created_at).label("day"),
                func.count().label("n"),
            )
            .filter(PageView.created_at >= start_date)
            .group_by(func.date(PageView.created_at))
            .all()
        )
        for row in pvs:
            day_str = str(row.day)
            if day_str in daily_data:
                daily_data[day_str]["views"] = row.n
    except Exception:
        pass

    # Contagem de artigos publicados por dia
    try:
        arts = (
            db.query(
                func.date(NewsArticle.published_at).label("day"),
                func.count().label("n"),
            )
            .filter(
                NewsArticle.status == "published",
                NewsArticle.published_at >= start_date,
            )
            .group_by(func.date(NewsArticle.published_at))
            .all()
        )
        for row in arts:
            day_str = str(row.day)
            if day_str in daily_data:
                daily_data[day_str]["articles"] = row.n
    except Exception:
        pass

    return sorted(daily_data.values(), key=lambda x: x["date"])


def _get_top_articles(db, limit: int = 10) -> List[Dict]:
    """Retorna os artigos mais lidos e seus scores."""
    try:
        # Agrupa pageviews por path
        pv_counts = (
            db.query(PageView.path, func.count().label("views"))
            .group_by(PageView.path)
            .order_by(func.count().desc())
            .limit(limit * 2)
            .all()
        )

        slug_views = {}
        for row in pv_counts:
            p = row.path.strip("/")
            if p.startswith("noticia/"):
                slug = p.replace("noticia/", "").split("?")[0]
                slug_views[slug] = row.views

        articles = (
            db.query(
                NewsArticle.id,
                NewsArticle.slug,
                NewsArticle.title,
                NewsArticle.category,
                NewsArticle.importance_score,
                NewsArticle.engagement_score,
                NewsArticle.published_at,
            )
            .filter(NewsArticle.status == "published")
            .order_by(NewsArticle.published_at.desc())
            .limit(limit)
            .all()
        )

        result = []
        for a in articles:
            views = slug_views.get(a.slug, 0)
            result.append(
                {
                    "id": a.id,
                    "slug": a.slug,
                    "title": a.title,
                    "category": a.category,
                    "views": views,
                    "engagement_score": a.engagement_score or 0,
                    "importance_score": a.importance_score or 0,
                    "published_at": iso_utc(a.published_at),
                }
            )

        result.sort(key=lambda x: (x["views"], x["engagement_score"]), reverse=True)
        return result[:limit]
    except Exception as exc:
        logger.error("Erro ao buscar top articles: %s", exc)
        return []


def _get_category_distribution(db) -> List[Dict]:
    """Retorna distribuição de artigos por categoria."""
    try:
        rows = (
            db.query(NewsArticle.category, func.count().label("n"))
            .filter(NewsArticle.status == "published")
            .group_by(NewsArticle.category)
            .order_by(func.count().desc())
            .all()
        )
        total = sum(r.n for r in rows) or 1
        return [
            {
                "category": r.category or "Geral",
                "count": r.n,
                "percentage": round((r.n / total) * 100, 1),
            }
            for r in rows
        ]
    except Exception:
        return []


def _get_reporter_performance(db) -> List[Dict]:
    """Retorna métricas de produção por repórter IA."""
    try:
        reps = db.query(Reporter).order_by(Reporter.articles_published.desc()).all()
        return [
            {
                "name": r.display_name,
                "slug": r.slug,
                "role": r.role,
                "articles_published": r.articles_published or 0,
                "stage": r.personality_stage or "newborn",
                "active": bool(r.active),
            }
            for r in reps
        ]
    except Exception:
        return []


def _get_top_referrers(db, limit: int = 5) -> List[Dict]:
    """Retorna principais fontes de tráfego."""
    try:
        rows = (
            db.query(PageView.referrer, func.count().label("views"))
            .filter(PageView.referrer.isnot(None), PageView.referrer != "")
            .group_by(PageView.referrer)
            .order_by(func.count().desc())
            .limit(limit)
            .all()
        )
        return [{"referrer": r.referrer, "views": r.views} for r in rows]
    except Exception:
        return []


@router.get("/overview")
def analytics_overview(
    days: int = Query(default=30, ge=7, le=90),
    db=Depends(get_db),
    _auth=Depends(require_api_key),
):
    """Retorna visão geral completa de métricas de audiência e produção."""
    owns_session = False
    if not hasattr(db, "query"):
        db = get_session()
        owns_session = True
    try:
        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=days)

        total_pvs = db.query(func.count(PageView.id)).scalar() or 0
        period_pvs = (
            db.query(func.count(PageView.id))
            .filter(PageView.created_at >= start_date)
            .scalar()
            or 0
        )

        total_published = (
            db.query(func.count(NewsArticle.id))
            .filter(NewsArticle.status == "published")
            .scalar()
            or 0
        )
        period_published = (
            db.query(func.count(NewsArticle.id))
            .filter(
                NewsArticle.status == "published",
                NewsArticle.published_at >= start_date,
            )
            .scalar()
            or 0
        )

        avg_scores = (
            db.query(
                func.avg(NewsArticle.importance_score).label("avg_imp"),
                func.avg(NewsArticle.engagement_score).label("avg_eng"),
            )
            .filter(NewsArticle.status == "published")
            .first()
        )

        return {
            "period_days": days,
            "generated_at": iso_utc(now),
            "kpis": {
                "total_pageviews": total_pvs,
                "period_pageviews": period_pvs,
                "total_published": total_published,
                "period_published": period_published,
                "avg_importance_score": round(float(avg_scores.avg_imp or 0), 1),
                "avg_engagement_score": round(float(avg_scores.avg_eng or 0), 1),
            },
            "timeline": _calculate_timeline(db, start_date, now, days),
            "top_articles": _get_top_articles(db, limit=10),
            "categories": _get_category_distribution(db),
            "reporters": _get_reporter_performance(db),
            "top_referrers": _get_top_referrers(db, limit=5),
            # O enriquecimento de audiência nunca pode impedir a visualização
            # dos KPIs históricos já existentes.
            "audience": _safe_audience_insights(db, start_date, now, days),
        }
    except Exception as exc:
        logger.error("analytics_overview falhou (%s)", type(exc).__name__)
        raise HTTPException(status_code=503, detail="Erro ao gerar analytics") from None
    finally:
        if owns_session:
            db.close()


def _safe_audience_insights(db, start_date: datetime, now: datetime, days: int) -> Dict:
    try:
        return audience_insights(db, start_date, now, days)
    except Exception as exc:
        logger.error("analytics audience enrichment failed (%s)", type(exc).__name__)
        return {
            "previous_pageviews": 0,
            "pageview_change_percent": None,
            "traffic_channels": [],
            "top_pages": [],
            "tracked_note": "Dados de audiência detalhados temporariamente indisponíveis.",
        }
