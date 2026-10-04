import type { Article } from "@/lib/api";

/** Destino público de uma matéria, com fallback seguro para registros incompletos. */
export function articleHref(article: Pick<Article, "slug" | "url">): string {
  return article.slug ? `/noticia/${article.slug}` : article.url || "#";
}

/** Remove marcação de apresentação persistida em resumos editoriais. */
export function articleSummary(article: Pick<Article, "summary">): string {
  return (article.summary || "").replaceAll("**", "").trim();
}
