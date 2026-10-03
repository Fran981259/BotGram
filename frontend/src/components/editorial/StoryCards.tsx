import Link from "next/link";
import { ArticleImage } from "@/components/home/ArticleImage";
import { ArticleMeta } from "@/components/editorial/ArticleMeta";
import type { Article } from "@/lib/api";

/**
 * Nível do título do card.
 *
 * Medido na auditoria técnica: a home saltava de h1 para h3, e a página de
 * busca também. O salto de um nível é ruído na hierarquia de títulos — tanto
 * para leitor de tela quanto para buscador.
 *
 * O padrão continua h3, que é o correto quando o card está dentro de uma seção
 * que já tem título próprio. Quem mostra o card como irmão de um h1, como a
 * primeira dobra da home, pede h2 explicitamente.
 */
export type NivelTitulo = "h1" | "h2" | "h3" | "h4";

/**
 * Razão da imagem do herói.
 *
 * Antes esta caixa usava altura de 100% a partir do breakpoint grande, com a
 * razão desligada. Isso dependia de um ancestral com altura definida, e não
 * havia: o item da grade estica, porém o elemento article no meio da cadeia é
 * um bloco comum, sem altura. A altura de 100% resolvia contra um valor
 * indefinido e a caixa colapsava para zero — a imagem sumia e o recorte de
 * texto era cortado pelo overflow do próprio card.
 *
 * Medido antes da correção, com a mesma largura de 632px em 1920, 1440, 1366,
 * 1280 e 1024px: caixa de 632 por 0 pixels, imagem de 0 pixels. No celular a
 * razão simples funcionava, e era por isso que o defeito só aparecia no desktop.
 *
 * Agora a caixa tem razão em toda largura, sem depender de altura de ancestral.
 * A escolha de 4/3 a partir de 1280px é deliberada: o título da manchete fica
 * sobreposto na base da imagem, então uma caixa muito alta empurraria a
 * manchete para fora da primeira dobra. Com 632px de largura, 4/3 dá 474px —
 * cabe numa janela de 768px de altura com a manchete ainda visível.
 */
const HERO_RATIO = "aspect-[4/5] sm:aspect-[16/10] xl:aspect-[4/3]";
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
  nivel = "h1",
}: {
  article: Article;
  priority?: boolean;
  showSummary?: boolean;
  /** `h1` na home, onde esta manchete é o título da página. `h2` em editoria. */
  nivel?: NivelTitulo;
}) {
  const { href, target } = useArticleLink(article);
  const cat = getCategory(article.category);
  const summary = lead(article);
  const Titulo = nivel;

  return (
    <article className="news-card-hover group relative block overflow-hidden rounded-lg bg-charcoal">
      <Link href={href} target={target} className="block">
        <ArticleImage
          article={article}
          priority={priority}
          sizes="(min-width: 1280px) 50vw, (min-width: 640px) 100vw, 100vw"
          className={HERO_RATIO}
          showBadge={false}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/5" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7 lg:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-leaf px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-lg">
            {cat.label}
          </span>
          {/*
            Nível de título: a manchete principal é o h1 da página.
            `HeroStoryCard` é usada só aqui e na variante `hero` da fachada, que
            não tem nenhum consumidor — trocar o rótulo é seguro. As demais
            famílias mantêm h2/h3, que é a hierarquia correta quando o card
            aparece dentro de uma seção que já tem título próprio.
          */}
          <Titulo className="mt-3 text-balance font-display text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {article.title}
          </Titulo>
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
export function FeatureStoryCard({ article, nivel = "h3" }: { article: Article; nivel?: NivelTitulo }) {
  const Titulo = nivel;
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
        <Titulo className="mt-2 text-balance font-display text-xl font-black leading-tight text-text-primary transition-colors group-hover:text-accent-leaf">
          <Link href={href} target={target} className="py-1">
            {article.title}
          </Link>
        </Titulo>
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
export function StoryCard({ article, showSummary = true, nivel = "h3" }: { article: Article; showSummary?: boolean; nivel?: NivelTitulo }) {
  const Titulo = nivel;
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
        <Titulo className="text-balance font-display text-lg font-black leading-snug text-text-primary transition-colors group-hover:text-accent-leaf">
          <Link href={href} target={target} className="py-1">
            {article.title}
          </Link>
        </Titulo>
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
export function CompactStoryCard({ article, showThumbnail = true, nivel = "h3" }: { article: Article; showThumbnail?: boolean; nivel?: NivelTitulo }) {
  const Titulo = nivel;
  const { href, target } = useArticleLink(article);
  const cat = getCategory(article.category);

  return (
    <article className="group flex items-start gap-4 border-b border-black/10 py-3 last:border-b-0 last:pb-0">
      {/*
          A miniatura encolhe a partir de 1280px porque é aí que este card
          aparece: dentro do rail de 3 colunas, que mede 288px. Com a
          miniatura de 128px, só sobravam 119px de texto para uma manchete
          de 16px. A série não é monótona de propósito — a miniatura
          acompanha a largura do rail, não a da janela.
      */}
      {showThumbnail && (
        <Link href={href} target={target} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <ArticleImage
            article={article}
            sizes="128px"
            className="aspect-[16/10] w-28 rounded-sm sm:w-32 xl:w-24 2xl:w-28"
            showBadge={false}
            denso
          />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-accent-leaf">{cat.label}</span>
        <Titulo className="mt-1 text-balance font-display text-base font-black leading-snug text-text-primary transition-colors group-hover:text-accent-leaf">
          <Link href={href} target={target} className="py-1">
            {article.title}
          </Link>
        </Titulo>
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
          <Link href={href} target={target} className="py-1">
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
          <Link href={href} target={target} className="py-1">
            {article.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}