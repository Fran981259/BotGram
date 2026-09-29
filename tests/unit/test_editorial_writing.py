import pytest

from app.editorial import (
    EditorialRejection,
    is_english_text,
    reject_blocked_writing,
    review_natural_writing,
    validate_publication,
)


def test_writing_review_blocks_internal_placeholders():
    findings = review_natural_writing("A prefeitura informou: INSIRA AQUI o valor final.")
    assert any(f.code == "internal_placeholder" and f.severity == "block" for f in findings)
    with pytest.raises(EditorialRejection, match="placeholder"):
        reject_blocked_writing("A prefeitura informou: INSIRA AQUI o valor final.")
    assert any(f.code == "internal_placeholder" for f in review_natural_writing("[TODO] revisar o texto."))


def test_writing_review_routes_vague_attribution_to_editor():
    findings = review_natural_writing("Especialistas dizem que o mercado terá impacto.")
    assert any(f.code == "vague_attribution" and f.severity == "review" for f in findings)


def test_writing_review_allows_direct_factual_copy():
    findings = review_natural_writing("O governo publicou o decreto nesta terça-feira, segundo o Diário Oficial.")
    assert findings == []


def test_is_english_text_detection():
    assert is_english_text("Texas man arrested after intentionally crashing into a closed Kroger")
    assert is_english_text("Police investigation into deadly shooting near city center")
    assert not is_english_text("Homem é preso em Campo Grande após colisão intencional")
    assert not is_english_text("Polícia investiga caso de roubo na região central de Dourados")


def test_validate_publication_rejects_english_title():
    article = {
        "title": "Texas man arrested after intentionally crashing into a closed Kroger",
        "content": "Um texto qualquer em português com tamanho adequado.",
        "category": "security",
        "sources": [{"url": "https://g1.globo.com/ms", "name": "G1 MS"}],
    }
    with pytest.raises(EditorialRejection, match="inglês"):
        validate_publication(article)

