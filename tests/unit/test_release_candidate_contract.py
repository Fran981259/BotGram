"""Contratos estáticos do candidato de deploy (Fase 10).

Verificam que os artefatos de release estão no formato esperado
sem executar Docker, fazer push de imagem ou acessar infra externa.
"""

from pathlib import Path

import yaml

_DEPLOY = Path(".github/workflows/deploy.yml")
_SWARM = Path("docker-stack.swarm.yml")
_UPDATE = Path("scripts/update.sh")
_ROLLBACK = Path("scripts/rollback.sh")
_CADDY = Path("Caddyfile")


def test_deploy_workflow_requires_all_three_gates_before_publish() -> None:
    """Publish não pode rodar sem dependency-inventory, test-backend e lint-frontend."""
    workflow = yaml.safe_load(_DEPLOY.read_text(encoding="utf-8"))
    needs = set(workflow["jobs"]["publish"].get("needs", []))

    assert "dependency-inventory" in needs
    assert "test-backend" in needs
    assert "lint-frontend" in needs


def test_deploy_workflow_uses_sha_pinned_images_not_latest() -> None:
    """Imagens publicadas devem referenciar github.sha, não :latest."""
    content = _DEPLOY.read_text(encoding="utf-8")

    assert "${{ github.sha }}" in content, "deploy.yml deve usar github.sha nas tags"
    assert ":latest" not in content, "deploy.yml não pode usar tag :latest"


def test_swarm_stack_defines_minimum_required_services() -> None:
    """Stack Swarm deve declarar pelo menos os serviços essenciais."""
    stack = yaml.safe_load(_SWARM.read_text(encoding="utf-8"))
    services = set(stack.get("services", {}).keys())

    for required in ("portal_cerrado", "frontend", "postgres", "redis", "caddy"):
        assert required in services, f"serviço obrigatório ausente na stack: {required}"


def test_update_script_references_swarm_stack_and_sha() -> None:
    """update.sh deve usar docker-stack.swarm.yml e fixar imagens pelo SHA do commit."""
    script = _UPDATE.read_text(encoding="utf-8")

    assert "docker-stack.swarm.yml" in script
    assert "git rev-parse HEAD" in script
    assert ":latest" not in script


def test_rollback_script_requires_confirmation_before_docker_calls() -> None:
    """rollback.sh deve exigir ROLLBACK_APPROVED=yes antes de chamar Docker."""
    script = _ROLLBACK.read_text(encoding="utf-8")

    assert "ROLLBACK_APPROVED" in script, "rollback.sh deve checar ROLLBACK_APPROVED"
    assert "docker" in script.lower(), "rollback.sh deve conter chamadas Docker"


def test_caddyfile_exists_and_references_portal_cerrado_backend() -> None:
    """Caddyfile deve existir e rotear para o backend."""
    content = _CADDY.read_text(encoding="utf-8")

    assert "portal_cerrado" in content or "portal-cerrado" in content or "8000" in content, (
        "Caddyfile deve referenciar o backend (portal_cerrado, portal-cerrado ou porta 8000)"
    )


def test_swarm_stack_all_app_images_use_env_var_not_hardcoded() -> None:
    """Imagens da aplicação devem usar variáveis de ambiente (BACKEND_IMAGE / FRONTEND_IMAGE)."""
    content = _SWARM.read_text(encoding="utf-8")

    assert "BACKEND_IMAGE" in content, "stack deve usar ${BACKEND_IMAGE} para o backend"
    assert "FRONTEND_IMAGE" in content, "stack deve usar ${FRONTEND_IMAGE} para o frontend"
    assert "ghcr.io/fran981259/portal-cerrado-backend:latest" not in content
    assert "ghcr.io/fran981259/portal-cerrado-frontend:latest" not in content
