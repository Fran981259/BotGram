"""Inferência de categoria com modelo ML + fallback para heurística.

O modelo é carregado lazily da primeira chamada.
Se MODEL_PATH não existir, cai para `infer_category` (heurística por keywords).
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

MODEL_PATH = Path(os.getenv("MODEL_PATH", "/app/data/models/category_classifier.joblib"))

_pipeline: Optional[Any] = None  # Pipeline sklearn carregado
_model_mtime: float = 0.0


def _load() -> Optional[Any]:
    """Carrega (ou recarrega) o modelo se o arquivo existe e mudou."""
    global _pipeline, _model_mtime
    if not MODEL_PATH.exists():
        return None
    mtime = MODEL_PATH.stat().st_mtime
    if _pipeline is not None and mtime == _model_mtime:
        return _pipeline
    try:
        import joblib
        _pipeline = joblib.load(MODEL_PATH)
        _model_mtime = mtime
        logger.info("[ML] Modelo de categoria carregado de %s", MODEL_PATH)
    except Exception as exc:
        logger.warning("[ML] Falha ao carregar modelo (%s): %s", MODEL_PATH, exc)
        _pipeline = None
    return _pipeline


def predict_category(text: str) -> str:
    """Classifica texto em uma categoria canônica.

    Usa o modelo sklearn quando disponível; caso contrário usa `infer_category`.
    """
    pipeline = _load()
    if pipeline is not None:
        try:
            from app.contracts import category_name
            predicted = pipeline.predict([text or ""])[0]
            return category_name(predicted)
        except Exception as exc:
            logger.warning("[ML] Erro na predição (%s). Usando heurística.", exc)

    # Fallback heurístico
    from app.category_inference import infer_category
    return infer_category(text)


def reload_model() -> bool:
    """Força recarga do modelo do disco. Retorna True se carregou com sucesso."""
    global _pipeline, _model_mtime
    _model_mtime = 0.0
    return _load() is not None
