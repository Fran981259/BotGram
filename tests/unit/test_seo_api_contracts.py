"""Contratos SEO das rotas públicas do backend.

Verifica que /api/news e /api/news/{slug} retornam todos os campos
necessários para JSON-LD, Open Graph e client-side search (busca).
"""

import pytest
from fastapi.testclient import TestClient

from app.database import get_session
from app.main import app
from app.schema import NewsArticle

_SEO_FIELDS = {"slug", "title", "summary", "published_at", "image_url", "category"}
_JSONLD_FIELDS = _SEO_FIELDS | {"reporter", "reporter_slug", "tags", "updated_at"}
_SEARCH_FIELDS = {"title", "summary", "tags", "category"}


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def published_article():
    """Insere um artigo publicado e público no banco de teste."""
    from app.schema import Reporter

    db = get_session()
    reporter = db.query(Reporter).filter(Reporter.slug == "enzo.bianchi").first()
    article = NewsArticle(
        title="Incêndio no Pantanal registra recorde em outubro",
        slug="incendio-pantanal-outubro-seo",
        summary="Área queimada em outubro superou todos os registros anteriores.",
        content="Conteúdo completo do artigo de teste.",
        category="clima",
        status="published",
        visibility="public",
        region="ms",
        image_url="https://example.com/img.jpg",
        tags=["pantanal", "incêndio", "meio ambiente"],
        reporter_id=reporter.id,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    yield article
    db.delete(article)
    db.commit()
    db.close()


class TestNewsListSeoContract:
    def test_response_shape(self, client, published_article):
        r = client.get("/api/news?limit=1")
        assert r.status_code == 200
        body = r.json()
        assert "total" in body
        assert "news" in body

    def test_articles_contain_seo_fields(self, client, published_article):
        r = client.get("/api/news?limit=50")
        articles = r.json()["news"]
        assert articles, "nenhum artigo retornado"
        for field in _SEO_FIELDS:
            assert field in articles[0], f"campo SEO ausente: {field}"

    def test_articles_contain_jsonld_fields(self, client, published_article):
        r = client.get("/api/news?limit=50")
        article = r.json()["news"][0]
        for field in _JSONLD_FIELDS:
            assert field in article, f"campo JSON-LD ausente: {field}"

    def test_articles_contain_search_fields(self, client, published_article):
        r = client.get("/api/news?limit=50")
        article = r.json()["news"][0]
        for field in _SEARCH_FIELDS:
            assert field in article, f"campo de busca ausente: {field}"

    def test_category_filter(self, client, published_article):
        r = client.get("/api/news?category=clima&limit=50")
        assert r.status_code == 200
        body = r.json()
        slugs = [a["slug"] for a in body["news"]]
        assert published_article.slug in slugs

    def test_category_filter_excludes_other_categories(self, client, published_article):
        r = client.get("/api/news?category=politica&limit=50")
        assert r.status_code == 200
        slugs = [a["slug"] for a in r.json()["news"]]
        assert published_article.slug not in slugs

    def test_tags_is_list(self, client, published_article):
        r = client.get("/api/news?limit=50")
        article = next(
            (a for a in r.json()["news"] if a["slug"] == published_article.slug), None
        )
        assert article is not None
        assert isinstance(article["tags"], list)

    def test_category_is_human_readable(self, client, published_article):
        """category deve ser label legível, não slug interno."""
        r = client.get("/api/news?limit=50")
        article = next(
            (a for a in r.json()["news"] if a["slug"] == published_article.slug), None
        )
        assert article is not None
        # category_name() converte "meio_ambiente" → label; não deve ser vazio
        assert article["category"]


class TestArticleSlugSeoContract:
    def test_returns_article(self, client, published_article):
        r = client.get(f"/api/news/{published_article.slug}")
        assert r.status_code == 200

    def test_contains_all_jsonld_fields(self, client, published_article):
        r = client.get(f"/api/news/{published_article.slug}")
        article = r.json()
        for field in _JSONLD_FIELDS:
            assert field in article, f"campo JSON-LD ausente em /api/news/slug: {field}"

    def test_missing_slug_returns_404(self, client):
        r = client.get("/api/news/slug-que-nao-existe-jamais-xyz")
        assert r.status_code == 404

    def test_only_public_ms_articles_served(self, client):
        """Artigo privado (visibility=private) não deve ser encontrado pelo slug."""
        from app.schema import Reporter

        db = get_session()
        reporter = db.query(Reporter).filter(Reporter.slug == "enzo.bianchi").first()
        hidden = NewsArticle(
            title="Artigo privado SEO test",
            slug="artigo-privado-seo-test-xyz",
            summary="Resumo.",
            content="Conteúdo.",
            category="general",
            status="published",
            visibility="private",
            region="ms",
            reporter_id=reporter.id,
        )
        db.add(hidden)
        db.commit()
        try:
            r = client.get("/api/news/artigo-privado-seo-test-xyz")
            assert r.status_code == 404
        finally:
            db.delete(hidden)
            db.commit()
            db.close()
