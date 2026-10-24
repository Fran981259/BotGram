"""Tarefas Celery para o pipeline de ML do Portal Cerrado."""

import logging

from app.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    name="app.tasks.ml_tasks.retrain_category_classifier",
    bind=True,
    max_retries=2,
    default_retry_delay=300,
)
def retrain_category_classifier(self):
    """Retreina o classificador de categorias com todos os artigos publicados + correções do admin.

    Agendado semanalmente (domingo 01:00). Pode ser disparado manualmente via
    POST /api/admin/ml/retrain.
    """
    try:
        from app.ml.category_model import reload_model
        from app.ml.train_classifier import train_and_save

        logger.info("[ML] Iniciando retreino do classificador de categorias")
        result = train_and_save()
        logger.info("[ML] Retreino concluído: %s", result)

        if result.get("status") == "ok":
            reload_model()
            logger.info("[ML] Modelo recarregado após retreino")

        return result
    except Exception as exc:
        logger.error("[ML] Retreino falhou: %s", exc)
        raise self.retry(exc=exc)
