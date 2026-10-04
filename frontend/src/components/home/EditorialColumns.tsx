import Link from "next/link";
import { ArticleImage } from "@/components/home/ArticleImage";
import { ArticleMeta } from "@/components/editorial/ArticleMeta";
import type { Article } from "@/lib/api";
import { articleHref, articleSummary } from "@/lib/articlePresentation";

/**
 * EditorialColumns — quatro colunas de editoria.
 *
 * É a peça que substitui o arranjo "quatro cards iguais". Na referência as
 * quatro colunas têm a mesma ESTRUTURA e o mesmo ritmo, e é essa repetição que
 * faz a página ler como um jornal: cabeçalho com "Ver mais", foto grande,
 * manchete em serifa, resumo curto, metadados, e três linhas menores com
 * miniatura quadrada e filete.
 *
 * ── O QUE ESTE COMPONENTE NÃO É ─────────────────────────────────────────────
 *
 * Não são quatro caixas. Não há borda em volta da coluna, não há fundo, não há
 * raio. O que separa uma coluna da outra é o espaço em branco e, dentro da
 * coluna, um filete de 1px entre as linhas. Foi a remoção da caixa — e não a
 * troca de cor — que tirou o aspecto de painel de aplicativo.
 *
 * A coluna é declarada como `border-r` no desktop para que a página leia como
 * colunas de jornal, e não como quatro blocos soltos.
 *
 * ── DADOS ────────────────────────────────────────────────────────────────────
 *
 * Toda coluna recebe matérias REAIS de uma editoria real, e nenhuma matéria se
 * repete entre colunas: o `page.tsx` monta um único conjunto de slugs já
 * exibidos e cada coluna consome desse conjunto. Se uma editoria não tiver
 * quatro matérias disponíveis depois da dedup, a coluna mostra o que tem — a
 * contagem se adapta, e nada é inventado para completar a grade.
 */

export type EditorialColumn = {
  /** Slug da editoria, usado na rota `/categoria/<slug>`. */
  slug: string;
  /** Rótulo do cabeçalho da coluna. */
  label: string;
  articles: Article[];
};

/** Linha de apoio: miniatura quadrada à esquerda, manchete à direita. */
function ColumnRow({ article }: { article: Article }) {
  return (
    <article className="flex items-start gap-3 py-2.5">
      <Link href={articleHref(article)} className="block w-[72px] shrink-0" tabIndex={-1} aria-hidden="true">
        <ArticleImage article={article} sizes="72px" className="aspect-square w-[72px]" showBadge={false} denso />
      </Link>
      <h4 className="min-w-0 flex-1 text-balance font-display text-[13px] font-bold leading-snug text-text-primary">
        <Link href={articleHref(article)} className="transition-colors hover:text-accent-soil">
          {article.title}
        </Link>
      </h4>
    </article>
  );
}

function Column({ column }: { column: EditorialColumn }) {
  const [lead, ...support] = column.articles;
  if (!lead) return null;

  const summary = articleSummary(lead);

  return (
    <div className="xl:border-r xl:border-line xl:pr-5 xl:last:border-r-0 xl:last:pr-0">
      <div className="rule-heading flex items-baseline justify-between gap-3 pb-2">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary">
          {column.label}
        </h3>
        <Link
          href={`/categoria/${column.slug}`}
          className="shrink-0 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-soil transition-colors hover:text-gold-deep"
        >
          Ver mais
        </Link>
      </div>

      <article className="mt-3">
        <Link href={articleHref(lead)} className="group block">
          <ArticleImage article={lead} sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw" className="aspect-[16/10]" showBadge={false} />
          <h4 className="mt-2.5 text-balance font-display text-lg font-bold leading-tight text-text-primary transition-colors group-hover:text-accent-soil">
            {lead.title}
          </h4>
        </Link>
        {summary && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-text-muted">{summary}</p>
        )}
        <ArticleMeta article={lead} variant="inline" showUpdated={false} className="mt-2" />
      </article>

      {support.length > 0 && (
        <div className="hairline mt-2">
          {support.slice(0, 3).map((article) => (
            <ColumnRow key={article.slug || article.title} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorialColumns({ columns }: { columns: EditorialColumn[] }) {
  const comConteudo = columns.filter((column) => column.articles.length > 0);
  if (comConteudo.length === 0) return null;

  return (
    <section aria-label="Editorias em destaque" className="container-editorial py-6 sm:py-7">
      {/*
        Quatro colunas de verdade a partir de 1280px. Entre 1024 e 1279 são duas,
        porque com quatro a coluna ficava com 220px e a manchete da chamada
        estourava o texto para fora da caixa.
      */}
      <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">
        {comConteudo.map((column) => (
          <Column key={column.slug} column={column} />
        ))}
      </div>
    </section>
  );
}
