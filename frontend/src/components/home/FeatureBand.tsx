import Link from "next/link";
import { ArticleImage } from "@/components/home/ArticleImage";
import { formatRelativeTime } from "@/lib/time";
import { getCategory } from "@/lib/categories";
import type { Article } from "@/lib/api";
import { articleHref, articleSummary } from "@/lib/articlePresentation";

/**
 * FeatureBand — "Mais lidas" + feature editorial.
 *
 * Substitui o antigo bloco de quatro cards iguais que fazia a transição entre
 * o hero e o resto da página. Na referência aprovada, esse papel é ocupado por
 * uma faixa com duas metades:
 *
 *     MAIS LIDAS (≈0,62fr)        FEATURE grande (≈2fr) + trilho lateral
 *
 * ── A DENSIDADE É O PONTO ────────────────────────────────────────────────────
 *
 * O painel de "Mais lidas" não tem imagem, não tem caixa e não tem fundo. São
 * cinco linhas de número dourado e manchete, separadas por filete. Uma coluna
 * de cartões com borda para um ranking de manchetes é o oposto disso: a
 * hierarquia vem do número, não do container.
 *
 * ── O QUE É A FEATURE ───────────────────────────────────────────────────────
 *
 * A referência usa uma "Especial", que é um conceito editorial que o Portal
 * Cerrado não tem — não existe campo, nem curadoria, nem série chamada
 * "Especial" na API. Inventar um selo seria fabricar um conceito inexistente,
 * então a feature usa um rótulo VERDADEIRO: a editoria real da matéria. O que
 * fica é aforma — imagem grande, manchete em serifa grande sobre escurecimento,
 * resumo e chamada — que é o que o bloco precisa comunicar.
 *
 * O trilho lateral repete quatro matérias de apoio com miniatura, no mesmo
 * espírito da coluna de apoio do hero.
 */

/** Miniatura + manchete, para o trilho lateral da feature. */
function RelatedRow({ article }: { article: Article }) {
  return (
    <article className="flex h-full items-center gap-3 py-2.5">
      <Link href={articleHref(article)} className="block w-20 shrink-0" tabIndex={-1} aria-hidden="true">
        <ArticleImage article={article} sizes="80px" className="aspect-[4/3] w-20" showBadge={false} denso />
      </Link>
      <h3 className="min-w-0 flex-1 text-balance font-display text-[13px] font-bold leading-snug text-text-primary">
        <Link href={articleHref(article)} className="transition-colors hover:text-accent-soil">
          {article.title}
        </Link>
      </h3>
    </article>
  );
}

export function FeatureBand({
  feature,
  related,
  mostRead,
  mostReadId,
}: {
  feature?: Article;
  related: Article[];
  mostRead: Article[];
  /** `id` do h2 de "Mais lidas", para o `aria-labelledby` da faixa. */
  mostReadId: string;
}) {
  if (!feature && mostRead.length === 0) return null;

  const category = feature ? getCategory(feature.category) : null;
  const summary = feature ? articleSummary(feature) : "";

  return (
    <section aria-labelledby={mostReadId} className="container-editorial py-5 sm:py-6">
      <div className="grid gap-5 xl:grid-cols-12 xl:items-stretch">
        {/*
          3 de 12 colunas ≈ 0,62fr contra 9 da feature. A proporção é a mesma da
          referência: o ranking é denso e ocupa pouco; a feature é a peça forte
          da faixa.
        */}
        {mostRead.length > 0 && (
          <div className="xl:col-span-3">
            <div className="rule-heading flex items-baseline justify-between gap-3 pb-2">
              <h2 id={mostReadId} className="font-display text-lg font-bold uppercase tracking-wide text-text-primary">
                Mais lidas
              </h2>
            </div>
            <ol className="mt-1">
              {mostRead.map((article, index) => (
                <li key={article.slug || article.title} className="flex items-start gap-3 border-b border-line py-2.5 last:border-0">
                  <span aria-hidden="true" className="font-display text-2xl font-black leading-none text-gold tabular-nums">
                    {index + 1}
                  </span>
                  <h3 className="min-w-0 flex-1 text-balance font-display text-[15px] font-bold leading-snug text-text-primary">
                    <Link href={articleHref(article)} className="transition-colors hover:text-accent-soil">
                      {article.title}
                    </Link>
                  </h3>
                </li>
              ))}
            </ol>
          </div>
        )}

        {feature && (
          <div className="xl:col-span-9 xl:h-full">
            <div className="grid h-full gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Link href={articleHref(feature)} className="group relative block h-full overflow-hidden rounded-none bg-charcoal">
                <ArticleImage article={feature} sizes="(min-width: 1280px) 52vw, 100vw" className="aspect-[16/9] sm:h-full sm:aspect-auto" showBadge={false} />
                <div aria-hidden="true" className="media-veil absolute inset-0" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <span className="inline-block rounded-none bg-gold px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-charcoal">
                    {category?.label}
                  </span>
                  <h3 className="mt-3 max-w-3xl text-balance font-display text-2xl font-bold leading-tight text-white transition-colors group-hover:text-gold sm:text-4xl">
                    {feature.title}
                  </h3>
                  {summary && (
                    <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/80">
                      {summary}
                    </p>
                  )}
                  <p className="mt-3 text-[11px] font-semibold text-white/65">
                    {formatRelativeTime(feature.published_at)}
                  </p>
                </div>
              </Link>

              {related.length > 0 && (
                <div className="hairline sm:grid sm:h-full sm:grid-rows-4 sm:border-l sm:border-line sm:pl-4">
                  {related.slice(0, 4).map((article) => (
                    <RelatedRow key={article.slug || article.title} article={article} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
