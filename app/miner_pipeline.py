"""Pipeline completo do minerador global."""

import logging
import os
import time
from datetime import datetime, timezone
from typing import Dict, List

from app.miner_constants import MIN_ARTICLES_PER_DAY
from app.miner_global import GlobalNewsMiner
from app.miner_volume import VolumeManager

logger = logging.getLogger(__name__)


class MinerPipeline:
    """Pipeline completo do Miner."""

    def __init__(self):
        self.miner = GlobalNewsMiner()
        from app.translator import NewsTranslator as LLMTranslator

        self.translator = LLMTranslator()
        self.volume = VolumeManager()
        self._load_routing()

    def _load_routing(self):
        config = self.miner.config
        routing = config.get("global_miner", {}).get("reporter_routing", {})
        self.reporter_map = {cat: info.get("reporter") for cat, info in routing.items()}

    def run(self, target_volume: int = MIN_ARTICLES_PER_DAY) -> List[Dict]:
        """Executa pipeline completo."""
        logger.info("=" * 50)
        logger.info("INICIANDO PIPELINE DO MINER")
        logger.info("=" * 50)

        # 1. Coleta randomizada
        articles = self.miner.mine_randomized()
        logger.info(f"Coletados: {len(articles)} artigos")

        # 2. Classificação (importância + engajamento)
        for article in articles:
            self.miner.classifier.classify(article)

        # 3. Filtra por prioridade mínima
        articles = self.miner.classifier.filter_by_priority(articles, min_tier="TIER_3")
        logger.info(f"Após filtro de prioridade: {len(articles)} artigos")

        # 4. Balanceamento de volume antes da tradução para evitar chamadas LLM excessivas
        selected = self.volume.balance_selection(articles, total_target=target_volume)
        max_batch = int(os.getenv("MINER_TRANSLATE_BATCH_SIZE", str(target_volume)))
        selected = selected[:max_batch]
        logger.info(f"Artigos selecionados para tradução/roteamento: {len(selected)}")

        # 5. Tradução controlada com pacing para evitar HTTP 429
        sleep_s = float(os.getenv("MINER_TRANSLATE_SLEEP_SECONDS", "2.0"))
        translated = []
        for i, article in enumerate(selected):
            try:
                if i > 0 and article.get("source_lang") != "pt-BR":
                    time.sleep(sleep_s)
                translated.append(self.translator.translate(article))
            except RuntimeError:
                translated.append({**article, "needs_review": True})

        # 6. Roteamento para repórteres
        for article in translated:
            article = self._route_to_reporter(article)

        logger.info(f"Volume final pronto: {len(translated)} artigos")
        return translated

    def _route_to_reporter(self, article: Dict) -> Dict:
        category = article.get("category", "")
        # Mapeia categoria minerada para categoria de repórter
        cat_map = {
            "technology": "tech",
            "geopolitics": "politics",
            "economy": "economy",
            "science_health": "health",
            "sports_global": "sports",
            "agriculture": "agriculture",
        }
        mapped = cat_map.get(category, "general")
        article["reporter_slug"] = self.reporter_map.get(mapped, "enzo.bianchi")
        article["routed_at"] = datetime.now(timezone.utc).isoformat()
        return article
