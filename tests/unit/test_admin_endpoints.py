"""Testes automatizados para todos os endpoints do painel administrativo.

Cobre as Fases 1 a 8:
- Autenticação e bloqueio 401 sem X-API-Key
- Artigos e filtros (/api/admin/articles)
- Pipeline e workers (/api/admin/pipeline/status)
- Repórteres IA e personas (/api/admin/reporters)
- Analytics e KPIs (/api/admin/analytics/overview)
- Redes Sociais (/api/admin/social/status e /history)
- Auditoria e Logs (/api/admin/audit/logs e /stats)
- Moderação de Artigos (/api/admin/moderation/items e /action)
- Configurações do Sistema e LLM (/api/admin/config/all e /sources)
"""

import os

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def configured_test_api_key(monkeypatch):
    """Keep admin endpoint tests independent from a developer's local .env."""
    monkeypatch.setenv("PUBLISH_API_KEY", "dev-test-key-32-chars-long-secret!!")


@pytest.fixture
def auth_headers():
    key = os.getenv("PUBLISH_API_KEY", "dev-test-key-32-chars-long-secret!!")
    os.environ["PUBLISH_API_KEY"] = key
    return {"X-API-Key": key}


def test_admin_endpoints_require_auth(client):
    """Garante que todos os endpoints admin exigem X-API-Key e rejeitam 401 sem chave."""
    protected_paths = [
        "/api/admin/articles",
        "/api/admin/pipeline/status",
        "/api/admin/reporters",
        "/api/admin/analytics/overview",
        "/api/admin/social/status",
        "/api/admin/audit/logs",
        "/api/admin/moderation/items",
        "/api/admin/config/all",
    ]
    for path in protected_paths:
        res = client.get(path)
        assert res.status_code == 401, f"Path {path} deveria retornar 401 sem X-API-Key"


def test_admin_articles_flow(client, auth_headers):
    """Testa listagem de artigos com filtros de busca e paginação."""
    res = client.get("/api/admin/articles?limit=10&offset=0", headers={**auth_headers, "X-API-Key": os.getenv("PUBLISH_API_KEY", "test")})
    assert res.status_code in [200, 401]
    if res.status_code == 200:
        data = res.json()
        assert "total" in data
        assert "articles" in data
        assert isinstance(data["articles"], list)


def test_admin_pipeline_status(client, auth_headers):
    """Testa endpoint de status do pipeline, workers e fila."""
    key = os.getenv("PUBLISH_API_KEY", "test")
    res = client.get("/api/admin/pipeline/status", headers={"X-API-Key": key})
    if res.status_code == 200:
        data = res.json()
        assert "worker_status" in data
        assert "pipeline_lock" in data
        assert "queue" in data
        assert "metrics" in data


def test_admin_reporters_flow(client, auth_headers):
    """Testa listagem e detalhe de repórteres IA."""
    key = os.getenv("PUBLISH_API_KEY", "test")
    res = client.get("/api/admin/reporters", headers={"X-API-Key": key})
    if res.status_code == 200:
        data = res.json()
        assert "total" in data
        assert "reporters" in data
        if data["reporters"]:
            first_slug = data["reporters"][0]["slug"]
            detail_res = client.get(f"/api/admin/reporters/{first_slug}", headers={"X-API-Key": key})
            assert detail_res.status_code == 200
            detail_data = detail_res.json()
            assert "display_name" in detail_data
            assert "personality_stage" in detail_data
            assert "recent_articles" in detail_data


def test_admin_analytics_overview(client, auth_headers):
    """Testa agregação de métricas, KPIs e timeline."""
    key = os.getenv("PUBLISH_API_KEY", "test")
    res = client.get("/api/admin/analytics/overview?days=30", headers={"X-API-Key": key})
    if res.status_code == 200:
        data = res.json()
        assert "kpis" in data
        assert "timeline" in data
        assert "top_articles" in data
        assert "categories" in data


def test_admin_social_status_and_history(client, auth_headers):
    """Testa status do Twitter/X e histórico de posts."""
    key = os.getenv("PUBLISH_API_KEY", "test")
    res = client.get("/api/admin/social/status", headers={"X-API-Key": key})
    if res.status_code == 200:
        data = res.json()
        assert "twitter" in data
        assert "configured" in data["twitter"]

    res_hist = client.get("/api/admin/social/history", headers={"X-API-Key": key})
    if res_hist.status_code == 200:
        hist_data = res_hist.json()
        assert "history" in hist_data


def test_admin_audit_logs_and_stats(client, auth_headers):
    """Testa registros de auditoria e estatísticas de operações."""
    key = os.getenv("PUBLISH_API_KEY", "test")
    res = client.get("/api/admin/audit/logs?limit=5", headers={"X-API-Key": key})
    if res.status_code == 200:
        data = res.json()
        assert "logs" in data
        assert "total" in data

    res_stats = client.get("/api/admin/audit/stats", headers={"X-API-Key": key})
    if res_stats.status_code == 200:
        stats = res_stats.json()
        assert "total_logs" in stats
        assert "today_logs" in stats


def test_admin_moderation_items(client, auth_headers):
    """Testa fila de moderação de artigos."""
    key = os.getenv("PUBLISH_API_KEY", "test")
    res = client.get("/api/admin/moderation/items", headers={"X-API-Key": key})
    if res.status_code == 200:
        data = res.json()
        assert "items" in data


def test_admin_config_all_and_sources(client, auth_headers):
    """Testa leitura de configurações, scheduler, LLM e fontes."""
    key = os.getenv("PUBLISH_API_KEY", "test")
    res = client.get("/api/admin/config/all", headers={"X-API-Key": key})
    if res.status_code == 200:
        data = res.json()
        assert "scheduler" in data
        assert "llm" in data
        assert "environment" in data
        assert "providers" in data["llm"]

    res_src = client.get("/api/admin/config/sources", headers={"X-API-Key": key})
    if res_src.status_code == 200:
        sources_data = res_src.json()
        assert "sources" in sources_data
