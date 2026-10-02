import type { Article } from "@/lib/api";
import {
  CompactStoryCard,
  FeatureStoryCard,
  HeroStoryCard,
  StoryCard,
} from "./editorial/StoryCards";

/**
 * NewsCard — fachada de compatibilidade para as páginas ainda fora do redesign.
 *
 * Antes: um componente com `variant="hero" | "default" | "compact"` e ~150 linhas
 * de markup, misturando três layouts visualmente distintos e alturas fixas.
 *
 * Agora: cada `variant` aponta para a família editorial correspondente. As
 * páginas de categoria, busca e repórter continuam importando daqui sem mudar
 * nada e passam a ter razão de imagem estável e metadados padronizados.
 *
 * A implementação antiga está preservada em `components/legacy/NewsCard.tsx`
 * para comparação e para reverter esta etapa com um único comando. A remoção
 * de ambos é o último passo do redesign, quando `NewsCard` não tiver mais
 * importações.
 */
export function NewsCard({
  article,
  variant = "default",
}: {
  article: Article;
  variant?: "hero" | "default" | "compact" | "feature";
}) {
  switch (variant) {
    case "hero":
      return <HeroStoryCard article={article} />;
    case "compact":
      return <CompactStoryCard article={article} />;
    case "feature":
      return <FeatureStoryCard article={article} />;
    default:
      return <StoryCard article={article} />;
  }
}