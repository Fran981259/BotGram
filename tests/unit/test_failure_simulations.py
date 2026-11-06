"""Simulações offline dos caminhos de falha críticos."""

import json

import pytest
import requests


def test_api_health_returns_503_when_database_is_unavailable(monkeypatch) -> None:
    from app.main import health_check

    def fail_session():
        raise RuntimeError("database unavailable")

    monkeypatch.setattr("app.main.get_session", fail_session)
    response = health_check()
    assert response.status_code == 503
    assert json.loads(response.body) == {"status": "unhealthy", "database": "unavailable"}


def test_maintenance_health_degrades_when_database_fails(monkeypatch) -> None:
    from app.tasks.maintenance import system_health_check

    monkeypatch.setattr("app.database.get_session", lambda: (_ for _ in ()).throw(RuntimeError("db down")))
    result = system_health_check()
    assert result["status"] == "unhealthy"
    assert result["checks"]["database"].startswith("fail:")


def test_llm_network_failure_exhausts_bounded_retries(monkeypatch) -> None:
    from app.llm_client import LLMClient

    attempts = 0

    def fail_post(*_args, **_kwargs):
        nonlocal attempts
        attempts += 1
        raise requests.ConnectionError("provider unavailable")

    monkeypatch.setattr("app.llm_client.requests.post", fail_post)
    monkeypatch.setattr("time.sleep", lambda *_args, **_kwargs: None)
    client = LLMClient(api_key="test", provider="openai")
    with pytest.raises(requests.ConnectionError):
        client._post_with_backoff("https://example.invalid", {})
    assert attempts == client.MAX_ATTEMPTS


def test_news_read_endpoint_works_without_celery(monkeypatch) -> None:
    """Leitura de artigos não depende do Celery/broker — falha do worker não afeta /api/news."""
    from fastapi.testclient import TestClient

    from app.main import app

    # Simula broker inacessível tornando qualquer import de Celery inútil
    monkeypatch.setattr("app.celery_app.celery_app.send_task", lambda *a, **k: (_ for _ in ()).throw(Exception("broker down")))

    client = TestClient(app)
    r = client.get("/api/news?limit=1")
    # 200 (artigos no banco) ou 503 (banco vazio/erro) — nunca erro de broker
    assert r.status_code in (200, 503), f"status inesperado: {r.status_code}"
    assert "broker" not in r.text.lower(), "resposta não deve mencionar broker"


def test_production_structured_log_emits_required_fields(monkeypatch, capsys) -> None:
    """Em ENVIRONMENT=production o logger emite JSON com os campos obrigatórios."""
    import app.main as main_module

    monkeypatch.setenv("ENVIRONMENT", "production")

    # Recarrega a configuração do logger com o novo env
    from loguru import logger as _logger
    _logger.remove()
    _logger.add(main_module._structured_sink, level="DEBUG")

    _logger.info("evento de teste")
    captured = capsys.readouterr()

    assert captured.out.strip(), "nenhuma saída produzida pelo sink estruturado"
    entry = json.loads(captured.out.strip())
    for field in ("timestamp", "level", "service", "event"):
        assert field in entry, f"campo obrigatório ausente no log estruturado: {field!r}"
    assert entry["service"] == "portal-cerrado"
    assert entry["event"] == "evento de teste"
