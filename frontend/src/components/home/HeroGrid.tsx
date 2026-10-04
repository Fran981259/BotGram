import Link from "next/link";
import { formatRelativeTime, formatTimeOnly } from "@/lib/time";
import {
  HeroStoryCard,
} from "@/components/editorial/StoryCards";
import { ArticleImage } from "@/components/home/ArticleImage";
import { getCategory } from "@/lib/categories";
import type { Article } from "@/lib/api";
import { articleHref } from "@/lib/articlePresentation";
import { uniqueArticles } from "@/lib/articleDedupKey";

/**
 * HeroGrid — a primeira dobra da homepage.
 *
 * Geometria da referência aprovada: três colunas na proporção 1,85fr / 1fr /
 * 0,78fr, o que numa grade de 12 dá 6 / 3 / 3. À esquerda a manchete principal
 * em imagem grande; ao centro, três cards de apoio também em imagem; à
 * direita, um trilho de texto.
 *
 * ── O QUE MUDOU E POR QUÊ ────────────────────────────────────────────────────
 *
 * Antes a coluna do centro era "um card grande + uma linha compacta". Isso
 * misturava duas densidades e produzia a sensação de três caixas soltas: a
 * referência usa três cards de apoio do MESMO peso visual, empilhados, e é
 * essa regularidade que faz a coluna ler como um bloco.
 *
 * A caixa do herói principal é `aspect-[4/5]` no celular e `16/10` a partir de
 * `sm`. Antes era `4/5 sm:16/10 xl:6/5`. A razão `6/5` no desktop era o que
 * empurrava a manchete para fora da primeira dobra numa janela de 768px de
 * altura. A referência usa 3/2 na coluna principal — mais larga e mais baixa,
 * e é o que deixa as três colunas terminarem na mesma altura.
 *
 * Regra do projeto: nenhum nome de utilitário é escrito dentro de comentário.
 * O Tailwind varre o texto bruto do arquivo, então citar uma classe que não
 * está em uso emite CSS morto para ela.
 */

/** Manchete principal: domina a primeira dobra. */
function MainCard({ article }: { article: Article }) {
  return (
    <div className="xl:col-span-6">
      {/*
        A caixa da manchete é quase quadrada a partir de `sm`, e a razão veio da
        referência: medindo a imagem aprovada, a coluna principal tem 852px por
        808px — 1,05. É o que faz as três colunas do hero terminarem na mesma
        altura, porque três cards de apoio em 16/10 somam quase exatamente essa
        medida. Com a razão das editorias (6/5) a coluna da manchete ficava
        cerca de 100px mais baixa e o hero terminava em degrau.
      */}
      <HeroStoryCard
        article={article}
        priority
        showSummary
        nivel="h1"
        ratio="aspect-[4/5] sm:aspect-[1/1]"
        titleClassName="text-[1.75rem] sm:text-4xl lg:text-[3.25rem]"
      />
    </div>
  );
}

/**
 * Card de apoio.
 *
 * Desktop: três cards de imagem com o MESMO peso visual, empilhados. É a
 * regularidade que a referência usa e que o arranjo anterior ("um grande + um
 * pequeno") não tinha.
 *
 * Celular: LINHA com miniatura. Três cards de imagem em sequência ocupavam
 * cerca de 900px da primeira dobra do celular, e é exatamente o que a fase de
 * composição mobile proíbe — três cards grandes em sequência. Nenhuma
 * informação some: a matéria, a editoria, a manchete e a hora continuam no
 * card, só a caixa de imagem deixa de ocupar 100% da largura.
 */
function SupportCard({ article }: { article: Article }) {
  const category = getCategory(article.category);
  const href = articleHref(article);
  const time = formatRelativeTime(article.published_at);

  /*
    O article NÃO tem fundo próprio. Na versão desktop o texto fica sobre a
    imagem, então não precisa de fundo; na versão mobile é uma linha sobre o
    papel da página, e um fundo carvão deixaria o título — que é `text-primary`,
    quase preto — invisível sobre o carvão. Foi exatamente o que apareceu na
    primeira captura do celular: três cartões com a editoria e a hora visíveis e
    a manchete sumindo.
  */
  return (
    <article className="group relative overflow-hidden rounded-none xl:h-full">
      <Link href={href} className="flex items-center gap-3 sm:block xl:h-full">
        <ArticleImage
          article={article}
          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 96px"
          className="aspect-square w-24 shrink-0 sm:aspect-[16/10] sm:w-full xl:h-full xl:aspect-auto"
          showBadge={false}
        />
        <div className="min-w-0 flex-1 sm:absolute sm:inset-0 sm:flex sm:flex-col sm:justify-end sm:p-4">
          <div aria-hidden="true" className="media-veil absolute inset-0 hidden sm:block" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-deep sm:text-gold">
            {category.label}
          </span>
          <h2 className="mt-1 text-balance font-display text-[15px] font-bold leading-snug text-text-primary transition-colors group-hover:text-accent-soil sm:text-lg sm:text-white sm:group-hover:text-gold">
            {article.title}
          </h2>
          <span className="mt-1 block text-[11px] font-semibold text-text-muted sm:text-white/60">
            {time}
          </span>
        </div>
      </Link>
    </article>
  );
}

/**
 * Linha do trilho "Últimas notícias": hora na coluna estreita, manchete no
 * resto, filete entre as linhas.
 *
 * É uma peça local deste componente, e não uma família nova em
 * `editorial/StoryCards`, porque a forma existe em um lugar só da home. A
 * família `CompactStoryCard` continua como está: miniatura à esquerda e
 * editoria sobre o título, que é o que as listas de editoria e as seções
 * secundárias usam.
 */
function RailRow({ article }: { article: Article }) {
  const href = articleHref(article);
  const hora = formatTimeOnly(article.published_at);

  return (
    <article className="flex gap-3 py-2">
      <time className="w-9 shrink-0 pt-0.5 text-[11px] font-bold tabular-nums text-gold-deep">
        {hora}
      </time>
      <h3 className="min-w-0 flex-1 text-balance font-display text-[14px] font-bold leading-snug text-text-primary">
        <Link href={href} className="transition-colors hover:text-accent-soil">
          {article.title}
        </Link>
      </h3>
    </article>
  );
}

function LatestRail({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;

  /*
    O trilho é um PAINEL de papel um tom acima da página, não uma coluna com
    borda. Na referência ele é uma superfície clara apoiada na grade, com
    respiro interno, e é essa diferença de tom — e não uma linha — que separa
    a coluna de texto das duas colunas de foto.
  */
  return (
    <div className="flex h-full flex-col bg-paper-alt p-4 xl:col-span-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="relative pb-1.5 font-display text-base font-bold uppercase tracking-wide text-text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-8 after:bg-gold">
          Últimas notícias
        </h2>
        <Link
          href="/categoria/general"
          className="shrink-0 py-1 text-[11px] font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-accent-soil"
        >
          Ver todas →
        </Link>
      </div>

      <div className="hairline mt-2 flex-1">
        {uniqueArticles(articles).slice(0, 7).map((article) => (
          <RailRow key={article.slug || article.title} article={article} />
        ))}
      </div>

      <Link
        href="/categoria/general"
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-none bg-accent-soil px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-green-deep"
      >
        Ver mais notícias
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

export function HeroGrid({
  main,
  side,
  rail,
  latest,
}: {
  main?: Article;
  side: Article[];
  rail: Article[];
  latest: Article[];
}) {
  const hasSide = side.length > 0;
  const hasRail = rail.length > 0 || latest.length > 0;
  if (!main && !hasSide && !hasRail) return null;

  // O trilho prefere `rail` e completa com `latest`. Sem isso, uma página com
  // poucas matérias deixaria a coluna direita vazia ao lado de duas colunas
  // cheias — que é o vazio assimétrico que a auditoria apontou na faixa de
  // "Mais lidas".
  const railItems = [...rail, ...latest];

  return (
    <section aria-labelledby="destaques-heading" className="container-editorial py-5 sm:py-6">
      <h2 id="destaques-heading" className="sr-only">
        Manchetes em destaque
      </h2>

      {/*
        A grade de 12 colunas só entra a partir de 1280px. Medido a 1024px: a
        grade dava 58,66px por coluna, o trilho de 3 colunas ficava com 224px, e
        a miniatura do card denso consumia 116px — sobrando 55px de texto, com a
        manchete transbordando para fora do documento (scrollWidth 1046 contra
        1024). Entre 1024px e 1279px a home empilha, que é o desenho pretendido.
      */}
      <div className="grid gap-x-6 gap-y-6 xl:grid-cols-12 xl:items-stretch">
        {main && <MainCard article={main} />}

        {hasSide && (
          <div className="hairline grid gap-x-5 gap-y-0 sm:grid-cols-3 sm:gap-4 xl:col-span-3 xl:grid-cols-1 xl:grid-rows-3 xl:gap-4 xl:[&>*+*]:border-t-0">
            {side.slice(0, 3).map((article) => (
              <SupportCard key={article.slug || article.title} article={article} />
            ))}
          </div>
        )}

        {hasRail && <LatestRail articles={railItems} />}
      </div>
    </section>
  );
}
