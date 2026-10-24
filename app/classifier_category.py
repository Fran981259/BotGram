"""Inferência de categoria — usa modelo ML quando disponível, keywords como fallback."""


class CategoryClassifierMixin:
    def classify_category(self, text: str) -> str:
        """Classifica categoria usando ML (se treinado) ou heurística por keywords."""
        from app.ml.category_model import predict_category
        return predict_category(text or "")
