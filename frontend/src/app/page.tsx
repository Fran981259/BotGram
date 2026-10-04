import type { Metadata } from "next";
import { Suspense } from "react";
import { fetchNewsResponse, rankHomepageArticles, type Article } from "@/lib/api";
import { prioritizeElectionCoverage, selectPoliticalCoverage } from "@/lib/electionCoverage";
import { HeroGrid } from "@/components/home/HeroGrid";
import { FeatureBand } from "@/components/home/FeatureBand";
import { EditorialColumns, type EditorialColumn } from "@/components/home/EditorialColumns";
import { MarketStrip } from "@/components/home/MarketStrip";
import { PoderModule } from "@/components/home/PoderModule";
import { Columnists } from "@/components/home/Columnists";
import { NewsroomCtaBlock } from "@/components/editorial/SectionBlocks";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";
import { getPublicSiteUrl } from "@/lib/siteUrl";
import { articleDedupKey, uniqueArticles } from "@/lib/articleDedupKey";

const BASE = getPublicSiteUrl();

// A barra de cotações usa fetch no-store; a home precisa permanecer dinâmica.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Portal Cerrado — Notícias de Mato Grosso do Sul",
    description: "Agro, mercados e negócios regionais. Política, economia, segurança e agronegócio em Mato Grosso do Sul, com apuração 24 horas.",
    alternates: { canonical: BASE },
    openGraph: {
      title: "Portal Cerrado — Notícias de MS",
      description: "Agro, mercados e negócios regionais de Mato Grosso do Sul.",
      url: BASE,
      type: "website",
      locale: "pt_BR",
      siteName: "Portal Cerrado",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [DEFAULT_SOCIAL_IMAGE] },
  };
}

/**
 * Hero: uma manchete, três apoios e o trilho de últimas.
 *
 * A ordem aqui é a ordem da página. O que o hero consome é retirado do mesmo
 * conjunto que o resto da página usa, e cada bloco marca no conjunto o que
 * pegou — é o que garante que nenhuma manchete apareça duas vezes.
 */
function pickHero(recent: Article[]): {
  main?: Article;
  side: Article[];
  rail: Article[];
} {
  const unique = uniqueArticles(prioritizeElectionCoverage(rankHomepageArticles(recent)));
  return {
    main: unique[0],
    side: unique.slice(1, 4),
    rail: unique.slice(4, 11),
  };
}

/**
 * Colunas editoriais.
 *
 * As quatro editorias são reais e existem como rota: Política, Agronegócio,
 * Tecnologia e Geral. Nenhuma foi inventada, e nenhuma matéria se repete nem
 * entre colunas nem com o que já está acima — o `taken` é compartilhado e cada
 * coluna só recebe o que ainda não foi exibido.
 *
 * Se uma editoria tiver menos de quatro matérias disponíveis depois da
 * deduplicação, a coluna mostra o que tem. A contagem se adapta; nada é
 * inventado para completar a grade.
 */
function buildColumns(
  sources: { slug: string; label: string; articles: Article[] }[],
  taken: Set<string>,
  consume: (...articles: (Article | undefined)[]) => void,
): EditorialColumn[] {
  return sources
    .map(({ slug, label, articles }) => {
      const fresh = rankHomepageArticles(
        uniqueArticles(articles.filter((article) => !taken.has(articleDedupKey(article)))),
      ).slice(0, 4);
      // Registrar pelo MESMO caminho dos outros blocos. Uma chamada direta a
      // `taken.add` aqui marcava a chave mas não a matéria, e a faixa escura
      // seguinte — que exclui pela lista de matérias — exibia de novo a manchete
      // da coluna de Política.
      consume(...fresh);
      return { slug, label, articles: fresh };
    })
    .filter((column) => column.articles.length > 0);
}

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      url: BASE,
      name: "Portal Cerrado",
      inLanguage: "pt-BR",
      description: "Notícias de Agro, Mercados e Negócios regionais de Mato Grosso do Sul.",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${BASE}/busca?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "Portal Cerrado",
      url: BASE,
      foundingLocation: "Campo Grande, Mato Grosso do Sul, Brasil",
      areaServed: "Mato Grosso do Sul, Brasil",
    },
  ],
};

export default async function Home() {
  /*
    Cinco buscas em paralelo. Todas independentes, todas com `Promise.allSettled`:
    uma editoria que falha não pode derrubar a página, porque a home é montada
    por blocos e cada bloco trata o seu conjunto como possivelmente vazio.
  */
  const settled = await Promise.allSettled([
    fetchNewsResponse({ region: "ms", limit: 24, sortBy: "recent" }),
    fetchNewsResponse({ region: "ms", category: "agriculture", limit: 10, sortBy: "recent" }),
    fetchNewsResponse({ region: "ms", category: "politics", limit: 28, sortBy: "recent" }),
    fetchNewsResponse({ region: "ms", category: "tech", limit: 10, sortBy: "recent" }),
    fetchNewsResponse({ region: "ms", category: "general", limit: 12, sortBy: "recent" }),
  ]);

  const [recentResult, agroResult, politicsResult, techResult, generalResult] = settled;

  const recent = recentResult.status === "fulfilled" ? recentResult.value.news : [];
  const agro = agroResult.status === "fulfilled" ? agroResult.value.news : [];
  const politics = politicsResult.status === "fulfilled" ? politicsResult.value.news : [];
  const tech = techResult.status === "fulfilled" ? techResult.value.news : [];
  const general = generalResult.status === "fulfilled" ? generalResult.value.news : [];

  const hardError = settled.every((result) => result.status === "rejected");

  /*
    Registro de consumo. `shown` guarda as MATÉRIAS já exibidas e `taken` as
    chaves; os dois crescem juntos. Existe o par porque `selectPoliticalCoverage`
    recebe artigos para excluir, enquanto os blocos de EditorialColumns
    consultam por chave — manter só um dos dois exigiria converter de um para o
    outro a cada bloco, e é essa conversão que costuma vazar uma repetição.
  */
  const shown: Article[] = [];
  const taken = new Set<string>();
  const consume = (...articles: (Article | undefined)[]) => {
    for (const article of articles) {
      if (!article) continue;
      const key = articleDedupKey(article);
      if (taken.has(key)) continue;
      taken.add(key);
      shown.push(article);
    }
  };

  /* ── 1. Hero ───────────────────────────────────────────────────────────── */
  const { main, side, rail } = pickHero(recent);
  consume(main, ...side, ...rail);

  /* ── 2. Mais lidas + feature ────────────────────────────────────────────── */
  const mostRead = uniqueArticles(
    recent
      .filter((article) => !taken.has(articleDedupKey(article)) && (article.engagement_score ?? 0) > 0)
      .sort((a, b) => (b.engagement_score ?? 0) - (a.engagement_score ?? 0))
      .slice(0, 5),
  );

  /*
    A feature é a matéria de maior relevância entre as que ainda não apareceram.
    Não há "Especial" no Portal Cerrado — não existe campo, curadoria ou série
    com esse nome na API — então o rótulo exibido é a editoria real, e a peça
    mantém a forma da referência: imagem grande, manchete em serifa, resumo.
  */
  const mostReadKeys = new Set(mostRead.map(articleDedupKey));
  const featurePool = uniqueArticles(
    recent.filter(
      (article) => !taken.has(articleDedupKey(article)) && !mostReadKeys.has(articleDedupKey(article)),
    ),
  );
  const feature = featurePool[0];
  const related = featurePool.slice(1, 5);

  consume(feature, ...related, ...mostRead);

  /* ── 3. Quatro colunas editoriais ───────────────────────────────────────── */
  const columns = buildColumns(
    [
      { slug: "politics", label: "Política", articles: politics },
      { slug: "agriculture", label: "Agronegócio", articles: agro },
      { slug: "tech", label: "Tecnologia", articles: tech },
      { slug: "general", label: "Geral", articles: general },
    ],
    taken,
    consume,
  );

  /* ── 4. Faixa escura ───────────────────────────────────────────────────── */
  /*
    A faixa escura é "Poder e eleições", conceito editorial real do projeto. A
    mesma consulta de política alimenta a faixa e a coluna de Política.

    A ordem de consumo é faixa primeiro: as quatro matérias mais relevantes da
    faixa vêm de `selectPoliticalCoverage`, e a coluna de Política fica com o
    que sobrou. A exclusão é passada como ARTIGOS, e não como um conjunto de
    slugs, porque é a assinatura que `selectPoliticalCoverage` já usa — passar
    uma lista de strings silenciosamente não excluiria nada.
  */
  const politicalCoverage = selectPoliticalCoverage(politics, shown, 4);
  consume(...politicalCoverage);

  /* ── 5. Assinaturas ────────────────────────────────────────────────────── */
  const shownBeforeColumnists = shown.map(articleDedupKey);

  return (
    <div className="bg-canvas">
      {hardError && (
        <div className="container-editorial pt-6" role="alert">
          <p className="border-l-2 border-gold px-4 py-3 text-sm font-semibold text-text-primary">
            A API de notícias não respondeu neste momento. As cotações de mercado seguem carregando de fontes independentes.
          </p>
        </div>
      )}

      <HeroGrid main={main} side={side} rail={rail} latest={[]} />

      {/*
        A feature aceita `main` ausente: com poucas matérias no feed, a faixa
        ainda mostra "Mais lidas" sozinho, sem buraco de 9 colunas.
      */}
      {(mostRead.length > 0 || feature) && (
        <FeatureBand
          mostReadId="mais-lidas-heading"
          mostRead={mostRead}
          feature={feature}
          related={related}
        />
      )}

      <EditorialColumns columns={columns} />

      <MarketStrip />

      <PoderModule
        articles={politicalCoverage}
        eyebrow="Poder e eleições"
        title="Política que influencia Mato Grosso do Sul"
        description="Acompanhamento de política nacional, eleições e decisões com impacto no estado."
        href="/categoria/politics"
        linkLabel="Ver todas"
        headingId="poder-heading"
      />

      <Suspense
        fallback={
          <section aria-label="Carregando assinaturas" className="container-editorial py-7">
            <div className="rule-heading h-6 w-48 animate-pulse bg-black/5" />
            <div className="mt-4 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 lg:block">
                  <div className="aspect-[4/3] w-24 shrink-0 animate-pulse bg-black/5 lg:aspect-[16/10] lg:w-full" />
                  <div className="h-3 flex-1 animate-pulse bg-black/5" />
                </div>
              ))}
            </div>
          </section>
        }
      >
        <Columnists exclude={shownBeforeColumnists} />
      </Suspense>

      {/* `div` e não `section`: o NewsroomCtaBlock já é uma região com
          aria-labelledby. Envolvê-lo numa section criaria dois landmarks
          anunciando o mesmo bloco. */}
      <div className="container-editorial pb-8">
        <NewsroomCtaBlock />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
      />
    </div>
  );
}
