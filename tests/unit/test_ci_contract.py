from pathlib import Path

import yaml

_CI = Path(".github/workflows/ci.yml")
_DEPLOY = Path(".github/workflows/deploy.yml")
_PYTHON_VERSION = "3.12"


def _ci() -> dict:
    return yaml.safe_load(_CI.read_text(encoding="utf-8"))


def _deploy() -> dict:
    return yaml.safe_load(_DEPLOY.read_text(encoding="utf-8"))


# ── deploy.yml contracts ──────────────────────────────────────────────────────

def test_publish_workflow_requires_manual_dispatch_and_immutable_tags() -> None:
    workflow = _deploy()
    content = _DEPLOY.read_text(encoding="utf-8")

    assert workflow[True] == {"workflow_dispatch": None}
    assert ":latest" not in content
    assert "${{ github.sha }}" in content


def test_update_script_uses_swarm_stack_and_full_commit_sha() -> None:
    script = Path("scripts/update.sh").read_text(encoding="utf-8")

    assert "docker-stack.swarm.yml" in script
    assert "git rev-parse HEAD" in script
    assert "docker-compose.local.yml" in script
    assert ":latest" not in script


def test_publish_workflow_generates_dependency_inventory() -> None:
    workflow = _DEPLOY.read_text(encoding="utf-8")

    assert "dependency-inventory" in workflow
    assert "pip freeze --all" in workflow
    assert "npm ls --all --json" in workflow
    assert "actions/upload-artifact@v4" in workflow


def test_publish_requires_all_gates_before_build() -> None:
    """publish deve depender de dependency-inventory, test-backend e lint-frontend."""
    workflow = _deploy()
    publish_needs = set(workflow["jobs"]["publish"].get("needs", []))

    assert "dependency-inventory" in publish_needs, "publish não espera dependency-inventory"
    assert "test-backend" in publish_needs, "publish não espera test-backend"
    assert "lint-frontend" in publish_needs, "publish não espera lint-frontend"


def test_deploy_workflow_uses_correct_python_version() -> None:
    content = _DEPLOY.read_text(encoding="utf-8")
    assert f'python-version: "{_PYTHON_VERSION}"' in content, (
        f"deploy.yml deve usar Python {_PYTHON_VERSION} para alinhar com ambiente local"
    )


# ── ci.yml contracts ──────────────────────────────────────────────────────────

def test_ci_workflow_has_required_jobs() -> None:
    workflow = _ci()
    jobs = set(workflow["jobs"].keys())

    assert "lint-backend" in jobs, "CI não tem job lint-backend"
    assert "test-backend" in jobs, "CI não tem job test-backend"
    assert "lint-frontend" in jobs, "CI não tem job lint-frontend"
    assert "stack-contract" in jobs, "CI não tem job stack-contract (gate Swarm)"


def test_ci_test_backend_requires_lint_to_pass_first() -> None:
    workflow = _ci()
    needs = workflow["jobs"]["test-backend"].get("needs", [])

    assert "lint-backend" in needs, "test-backend deve aguardar lint-backend"


def test_ci_frontend_runs_tsc_and_audit_without_offline() -> None:
    content = _CI.read_text(encoding="utf-8")

    assert "tsc --noEmit" in content, "CI deve rodar tsc --noEmit no frontend"
    assert "npm audit --omit=dev --audit-level=high" in content, "CI deve auditar dependências"
    # --offline só pode aparecer em comentário, nunca em comando de auditoria
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        assert "--offline" not in stripped, (
            f"auditoria com --offline dá falso negativo — proibido em comando: {stripped!r}"
        )


def test_ci_workflow_uses_correct_python_version() -> None:
    content = _CI.read_text(encoding="utf-8")
    assert f'python-version: "{_PYTHON_VERSION}"' in content, (
        f"ci.yml deve usar Python {_PYTHON_VERSION} para alinhar com ambiente local"
    )


def test_ci_stack_contract_validates_rendered_output() -> None:
    content = _CI.read_text(encoding="utf-8")

    assert "docker compose" in content and "config" in content, "CI deve renderizar Compose"
    assert "docker stack config" in content, "CI deve renderizar stack Swarm"
    assert "GITHUB_SHA" in content, "CI deve verificar SHA (GITHUB_SHA) nas imagens renderizadas"
    assert ":latest" in content, "CI deve checar ausência de :latest nas imagens renderizadas"
