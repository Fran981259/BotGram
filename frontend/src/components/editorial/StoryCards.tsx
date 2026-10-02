import Link from "next/link";
import { ArticleImage } from "@/components/home/ArticleImage";
import { ArticleMeta } from "@/components/editorial/ArticleMeta";
import type { Article } from "@/lib/api";
import { getCategory } from "@/lib/categories";

/**
 * Destino e âncora de uma matéria, resolvidos uma vez só.
 *
 * Fontes externas continuam indo para o exterior; o resto é rota interna.
 */
export function useArticleLink(article: Article) {
  const href = article.slug ? `/noticia/${article.slug}` : article.url || "#";
  const isExternal = !article.slug && Boolean(article.url);
  return { href, isExternal, target: isExternal ? ("_blank" as const) : undefined };
}

/**
 * Remove a marcação de apresentação que o banco traz no texto.
 *
 * Mesma limpeza que o `NewsCard` original fazia no resumo. Evitei escrever o
 * padrão da expressão aqui no comentário: o `asterisco-asterisco-eslash`
 * encerraria este bloco de documentação antes da hora.
 */
function lead(article: Article): string {
  return (article.summary || "").replaceAll("**", "").trim();
}

/**
 * HeroStoryCard — a matéria mais importante da página.
 *
 * Uma por página. O texto fica sobre a imagem, com véu para garantir
 * contraste; a imagem usa `priority` porque está acima da dobra.
 */
export function HeroStoryCard({
  article,
  priority = true,
  showSummary = true,
}: {
  article: Article;
  priority?: boolean;
  showSummary?: boolean;
}) {
  const { href, target } = useArticleLink(article);
  const cat = getCategory(article.category);
  const summary = lead(article);

  return (
    <article className="news-card-hover group relative block overflow-hidden rounded-lg bg-charcoal">
      <Link href={href} target={target} className="block">
        <ArticleImage
          article={article}
          priority={priority}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="aspect-[4/5] sm:aspect-[16/10] lg:h-full lg:aspect-auto"
          showBadge={false}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7 lg:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-leaf px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-lg">
            {cat.label}
          </span>
          <h2 className="mt-3 text-balance font-display text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {article.title}
          </h2>
          {showSummary && summary && (
            <p className="mt-3 line-clamp-2 max-w-3xl text-sm font-medium leading-relaxed text-white/85 sm:text-base">
              {summary}
            </p>
          )}
          <ArticleMeta article={article} className="mt-4 text-white/75" />
        </div>
      </Link>
    </article>
  );
}

/**
 * FeatureStoryCard — matter de apoio em destaque.
 *
 * Imagem acima, texto abaixo. É o cartão de coluna secundária, não uma
 * versão reduzida do hero: o hero tem véu e não tem borda.
 */
export function FeatureStoryCard({ article }: { article: Article }) {
  const { href, target } = useArticleLink(article);
  const cat = getCategory(article.category);
  const summary = lead(article);

  return (
    <article className="news-card-hover group flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-surface">
      <Link href={href} target={target} className="block" tabIndex={-1} aria-hidden="true">
        <ArticleImage
          article={article}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/10]"
          showBadge={false}
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-accent-leaf">{cat.label}</span>
        <h3 className="mt-2 text-balance font-display text-xl font-black leading-tight text-text-primary transition-colors group-hover:text-accent-leaf">
          <Link href={href} target={target}>
            {article.title}
          </Link>
        </h3>
        {summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">{summary}</p>}
        <ArticleMeta article={article} className="mt-4 border-t border-black/8 pt-3" />
      </div>
    </article>
  );
}

/**
 * StoryCard — o cartão editorial padrão.
 *
 * Usado em grade e em listas de categoria. Usa `aspect-ratio` em vez de altura
 * fixa: é a razão que impede cartões com alturas diferentes conforme a imagem
 * de origem muda.
 */
export function StoryCard({ article, showSummary = true }: { article: Article; showSummary?: boolean }) {
  const { href, target } = useArticleLink(article);
  const summary = lead(article);

  return (
    <article className="news-card-hover group flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-surface">
      <Link href={href} target={target} className="block" tabIndex={-1} aria-hidden="true">
        <ArticleImage
          article={article}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/10]"
          showBadge={false}
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-balance font-display text-lg font-black leading-snug text-text-primary transition-colors group-hover:text-accent-leaf">
          <Link href={href} target={target}>
            {article.title}
          </Link>
        </h3>
        {showSummary && summary && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">{summary}</p>
        )}
        <ArticleMeta article={article} className="mt-auto border-t border-black/8 pt-3" />
      </div>
    </article>
  );
}

/**
 * CompactStoryCard — item de lista densa.
 *
 * Sem borda própria: a lista é que separa os itens, para não duplicar linha.
 */
export function CompactStoryCard({ article, showThumbnail = true }: { article: Article; showThumbnail?: boolean }) {
  const { href, target } = useArticleLink(article);
  const cat = getCategory(article.category);

  return (
    <article className="group flex items-start gap-4 border-b border-black/10 py-3 last:border-b-0 last:pb-0">
      {showThumbnail && (
        <Link href={href} target={target} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <ArticleImage
            article={article}
            sizes="128px"
            className="aspect-[16/10] w-28 rounded-sm sm:w-32"
            showBadge={false}
          />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-accent-leaf">{cat.label}</span>
        <h3 className="mt-1 text-balance font-display text-base font-black leading-snug text-text-primary transition-colors group-hover:text-accent-leaf">
          <Link href={href} target={target}>
            {article.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

/**
 * HorizontalStoryCard — conteúdo ao lado da imagem.
 *
 * Empilha no mobile e vira linha no `sm`. É o cartão de ritmo de meio de página.
 */
export function HorizontalStoryCard({ article }: { article: Article }) {
  const { href, target } = useArticleLink(article);
  const cat = getCategory(article.category);
  const summary = lead(article);

  return (
    <article className="news-card-hover group flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-surface sm:flex-row">
      <Link href={href} target={target} className="block shrink-0 sm:w-2/5" tabIndex={-1} aria-hidden="true">
        <ArticleImage
          article={article}
          sizes="(min-width: 640px) 40vw, 100vw"
          className="aspect-[16/10] sm:h-full sm:aspect-auto"
          showBadge={false}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-accent-leaf">{cat.label}</span>
        <h3 className="mt-2 text-balance font-display text-lg font-black leading-snug text-text-primary transition-colors group-hover:text-accent-leaf">
          <Link href={href} target={target}>
            {article.title}
          </Link>
        </h3>
        {summary && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">{summary}</p>}
        <ArticleMeta article={article} className="mt-auto pt-3" />
      </div>
    </article>
  );
}

/**
 * RankedStoryItem — item de ranking ("Mais lidas").
 *
 * O número é o elemento editorial. Não tem imagem: em lista de ranking, a
 * imagem rouba a atenção do número.
 */
export function RankedStoryItem({
  article,
  rank,
  showCategory = false,
}: {
  article: Article;
  rank: number;
  showCategory?: boolean;
}) {
  const { href, target } = useArticleLink(article);

  return (
    <article className="group flex items-start gap-4 border-b border-black/10 py-4 last:border-b-0 last:pb-0">
      <span
        aria-hidden="true"
        className="font-display text-3xl font-black leading-none text-accent-leaf/35 tabular-nums"
      >
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        {showCategory && (
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-accent-leaf">
            {article.category}
          </span>
        )}
        <h3 className="text-balance font-display text-base font-bold leading-snug text-text-primary transition-colors group-hover:text-accent-leaf">
          <Link href={href} target={target}>
            {article.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}