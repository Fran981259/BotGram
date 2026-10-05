#!/usr/bin/env python3
"""Move para revisão matérias de fontes fora do catálogo editorial ativo.

Use primeiro sem argumentos para auditar. Só use ``--apply`` após revisar a
lista: a operação tira as matérias encontradas da área pública, sem apagá-las.
"""

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import text  # noqa: E402

# O bootstrap de sys.path permite executar o script diretamente na raiz do projeto.
from app.database import get_session  # noqa: E402
from app.local_news_policy import local_source_hosts  # noqa: E402


def host(url: str) -> str:
    return (urlparse(url or "").hostname or "").lower().removeprefix("www.")


def article_source_hosts(sources: object) -> set[str]:
    if isinstance(sources, str):
        try:
            sources = json.loads(sources)
        except json.JSONDecodeError:
            sources = []
    return {
        value
        for source in sources or []
        if isinstance(source, dict)
        for value in [host(str(source.get("url", "")))]
        if value
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="tira as matérias encontradas da área pública")
    args = parser.parse_args()

    # Textos originalmente publicados pela própria redação não dependem de um
    # portal coletado e permanecem fora da quarentena de fontes externas.
    active_hosts = local_source_hosts() | {"portalcerrado.com.br"}
    db = get_session()
    try:
        candidates = []
        # Não depende de ``region``: bancos legados podem não ter a coluna e a
        # origem é a fonte de verdade para esta higiene.
        articles = db.execute(
            text("SELECT id, slug, title, sources FROM news_articles WHERE status = :status"),
            {"status": "published"},
        ).mappings().all()

        for article in articles:
            source_hosts = article_source_hosts(article["sources"])
            # Artigos com ao menos uma fonte ativa continuam disponíveis. Os
            # demais vão para revisão, sem apagar histórico nem texto.
            if source_hosts and source_hosts.isdisjoint(active_hosts):
                candidates.append((article, sorted(source_hosts)))

        for article, matched in candidates:
            print(f"{article['id']}\t{article['slug']}\t{', '.join(matched)}\t{article['title']}")

        if args.apply and candidates:
            for article, _ in candidates:
                db.execute(
                    text("UPDATE news_articles SET status = :status, visibility = :visibility WHERE id = :id"),
                    {"status": "review", "visibility": "private", "id": article["id"]},
                )
            db.commit()
            print(f"\n{len(candidates)} matéria(s) movida(s) para revisão e removida(s) da área pública.")
        else:
            print(f"\n{len(candidates)} matéria(s) encontrada(s). {'Nenhuma alteração aplicada.' if not args.apply else ''}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
