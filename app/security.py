"""Authentication dependencies shared by protected API routes."""

import os
import secrets

from fastapi import Header, HTTPException


def trusted_proxy_hosts() -> set[str]:
    """Return the proxy allowlist and fail closed on wildcard production config."""
    raw = os.getenv("TRUSTED_PROXY_HOSTS", "127.0.0.1,::1")
    hosts = {value.strip() for value in raw.split(",") if value.strip()}
    if "*" in hosts and os.getenv("ENVIRONMENT", "development").lower() == "production":
        raise RuntimeError("TRUSTED_PROXY_HOSTS não pode usar wildcard em produção")
    return hosts or {"127.0.0.1", "::1"}


def require_api_key(x_api_key: str = Header(None)):
    """Validate the operator key without exposing its configured value."""
    expected = os.getenv("PUBLISH_API_KEY") or os.getenv("API_KEY")
    if not expected:
        raise HTTPException(status_code=503, detail="Publicacao indisponivel: autenticacao nao configurada")
    if os.getenv("ENVIRONMENT", "development").lower() == "production" and len(expected) < 32:
        raise HTTPException(status_code=503, detail="Publicacao indisponivel: chave de autenticacao fraca")
    previous = os.getenv("PUBLISH_API_KEY_PREVIOUS", "")
    valid_keys = [expected] + ([previous] if previous else [])
    if not isinstance(x_api_key, str) or not any(secrets.compare_digest(x_api_key, key) for key in valid_keys):
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")
