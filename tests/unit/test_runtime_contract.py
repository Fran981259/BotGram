from pathlib import Path

import yaml

_SWARM_FILE = "docker-stack.swarm.yml"
_LOCAL_FILE = "docker-compose.local.yml"
_BASE_FILE = "docker-compose.yml"
_OVERLAY_NET = "cerrado_test_net"
_REQUIRED_SERVICES = {"postgres", "redis", "portal_cerrado", "celery_worker", "celery_beat", "frontend", "caddy"}
_CUSTOM_IMAGES = {"portal_cerrado", "celery_worker", "celery_beat", "flower", "frontend"}


def _swarm_stack() -> dict:
    return yaml.safe_load(Path(_SWARM_FILE).read_text(encoding="utf-8"))


def _local_compose() -> dict:
    return yaml.safe_load(Path(_LOCAL_FILE).read_text(encoding="utf-8"))


def _base_compose() -> dict:
    return yaml.safe_load(Path(_BASE_FILE).read_text(encoding="utf-8"))


# ── Swarm stack structural contracts ──────────────────────────────────────────

def test_swarm_stack_has_required_services_and_isolated_network() -> None:
    stack = _swarm_stack()
    services = stack["services"]

    assert _REQUIRED_SERVICES <= set(services)
    assert stack["networks"][_OVERLAY_NET]["driver"] == "overlay"
    assert all(service.get("deploy", {}).get("replicas") == 1 for service in services.values())


def test_swarm_stack_uses_digests_and_healthchecks() -> None:
    stack = _swarm_stack()

    for name, service in stack["services"].items():
        assert service.get("healthcheck"), f"{name}: sem healthcheck"
        if name in _CUSTOM_IMAGES:
            assert "IMAGE:?" in service["image"] and "SHA" in service["image"], (
                f"{name}: imagem deve usar placeholder SHA obrigatório"
            )


def test_swarm_stack_isolated_volumes_do_not_use_legacy_names() -> None:
    stack = _swarm_stack()

    assert all(name.startswith("cerrado_test_") for name in stack["volumes"])
    volume_text = str(stack["services"])
    assert "botgram_" not in volume_text


def test_swarm_stack_has_no_compose_only_directives() -> None:
    """build, container_name e depends_on são inválidos no Swarm; presença causa erro silencioso."""
    stack = _swarm_stack()

    for name, svc in stack["services"].items():
        assert "build" not in svc, f"{name}: 'build' inválido no Swarm"
        assert "container_name" not in svc, f"{name}: 'container_name' inválido no Swarm"
        assert "depends_on" not in svc, f"{name}: 'depends_on' inválido no Swarm"


def test_swarm_stack_all_services_on_overlay_network() -> None:
    stack = _swarm_stack()

    for name, svc in stack["services"].items():
        nets = svc.get("networks", {})
        nets_set = set(nets) if isinstance(nets, dict) else set(nets)
        assert _OVERLAY_NET in nets_set, f"{name}: não está na rede overlay {_OVERLAY_NET!r}"


def test_swarm_stack_mandatory_env_vars_use_required_syntax() -> None:
    """Variáveis obrigatórias devem usar :? para falhar de forma explícita na inicialização."""
    stack = _swarm_stack()
    stack_text = str(stack)

    # Nenhuma variável crítica com default vazio silencioso
    assert "POSTGRES_PASSWORD:-}" not in stack_text, "POSTGRES_PASSWORD tem fallback silencioso"
    assert "REDIS_PASSWORD:-}" not in stack_text, "REDIS_PASSWORD tem fallback silencioso"
    assert "POSTGRES_PASSWORD:?" in stack_text, "POSTGRES_PASSWORD deve usar :? obrigatório"
    assert "REDIS_PASSWORD:?" in stack_text, "REDIS_PASSWORD deve usar :? obrigatório"


def test_swarm_stack_internal_service_ports_are_parameterized() -> None:
    """Portas de serviços internos devem ser variáveis de ambiente, não valores fixos."""
    stack = _swarm_stack()

    for name in ("portal_cerrado", "frontend"):
        svc = stack["services"].get(name, {})
        for port_entry in svc.get("ports", []):
            host_port = str(port_entry).split(":")[0]
            assert host_port.startswith("${"), (
                f"{name}: porta do host deve ser variável de ambiente, encontrado: {host_port!r}"
            )


# ── Local Compose contracts ───────────────────────────────────────────────────

def test_local_compose_uses_bridge_not_overlay() -> None:
    local = _local_compose()

    for net_name, net_cfg in (local.get("networks") or {}).items():
        driver = (net_cfg or {}).get("driver", "bridge")
        assert driver != "overlay", f"rede local {net_name!r} usa overlay — deve ser bridge"


def test_local_compose_does_not_reference_swarm_volumes() -> None:
    local = _local_compose()
    local_text = str(local)

    assert "cerrado_test_" not in local_text, "Compose local não deve referenciar volumes Swarm de teste"
    assert "botgram_" not in local_text, "Compose local não deve referenciar volumes legados"
