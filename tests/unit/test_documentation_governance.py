"""Contratos de governança documental (Fase 12).

Verificam que os documentos canônicos seguem as regras definidas em
PLANO_ACAO.md § Fase 12 sem depender de estado externo ou runtime.
"""

from pathlib import Path

_DOC = Path("documento")
_README = _DOC / "README.md"
_MEMORIA = _DOC / "MEMORIA.md"
_OPERACAO = _DOC / "OPERACAO.md"
_EVIDENCIAS = _DOC / "EVIDENCIAS_VALIDACAO.md"
_PLANO = _DOC / "PLANO_ACAO.md"


# ── Regra 1: README.md classifica cada documento ─────────────────────────────

def test_readme_contains_document_classification_table() -> None:
    """README.md deve ter tabela com papéis dos documentos (Regra 1)."""
    content = _README.read_text(encoding="utf-8")

    # Papéis obrigatórios na tabela de governança (comparação case-insensitive)
    content_lower = content.lower()
    for role in ("canônico", "operacional", "evidência", "histórico"):
        assert role in content_lower, f"README.md deve classificar documentos como '{role}'"


def test_readme_lists_all_canonical_documents() -> None:
    """README.md deve referenciar os documentos canônicos existentes."""
    content = _README.read_text(encoding="utf-8")

    for doc in ("PLANO_ACAO.md", "MEMORIA.md", "OPERACAO.md", "EVIDENCIAS_VALIDACAO.md"):
        assert doc in content, f"README.md deve listar '{doc}'"


# ── Regra 2: MEMORIA.md registra arquitetura e restrições confirmadas ─────────

def test_memoria_has_architecture_section() -> None:
    """MEMORIA.md deve registrar a stack técnica canônica (Regra 2)."""
    content = _MEMORIA.read_text(encoding="utf-8")

    for component in ("FastAPI", "PostgreSQL", "Redis", "Next.js"):
        assert component in content, f"MEMORIA.md deve registrar componente '{component}'"


def test_memoria_has_audited_state_with_date() -> None:
    """MEMORIA.md deve ter seção 'Estado auditado' com data (Regra 2 + 4)."""
    content = _MEMORIA.read_text(encoding="utf-8")

    assert "Estado auditado" in content, "MEMORIA.md deve ter seção 'Estado auditado'"
    # Verifica que há uma data no formato YYYY-MM-DD ou DD/MM/YYYY ou similar
    import re
    has_date = bool(re.search(r"\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{4}", content))
    assert has_date, "MEMORIA.md deve incluir ao menos uma data no estado auditado"


def test_memoria_declares_oracle_cloud_restriction() -> None:
    """MEMORIA.md deve registrar a restrição do servidor Oracle Cloud (fato confirmado)."""
    content = _MEMORIA.read_text(encoding="utf-8")

    # A restrição do legado está documentada como fato canônico
    assert "botgram" in content.lower() or "legado" in content.lower(), (
        "MEMORIA.md deve registrar o estado do ambiente legado como restrição"
    )


# ── Regra 3: OPERACAO.md descreve procedimentos sem estado ao vivo ────────────

def test_operacao_starts_with_runbook_disclaimer() -> None:
    """OPERACAO.md deve abrir com aviso de que não confirma estado externo (Regra 3)."""
    content = _OPERACAO.read_text(encoding="utf-8")
    first_500 = content[:500]

    assert "runbook" in first_500.lower() or "não confirma" in first_500.lower(), (
        "OPERACAO.md deve abrir com aviso de que é um runbook e não confirma estado externo"
    )


def test_operacao_contains_rollback_procedure() -> None:
    """OPERACAO.md deve descrever procedimento de rollback (Regra 3)."""
    content = _OPERACAO.read_text(encoding="utf-8")

    assert "rollback" in content.lower(), "OPERACAO.md deve documentar procedimento de rollback"


# ── Regra 4: evidências são datadas ──────────────────────────────────────────

def test_evidencias_file_exists_and_is_not_empty() -> None:
    """EVIDENCIAS_VALIDACAO.md deve existir e ter conteúdo (Regra 4)."""
    assert _EVIDENCIAS.exists(), "documento/EVIDENCIAS_VALIDACAO.md deve existir"
    assert len(_EVIDENCIAS.read_text(encoding="utf-8").strip()) > 0, (
        "EVIDENCIAS_VALIDACAO.md não pode estar vazio"
    )


def test_plano_acao_phase_evidence_includes_dates() -> None:
    """Fases concluídas no PLANO_ACAO.md devem ter datas nas evidências (Regra 4)."""
    content = _PLANO.read_text(encoding="utf-8")
    import re

    # Cada fase marcada como concluída deve ter ao menos uma data
    concluded_sections = re.findall(r"concluída em (\d{2}/\d{2}/\d{4})", content)
    assert len(concluded_sections) >= 5, (
        f"Esperado ao menos 5 fases com data de conclusão, encontrado {len(concluded_sections)}"
    )


# ── Regra 5: precedência de conflito documentada ─────────────────────────────

def test_readme_declares_conflict_precedence() -> None:
    """README.md deve declarar a precedência em caso de conflito entre documentos (Regra 5)."""
    content = _README.read_text(encoding="utf-8")

    assert "precedência" in content.lower() or "conflito" in content.lower(), (
        "README.md deve declarar regra de precedência entre documentos"
    )
