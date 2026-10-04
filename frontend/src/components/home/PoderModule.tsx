import Link from "next/link";
import { ArticleImage } from "@/components/home/ArticleImage";
import { getCategory } from "@/lib/categories";
import type { Article } from "@/lib/api";
import { articleHref } from "@/lib/articlePresentation";

/**
 * PoderModule — faixa escura temática.
 *
 * O conceito foi aprovado na fase anterior e NÃO foi substituído: é política
 * real, com imagens reais, rótulo dourado e fundo verde profundo. A mudança
 * desta fase é de ESTRUTURA.
 *
 * ── O QUE A AUDITORIA APONTOU ────────────────────────────────────────────────
 *
 * Antes a faixa era "uma manchete muito maior + quatro cards espremidos". A
 * assimetria era grande demais: a manchete ocupava metade da largura e 4/5 da
 * altura da faixa, e os quatro de apoio dividiam a outra metade em duas
 * colunas de duas linhas. Lidas lado a lado, as cinco peças não tinham o mesmo
 * peso — e a referência mostra QUATRO cards de peso comparável.
 *
 * Agora são quatro cards na mesma razão, na mesma altura, com o mesmo peso
 * tipográfico. A faixa continua sendo um corte dramático de página — é a
 * mudança de fundo e o contraste que produzem isso, não o tamanho
 * desigual das peças.
 *
 * Se houver menos de quatro matérias de política disponíveis depois da
 * deduplicação, a faixa mostra o que existe. Nenhuma matéria é inventada para
 * completar quatro casas.
 */

function DarkCard({ article }: { article: Article }) {
  const category = getCategory(article.category);

  return (
    <article className="group relative overflow-hidden rounded-none bg-charcoal">
      <Link href={articleHref(article)} className="block">
        <ArticleImage article={article} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 100vw" className="aspect-[16/10]" showBadge={false} denso />
        <div aria-hidden="true" className="media-veil absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gold">{category.label}</span>
          <h3 className="mt-1.5 text-balance font-display text-lg font-bold leading-snug text-white transition-colors group-hover:text-gold">
            {article.title}
          </h3>
        </div>
      </Link>
    </article>
  );
}

export function PoderModule({
  articles,
  eyebrow,
  title,
  description,
  href,
  linkLabel,
  headingId,
}: {
  articles: Article[];
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  headingId: string;
}) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="mt-2 bg-green-deep py-8 text-white sm:py-9">
      <div className="container-editorial">
        <div className="rule-heading-dark flex flex-wrap items-baseline justify-between gap-3 border-b-2 pb-2.5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold">{eyebrow}</p>
            <h2 id={headingId} className="mt-1 font-display text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
              {title}
            </h2>
          </div>
          <Link
            href={href}
            className="shrink-0 py-1 text-[11px] font-bold uppercase tracking-wider text-gold transition-colors hover:text-white"
          >
            {linkLabel}
          </Link>
        </div>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">{description}</p>

        {/*
          Quatro colunas a partir de 1024px, duas no meio e uma no celular. Com
          `items-stretch` e a mesma razão, os quatro cards terminam na mesma
          altura mesmo quando as manchetes têm comprimentos diferentes — a
          diferença de texto é absorvida pelo card mais alto da linha, e não por
          uma diferença de tamanho entre as peças.
        */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {articles.slice(0, 4).map((article) => (
            <DarkCard key={article.slug || article.title} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
