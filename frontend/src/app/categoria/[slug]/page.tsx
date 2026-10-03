import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { fetchNewsResponse, fetchTrends } from "@/lib/api";
import { metaDescription } from "@/lib/siteMetadata";
import { FeatureStoryCard, HeroStoryCard, StoryCard } from "@/components/editorial/StoryCards";
import { SectionHeader } from "@/components/editorial/SectionBlocks";
import { CATEGORY_LIST, getCategory, categorySlug } from "@/lib/categories";
import { TrendPanel } from "@/components/TrendPanel";
import { Pagination } from "@/components/Pagination";
import { parsePage } from "@/lib/pagination";
import { Icon } from "@/components/Icon";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";
import { getPublicSiteUrl } from "@/lib/siteUrl";

export const revalidate = 60;

export function generateStaticParams() {
  return CATEGORY_LIST.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await searchParams;
  const base = getPublicSiteUrl();
  const cat = getCategory(slug);
  const currentPage = parsePage(page);
  if (currentPage === null || !categorySlug(slug)) notFound();
  const canonical = `${base}/categoria/${slug}${currentPage > 1 ? `?page=${currentPage}` : ""}`;
  // A descrição anterior media 42 caracteres, curta demais para a faixa útil
  // dos 155 que um buscador mostra. O total vem da API; se a busca falhar, o
  // texto cai na versão sem número em vez de prometer um dado que não temos.
  let total: number | null = null;
  try {
    const r = await fetchNewsResponse({ category: slug, limit: 1 });
    total = r.total ?? null;
  } catch {
    total = null;
  }
  const descricao = total
    ? `${cat.label} em Mato Grosso do Sul: ${total} ${total === 1 ? "matéria publicada" : "matérias publicadas"}, com apuração da redação do Portal Cerrado.`
    : `${cat.label} em Mato Grosso do Sul: acompanhe as principais atualizações, com contexto regional e apuração da redação do Portal Cerrado.`;
  return {
    title: cat.label,
    description: metaDescription(descricao),
    alternates: { canonical },
    robots: currentPage > 1 ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: `${cat.label} | Portal Cerrado`,
      description: metaDescription(descricao),
      url: canonical,
      type: "website",
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [DEFAULT_SOCIAL_IMAGE] },
  };
}

export default async function CategoriaPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const { page } = await searchParams;
  const cat = getCategory(slug);
  const perPage = 24;
  const currentPage = parsePage(page);
  const canonicalSlug = categorySlug(slug);
  if (currentPage === null || !canonicalSlug) notFound();
  if (canonicalSlug !== slug) permanentRedirect(`/categoria/${canonicalSlug}${currentPage > 1 ? `?page=${currentPage}` : ""}`);
  const offset = (currentPage - 1) * perPage;
  const [newsResult, trends] = await Promise.all([
    fetchNewsResponse({ category: slug, region: "ms", limit: perPage, offset, sortBy: "trend" }),
    fetchTrends(5),
  ]);
  const articles = newsResult.news;
  // Frente de editoria: uma matéria que domina, duas de apoio, o resto em
  // arquivo. A divisão respeita a ordem que a consulta devolveu, que é por
  // tendência — o que a editoria highlights não precisa reordenar.
  const destaque = articles[0];
  const apoio = articles.slice(1, 3);
  const resto = articles.slice(3);
  const totalPages = Math.max(1, Math.ceil((newsResult.total || 0) / perPage));
  if (currentPage > totalPages) notFound();

  return (
    <div className="bg-canvas py-7 sm:py-9">
      <div className="container-editorial">
        <header className="border-b-2 border-charcoal pb-5">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-gold-deep"><Icon name={cat.iconClass} /> Editoria</span>
          <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text-primary sm:text-5xl lg:text-6xl">{cat.label}</h1>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-accent-soil">{newsResult.total} matérias publicadas</p>
        </header>

      {/*
        Frente de editoria, em três tempos: uma matéria que domina, um bloco de
        apoio e o restante em arquivo.

        Antes era uma grade de cartões do mesmo peso, que é o comportamento de
        CMS genérico. Agora a primeira matéria ocupa sete das doze colunas e
        recebe tratamento de manchete principal; duas entram como apoio; o
        resto desce como arquivo da editoria.

        Cada bloco é guardado pelo próprio tamanho. Se a editoria trouxer uma
        matéria só, a grade de apoio nem chega a ser criada e o arquivo lista o
        que existe — não sobra área reservada.
      */}
      {articles.length === 0 ? (
        <div className="border-y border-black/10 bg-surface p-12 text-center text-text-muted">
          Nenhuma matéria em {cat.label} ainda.
          <Link href="/" className="mt-4 block font-black text-accent-soil">← Voltar para capa</Link>
        </div>
      ) : (
        <>
          <div className="grid gap-x-6 gap-y-7 lg:grid-cols-12 lg:items-start">
            {destaque && (
              <div className="lg:col-span-7">
                <HeroStoryCard article={destaque} nivel="h2" />
              </div>
            )}

            {apoio.length > 0 && (
              <div className="grid content-start gap-5 lg:col-span-5">
                {apoio.map((a) => (
                  <FeatureStoryCard key={a.slug || a.title} article={a} nivel="h3" />
                ))}
              </div>
            )}
          </div>

          <div className="mt-10">
            <TrendPanel trends={trends} title="Temas em alta no portal" compact />
          </div>

          {resto.length > 0 && (
            <>
              <div className="mt-12">
                <SectionHeader eyebrow="Arquivo" title={`Mais em ${cat.label}`} />
              </div>
              <div className="mt-6 grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                {resto.map((a) => (
                  <StoryCard key={a.slug || a.title} article={a} nivel="h3" />
                ))}
              </div>
            </>
          )}
        </>
      )}

        <Pagination page={currentPage} totalPages={totalPages} base={`/categoria/${slug}`} />
      </div>
    </div>
  );
}
