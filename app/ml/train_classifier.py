"""Treina o classificador de categorias e persiste o modelo.

Fonte de dados:
  1. Artigos publicados (status='published') — label = category no banco
  2. CategoryCorrections do admin — sobrepõem o label do artigo correspondente

Saída: Pipeline TF-IDF + LogisticRegression serializado em MODEL_PATH.

Uso manual:
  python -m app.ml.train_classifier
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MODEL_PATH = Path(os.getenv("MODEL_PATH", "/app/data/models/category_classifier.joblib"))
MIN_SAMPLES = 50  # mínimo de exemplos para treinar


def _build_dataset(session) -> tuple[list[str], list[str]]:
    """Retorna (textos, labels) usando artigos publicados + correções do admin."""
    from app.schema import CategoryCorrection, NewsArticle

    articles = (
        session.query(NewsArticle.id, NewsArticle.title, NewsArticle.summary, NewsArticle.category)
        .filter(NewsArticle.status == "published", NewsArticle.category.isnot(None))
        .all()
    )
    if not articles:
        return [], []

    # Índice article_id → label; inicializa com categoria do banco
    labels: dict[int, str] = {a.id: a.category for a in articles}
    texts: dict[int, str] = {
        a.id: f"{a.title or ''} {a.summary or ''}".strip()
        for a in articles
    }

    # Sobrepõe com correções manuais do admin
    corrections = (
        session.query(CategoryCorrection.article_id, CategoryCorrection.corrected_category)
        .filter(CategoryCorrection.article_id.in_(labels.keys()))
        .order_by(CategoryCorrection.created_at.asc())
        .all()
    )
    for corr in corrections:
        labels[corr.article_id] = corr.corrected_category

    X = [texts[aid] for aid in labels if texts.get(aid)]
    y = [labels[aid] for aid in labels if texts.get(aid)]
    return X, y


def train_and_save(session=None) -> dict[str, Any]:
    """Treina o modelo e salva em MODEL_PATH. Retorna métricas."""
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline import Pipeline
    import joblib

    from app.database import get_session

    db = session or get_session()
    close_db = session is None
    try:
        X, y = _build_dataset(db)

        if len(X) < MIN_SAMPLES:
            logger.warning("[ML] Dados insuficientes para treino (%d amostras). Mínimo: %d.", len(X), MIN_SAMPLES)
            return {"status": "skipped", "reason": "insufficient_data", "samples": len(X)}

        # Marca correções como usadas
        from app.schema import CategoryCorrection
        db.query(CategoryCorrection).filter(CategoryCorrection.used_in_training == False).update(  # noqa: E712
            {"used_in_training": True}, synchronize_session=False
        )
        db.commit()
    finally:
        if close_db:
            db.close()

    # Treino
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            analyzer="word",
            ngram_range=(1, 2),
            min_df=2,
            max_features=30_000,
            sublinear_tf=True,
        )),
        ("clf", LogisticRegression(
            max_iter=500,
            C=5.0,
            solver="lbfgs",
            multi_class="multinomial",
            class_weight="balanced",
        )),
    ])

    n_samples = len(X)
    if n_samples >= 200:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42, stratify=y)
        pipeline.fit(X_train, y_train)
        accuracy = accuracy_score(y_test, pipeline.predict(X_test))
        eval_n = len(X_test)
    else:
        pipeline.fit(X, y)
        accuracy = accuracy_score(y, pipeline.predict(X))
        eval_n = n_samples

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)

    logger.info("[ML] Modelo salvo em %s | amostras=%d acurácia=%.3f", MODEL_PATH, n_samples, accuracy)
    return {"status": "ok", "samples": n_samples, "eval_n": eval_n, "accuracy": round(accuracy, 4)}


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    result = train_and_save()
    print(result)
