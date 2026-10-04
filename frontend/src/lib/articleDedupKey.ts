import type { Article } from "@/lib/api";

/**
 * Identificador editorial canônico para evitar a mesma manchete em blocos
 * diferentes, mesmo quando a API a entrega com slugs distintos.
 */
export function articleDedupKey(article: Pick<Article, "slug" | "title">): string {
  const headline = article.title
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return headline || article.slug || "";
}

/** Remove matérias repetidas preservando a ordem de prioridade recebida. */
export function uniqueArticles(articles: Article[]): Article[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = articleDedupKey(article);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
