import Link from "next/link";
import { REPORTERS, reporterInitials, type ReporterBio } from "@/lib/reporters";
import { fetchNewsResponse } from "@/lib/api";
import { getCategory } from "@/lib/categories";
import { formatRelativeTime } from "@/lib/time";
import { ArticleImage } from "@/components/home/ArticleImage";
import type { Article } from "@/lib/api";
import { articleDedupKey } from "@/lib/articleDedupKey";

const COLUMNIST_SLUGS = ["luciana.freitas", "camila.rocha", "bia.fernandes", "rafael.dumas", "maya.santos", "leon.vaz", "enzo.bianchi", "marcus.teixeira"];

type ColumnistEntry = {
  slug: string;
  bio: ReporterBio;
  latest?: Article;
};

/**
 * Carrega a matéria mais recente de cada colunista, pulando as que a página já
 * mostrou mais acima.
 *
 * Este componente busca sozinho, sem saber o que os blocos anteriores
 * renderizaram. Medido: sem o filtro, 6 das 8 assinaturas repetiam uma manchete
 * que já estava nos destaques, no agro ou no ranking de mais lidas — o plano
 * proíbe manchete repetida na mesma página.
 *
 * Por isso busca cinco matérias por colunista e fica com a primeira que ainda
 * não apareceu. Se as cinco já apareceram, o cartão é omitido: preferimos um
 * bloco menor a uma manchete repetida.
 */
async function loadColumnists(excluded: Set<string>): Promise<ColumnistEntry[]> {
  const settled = await Promise.allSettled(
    COLUMNIST_SLUGS.map((slug) =>
      fetchNewsResponse({ reporterSlug: slug, region: "ms", limit: 5, sortBy: "recent" }).then((res) =>
        res.news.find((article) => !excluded.has(articleDedupKey(article))),
      ),
    ),
  );
  return COLUMNIST_SLUGS.map((slug, index) => ({
    slug,
    bio: REPORTERS[slug],
    latest: settled[index].status === "fulfilled" && settled[index].value ? settled[index].value : undefined,
  }));
}

function latestHref(article: Article): string {
  return article.slug ? `/noticia/${article.slug}` : article.url || "#";
}

/**
 * Distribui as colunas da ÚLTIMA linha para que ela nunca fique com espaço
 * descoberto.
 *
 * O defeito que esta função existia para corrigir: com 5 assinaturas, a quinta
 * recebia `col-span-2` numa grade de 4 colunas e ficava sozinha na segunda
 * linha com duas colunas vazias ao lado — o "cartão isolado" que a auditoria
 * mediu. A regra agora é aritmética: o resto da última linha é distribuído
 * entre os cartões que sobraram.
 *
 *   resto 0 → nada a ajustar
 *   resto 1 → o último ocupa a linha inteira
 *   resto 2 → os dois últimos dividem a linha ao meio
 *   resto 3 → os três últimos dividem a linha em terços
 */
const GRID_COLS = 4;

function trailingSpans(total: number, index: number): string {
  const cardsInLastRow = total % GRID_COLS;
  if (cardsInLastRow === 0) return "";

  const lastIndex = total - 1;
  const isInLastRow = index >= total - cardsInLastRow;

  if (cardsInLastRow === 1) {
    return index === lastIndex ? "lg:col-span-12 sm:col-span-2" : "lg:col-span-3";
  }

  if (cardsInLastRow === 2) {
    return isInLastRow ? "lg:col-span-6" : "lg:col-span-3";
  }

  return isInLastRow ? "lg:col-span-4" : "lg:col-span-3";
}

export async function Columnists({ exclude = [] }: { exclude?: string[] }) {
  const entries = await loadColumnists(new Set(exclude));
  const publishedEntries = entries.filter(
    (entry): entry is ColumnistEntry & { latest: Article } => Boolean(entry.latest),
  );

  if (publishedEntries.length === 0) return null;

  return (
    <section aria-labelledby="colunistas-heading" className="container-editorial py-6 sm:py-7">
      <div className="rule-heading flex flex-wrap items-baseline justify-between gap-3 pb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-deep">Por quem apura</p>
          <h2 id="colunistas-heading" className="mt-1 font-display text-lg font-bold uppercase tracking-wide text-text-primary sm:text-xl">
            Últimas assinaturas
          </h2>
        </div>
        <Link
          href="/contato"
          className="shrink-0 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-soil transition-colors hover:text-gold-deep"
        >
          Fale com a redação
        </Link>
      </div>

      <div className="mt-3 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:gap-y-7 lg:grid-cols-12">
        {publishedEntries.map(({ slug, bio, latest }, index) => {
          const span = trailingSpans(publishedEntries.length, index);
          const fullWidth = span.includes("lg:col-span-12");

          return (
            <article key={slug} className={`group min-w-0 flex gap-3 lg:block ${span}`}>
              <Link
                href={latestHref(latest)}
                className={
                  fullWidth
                    ? "flex min-w-0 flex-1 gap-3 lg:flex lg:items-center lg:gap-6"
                    : "flex min-w-0 flex-1 gap-3 lg:block"
                }
                aria-label={`Matéria de ${bio.name}: ${latest.title}`}
              >
                {/*
                  Abaixo de `lg` o cartão é uma LINHA: miniatura de 96px ao lado
                  do texto. Cinco cartões em bloco ocupavam 2241px da home e
                  eram a maior fatia isolada de altura redundante. Nenhuma
                  informação foi removida — matéria, editoria, manchete,
                  assinatura e hora continuam visíveis. Só a caixa de imagem
                  deixou de ter 100% da largura.
                */}
                <ArticleImage
                  article={latest}
                  showBadge={false}
                  sizes={fullWidth ? "(min-width: 1024px) 30vw, 96px" : "(min-width: 1024px) 24vw, 96px"}
                  className={
                    fullWidth
                      ? "aspect-[4/3] w-24 shrink-0 lg:aspect-[16/9] lg:w-2/5 lg:shrink"
                      : "aspect-[4/3] w-24 shrink-0 lg:aspect-[16/10] lg:w-full"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent-soil">
                    {getCategory(latest.category).label}
                  </p>
                  <h3
                    className={
                      fullWidth
                        ? "mt-1 line-clamp-3 font-display text-xl font-bold leading-tight text-text-primary transition-colors group-hover:text-accent-soil lg:text-2xl"
                        : "mt-1 line-clamp-3 font-display text-lg font-bold leading-tight text-text-primary transition-colors group-hover:text-accent-soil lg:text-base"
                    }
                  >
                    {latest.title}
                  </h3>
                </div>
              </Link>

              <div className="mt-3 flex shrink-0 items-center justify-between gap-3 self-end text-[11px] text-text-muted lg:mt-2.5 lg:w-full lg:self-auto">
                <Link
                  href={`/reporter/${slug}`}
                  className="inline-flex min-w-0 items-center gap-2 py-1 font-bold text-text-primary transition-colors hover:text-accent-soil"
                >
                  <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold font-display text-[9px] font-bold text-charcoal">
                    {reporterInitials(bio.name)}
                  </span>
                  <span className="truncate">{bio.name}</span>
                </Link>
                <span className="shrink-0">{formatRelativeTime(latest.published_at)}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
