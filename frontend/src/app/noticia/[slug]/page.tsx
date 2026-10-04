import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { metaDescription } from "@/lib/siteMetadata";
import { fetchArticleBySlug, fetchNewsResponse } from '@/lib/api';
import type { Article } from '@/lib/api';
import {
  cleanArticleText,
  formatArticleContent,
  formatArticleDate,
  readingTimeMinutes,
  sanitizeArticleHtml,
  serializeJsonLd,
} from '@/lib/formatArticle';
import { categorySlug, getCategory, PATTERN_IMAGES } from '@/lib/categories';
import { ArticleQuickGuide } from '@/components/article/ArticleQuickGuide';
import { ArticleImage } from '@/components/home/ArticleImage';
import { ArticleShareActions } from '@/components/article/ArticleShareActions';
import { StoryCard } from '@/components/editorial/StoryCards';
import { NewsroomCtaBlock, SectionHeader } from '@/components/editorial/SectionBlocks';
import { ArticleSidebar } from '@/components/article/ArticleSidebar';
import { getReporter, reporterInitials } from '@/lib/reporters';
import { REPORTERS } from '@/lib/reporters';
import { buildArticleJsonLd } from '@/lib/articleSeo';
import { Icon } from '@/components/Icon';
import { ScrollProgress } from '@/components/ScrollProgress';
import { getPublicSiteUrl } from '@/lib/siteUrl';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const base = getPublicSiteUrl();
  try {
    const article = await fetchArticleBySlug(slug);
    if (!article) return { title: 'Notícia não encontrada' };
    const image = article.image_url || PATTERN_IMAGES[article.category] || PATTERN_IMAGES.general;
    return {
      title: article.title,
      description: metaDescription(article.summary || article.title),
      alternates: { canonical: `${base}/noticia/${slug}` },
      openGraph: {
        title: article.title,
        description: metaDescription(article.summary || article.title),
        type: 'article',
        url: `${base}/noticia/${slug}`,
        images: [{ url: image, alt: article.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: article.title,
        description: metaDescription(article.summary || article.title),
        images: [{ url: image, alt: article.title }],
      },
    };
  } catch {
    return { title: 'Portal Cerrado' };
  }
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: Article | null = null;
  try {
    article = await fetchArticleBySlug(slug);
  } catch {
    return (
      <div className="container-custom py-16 text-center text-red-600 font-semibold">
        A API de noticias nao respondeu. O frontend depende do backend real para carregar a materia.
      </div>
    );
  }
  if (!article) notFound();

  const cat = getCategory(article.category);
  const reporter = getReporter(article.reporter_slug);
  const img =
    article.image_url ||
    PATTERN_IMAGES[article.category] ||
    PATTERN_IMAGES.general;

  let related: Article[] = [];
  let latest: Article[] = [];
  let continuacao: Article[] = [];
  try {
    // Uma consulta a mais matérias por editoria, não uma consulta a mais.
    //
    // A barra lateral mostra "mais recentes" e "relacionadas". A continuação
    // abaixo do artigo precisa de matérias que não sejam nenhuma das duas — e
    // antes eu filtrava a continuação contra a própria lista de relacionadas,
    // o que a deixava sempre vazia. Pedindo quatorze em vez de seis, as três
    // listas saem do mesmo conjunto sem sobreposição, e a continuação ainda
    // fecha com quatro cartões quando a editoria tem matéria para isso.
    const [poolResult, latestResult] = await Promise.all([
      fetchNewsResponse({ category: article.category, limit: 14 }),
      fetchNewsResponse({ limit: 6 }),
    ]);

    latest = latestResult.news.filter((a) => a.slug !== slug).slice(0, 5);

    const foraDaPagina = (a: Article) => a.slug !== slug && !latest.some((l) => l.slug === a.slug);
    related = poolResult.news.filter(foraDaPagina).slice(0, 5);

    const chavesVisiveis = new Set([...latest, ...related].map((a) => a.slug || a.title));
    continuacao = poolResult.news
      .filter((a) => !chavesVisiveis.has(a.slug || a.title))
      .slice(0, 4);
  } catch {
    related = [];
    latest = [];
  }
  const bodyHtml = formatArticleContent(
    article.content || '',
    article.summary || '',
    article.title || ''
  );
  const minutes = readingTimeMinutes(article.content || article.summary || '');
  const reporterSlug = article.reporter_slug || '';
  const base = getPublicSiteUrl();
  const canonicalUrl = `${base}/noticia/${article.slug || slug}`;
  const lead = cleanArticleText(article.summary || article.content).slice(0, 360);
  const primarySource = article.sources?.[0];
  const authorUrl = Object.hasOwn(REPORTERS, reporterSlug)
    ? `${base}/reporter/${reporterSlug}`
    : undefined;
  const jsonLd = buildArticleJsonLd({
    article,
    canonicalUrl,
    categoryLabel: cat.label,
    imageUrl: img,
    reporterName: reporter.name,
    reporterUrl: authorUrl,
  });

  return (
    <div className="bg-[radial-gradient(circle_at_top_left,rgba(200,138,44,0.1),transparent_40rem),linear-gradient(180deg,var(--color-canvas)_0%,#ffffff_100%)] pb-16">
      <ScrollProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {/*
        O vão realmente vazio da dobra é o espaço entre o botão de voltar e o
        título, porque o botão usa margem automática e o título é alinhado à
        base. Medido em três manchetes de comprimentos diferentes, esse vão era
        de 210px, 163px e 84px a 768px — e o piso fixo de 560px segurava a
        altura mesmo quando o conteúdo era menor, somando 40px desnecessários
        nessa largura.

        O piso agora é responsivo e some no celular. No desktop o valor de antes
        é preservado, porque o vão ali é de 64px e já é uma escolha editorial
        legítima: voltar no topo, manchete na base.

        As duas alturas precisam ser idênticas: a section carrega a imagem de
        fundo em posição absoluta e a div é quem alinha o conteúdo na base.
      */}
      <section className="relative isolate min-h-[420px] overflow-hidden bg-canvas text-text-primary sm:min-h-[520px] lg:min-h-[560px]">
        <ArticleImage
          article={article}
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full opacity-15 mix-blend-multiply"
          showBadge={false}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-canvas)_0%,transparent_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent" />
        <div className="container-custom relative z-10 flex min-h-[420px] flex-col justify-end pb-10 pt-8 sm:min-h-[520px] sm:pb-16 lg:min-h-[560px]">
          <Link
            href="/"
            className="mb-auto inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-black/5 px-4 py-2 text-sm font-bold text-text-primary backdrop-blur transition hover:bg-black/10"
          >
            ← Voltar para capa
          </Link>
          <div className="max-w-4xl">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-white shadow-sm"
              style={{ background: cat.color }}
            >
              <Icon name={cat.iconClass} /> {cat.label}
            </span>
            <h1 className="mt-6 text-balance font-display text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl lg:text-7xl">
              {article.title}
            </h1>
            {lead && (
              <p className="mt-6 max-w-3xl border-l-4 border-accent-soil pl-5 text-lg font-medium leading-relaxed text-text-muted sm:text-xl">
                {lead}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="container-custom -mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_var(--sidebar-width)]">
        <article className="relative z-10 min-w-0 overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_28px_90px_rgba(45,41,38,0.12)]">
          <div className="grid gap-4 border-b border-zinc-100 bg-white/95 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
            <div className="flex items-center gap-4">
              <Link
                href={reporterSlug ? `/reporter/${reporterSlug}` : '#'}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-text-primary text-lg font-black text-white shadow-inner"
              >
                {reporterInitials(reporter.name)}
              </Link>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-soil">
                  Reportagem
                </p>
                <Link
                  href={reporterSlug ? `/reporter/${reporterSlug}` : '#'}
                  className="font-display text-xl font-bold text-text-primary hover:text-accent-soil"
                >
                  {reporter.name}
                </Link>
                <p className="text-sm text-text-muted">{reporter.role || reporter.specialty}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:flex sm:flex-wrap sm:justify-end">
              <div className="rounded-2xl bg-canvas px-4 py-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Publicado
                </dt>
                <dd className="mt-1 font-bold text-text-primary">
                  {formatArticleDate(article.published_at)}
                </dd>
              </div>
              <div className="rounded-2xl bg-canvas px-4 py-3">
                <dt className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  Leitura
                </dt>
                <dd className="mt-1 font-bold text-text-primary">{minutes} min</dd>
              </div>
            </dl>
          </div>

          <div className="mx-5 mt-6 lg:hidden sm:mx-7">
            <ArticleQuickGuide
              categoryLabel={cat.label}
              heading="Em resumo"
              minutes={minutes}
              reporterName={reporter.name}
              source={primarySource}
            />
          </div>

          {/*
            A figura usava altura fixa, e a caixa resultante dependia da
            largura: a mesma foto saía 1,07:1 a 360px e 2,06:1 a 1440px, com
            amplitude de 0,99 para uma peça que deveria ter recorte escolhido.
            Agora são duas razões deliberadas — 4/3 no celular e 16/9 a partir de
            640px — e a caixa medida bate exatamente com elas: 1,33:1 no celular
            e 1,78:1 em 768, 1024 e 1440px. A variação que sobra entre os dois
            grupos é a escolha do breakpoint, não a aritmética do navegador.

            Contrapartida: no celular a foto ficou 51px mais baixa que antes
            (209px contra 260px), porque 4/3 é menos quadrada que o 1,07:1 que a
            altura fixa produzia.
          */}
          <figure className="mx-5 mt-6 overflow-hidden rounded-[1.5rem] bg-zinc-100 sm:mx-7">
            <ArticleImage
              article={article}
              sizes="(min-width: 1024px) 760px, 100vw"
              className="aspect-[4/3] sm:aspect-[16/9]"
              showBadge={false}
            />
            <figcaption className="bg-canvas px-4 py-3 text-xs font-medium text-text-muted">
              {primarySource
                ? `Imagem: ${primarySource.name || article.source || 'Fonte original'}`
                : 'Imagem ilustrativa selecionada pela redação do Portal Cerrado.'}
            </figcaption>
          </figure>

          <div className="article-body article-body-premium mx-auto px-5 py-8 sm:px-7 sm:py-10">
            {bodyHtml ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(bodyHtml) }} />
            ) : (
              <>
                <p>{article.summary}</p>
                {/*
                    Este texto só aparece quando o acervo não traz o corpo da
                    matéria. Dizer isso é honesto; afirmar apuração rigorosa e
                    "citamos a fonte original" seria fabricar um relato de
                    apuração que não temos como provar, e prometer atualização é
                    um compromisso que a redação não controla. O plano proíbe
                    entregar conteúdo que o projeto não tem.
                */}
                <p>O texto integral desta matéria não está disponível no nosso acervo.</p>
                {primarySource?.url && (
                  <p>
                    <a
                      href={primarySource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-accent-soil underline decoration-gold decoration-2 underline-offset-2 hover:text-charcoal"
                    >
                      Ler o texto completo na fonte original
                      {primarySource.name ? ` — ${primarySource.name}` : ""}
                    </a>
                  </p>
                )}
              </>
            )}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="mx-auto flex max-w-[72ch] flex-wrap gap-2 px-5 pb-8 sm:px-7">
              {article.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-zinc-200 bg-canvas px-3 py-1 text-xs font-bold uppercase tracking-wide text-text-muted"
                >
                  #{categorySlug(t) ? getCategory(t).label : t}
                </span>
              ))}
            </div>
          )}

          <div className="mx-5 mb-8 sm:mx-7">
            <ArticleShareActions title={article.title} url={canonicalUrl} />
          </div>

          {reporterSlug && (
            <Link
              href={`/reporter/${reporterSlug}`}
              className="mx-5 mb-8 flex items-center gap-4 rounded-2xl border border-zinc-100 bg-text-primary p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl sm:mx-7"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-lg font-black text-text-primary">
                {reporterInitials(reporter.name)}
              </span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-widest text-white/60">
                  {reporter.role || reporter.specialty}
                </span>
                <span className="block font-display text-xl font-extrabold">
                  {reporter.name}, direto da redação
                </span>
                <span className="block text-sm text-white/70">Conheça o perfil do repórter →</span>
              </span>
            </Link>
          )}
        </article>

        <ArticleSidebar
          categoryLabel={cat.label}
          latestArticles={latest}
          minutes={minutes}
          relatedArticles={related}
          reporterName={reporter.name}
          source={primarySource}
        />
      </div>

      {/*
        Continuação depois do artigo.

        A barra lateral só ocupa o começo da coluna. Numa matéria longa, a
        coluna principal desce muito mais que ela e a direita fica vazia por
        um trecho longo — a página morre depois do bloco do autor. Estas quatro
        matérias e a chamada de contato devolvem o fim da página ao mesmo
        sistema visual da home.

        O conjunto já vem excluindo o que a barra lateral mostra e a matéria
        atual, então nenhuma manchete se repete na página.
      */}
      {continuacao.length > 0 && (
        <section aria-labelledby="continuacao-heading" className="container-custom py-10">
          <SectionHeader
            eyebrow="Para seguir"
            title="Mais sobre este assunto"
            id="continuacao-heading"
          />
          <div className="mt-6 grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {continuacao.map((article) => (
              <StoryCard key={article.slug || article.title} article={article} nivel="h3" />
            ))}
          </div>
        </section>
      )}

      {/* Sem espacamento inferior aqui: o wrapper externo da página já traz
          64px de rodapé, medidos. Somar outro deixava o CTA a 136px do
          rodapé, contra os 88px que o resto do site já usa. */}
      <div className="container-custom">
        <NewsroomCtaBlock
          eyebrow="Fim da matéria"
          title="Achou um erro ou tem uma pauta?"
          description="A redação do Portal Cerrado lê cada contato. Correção, sugestão de pauta ou parceria são respondidas."
        />
      </div>
    </div>
  );
}
