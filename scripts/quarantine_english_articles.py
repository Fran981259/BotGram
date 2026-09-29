#!/usr/bin/env python3
"""Identifica e coloca em quarentena (ou traduz) artigos com título/resumo em inglês.

Uso:
  python scripts/quarantine_english_articles.py          # Auditoria (apenas lista)
  python scripts/quarantine_english_articles.py --apply  # Move para status 'review' e visibilidade privada
"""

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database import get_session  # noqa: E402
from app.editorial import is_english_text  # noqa: E402
from app.schema import NewsArticle  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="move artigos encontrados para quarentena ('review')")
    args = parser.parse_args()

    db = get_session()
    try:
        articles = db.query(NewsArticle).filter(NewsArticle.status == "published").all()
        candidates = []
        for article in articles:
            if is_english_text(article.title) or is_english_text(article.summary or ""):
                candidates.append(article)

        print(f"Total de artigos publicados analisados: {len(articles)}")
        print(f"Artigos com título/resumo em inglês detectados: {len(candidates)}\n")

        for article in candidates:
            print(f"[{article.id}] {article.slug}")
            print(f"  Título: {article.title}")
            print(f"  Categoria: {article.category} | Região: {article.region}\n")

        if args.apply and candidates:
            for article in candidates:
                article.status = "review"
                article.visibility = "private"
            db.commit()
            print(f"Sucesso: {len(candidates)} artigo(s) movido(s) para revisão e retirados da área pública.")
        elif candidates:
            print("Nenhuma alteração persistida. Execute com --apply para mover para revisão.")
        else:
            print("Nenhum artigo publicado com título em inglês encontrado.")

        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
