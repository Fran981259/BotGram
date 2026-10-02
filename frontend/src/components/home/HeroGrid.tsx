import Link from "next/link";
import { formatRelativeTime } from "@/lib/time";
import {
  CompactStoryCard,
  HeroStoryCard,
  StoryCard,
} from "@/components/editorial/StoryCards";
import { SectionHeader } from "@/components/editorial/SectionBlocks";
import type { Article } from "@/lib/api";

/**
 * HeroGrid — a primeira dobra da homepage.
 *
 * Antes: quatro cards escritos à mão dentro deste arquivo, com o hero numa altura
 * fixa de 430px. Altura fixa é o que produz a zona morta: quando o texto é curto
 * sobra vazio embaixo da imagem, e quando é longo o título invade o quadro.
 *
 * Agora: o hero deriva a altura de uma razão de aspecto, e as famílias vêm de
 * `components/editorial` (Fase 2), com uma identidade de link por família para
 * leitores de tela.
 *
 * A composição permanece 12 colunas — main 6, side 3, rail 3 — porque já
 * funcionava e mudá-la seria alteração visual sem motivo.
 *
 * Regra do projeto: nenhum nome de utilitário é escrito dentro de comentário.
 * O Tailwind varre o texto bruto do arquivo, então citar uma classe que não
 * está em uso emite CSS morto para ela.
 */

function MainCard({ article }: { article: Article }) {
  return (
    <div className="lg:col-span-6">
      <HeroStoryCard article={article} priority showSummary />
    </div>
  );
}

/** Manchetes de apoio: mesma densidade do original, sem altura fixa. */
function FeatureCard({ article }: { article: Article }) {
  return (
    <div className="border-b border-black/10 pb-5 last:border-b-0 last:pb-0">
      <StoryCard article={article} showSummary={false} />
    </div>
  );
}

/** Item da coluna "Mais recentes": lista densa, com dezoito ritmo. */
function CompactCard({ article }: { article: Article }) {
  return <CompactStoryCard article={article} />;
}

function LatestCard({ article }: { article: Article }) {
  return <StoryCard article={article} />;
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
  const hasRail = rail.length > 0;
  if (!main && !hasSide && !hasRail && latest.length === 0) return null;

  return (
    <section aria-labelledby="destaques-heading" className="container-editorial py-7 sm:py-9">
      <h2 id="destaques-heading" className="sr-only">
        Manchetes em destaque
      </h2>

      <div className="grid gap-x-6 gap-y-7 lg:grid-cols-12">
        {main && <MainCard article={main} />}

        {hasSide && (
          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
            {side.slice(0, 2).map((article) => (
              <FeatureCard key={article.slug || article.title} article={article} />
            ))}
          </div>
        )}

        {hasRail && (
          <div className="flex flex-col gap-4 border-t border-black/10 pt-5 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold-deep">Mais recentes</p>
            {rail.slice(0, 3).map((article) => (
              <CompactCard key={article.slug || article.title} article={article} />
            ))}
          </div>
        )}
      </div>

      {latest.length > 0 && (
        <div className="mt-8 border-t border-black/10 pt-6">
          <div className="mb-5">
            <SectionHeader
              eyebrow="Em atualização"
              title="Mais notícias de Mato Grosso do Sul"
              href="/categoria/general"
              linkLabel="ver todas"
            />
          </div>
          <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
            {latest.slice(0, 4).map((article) => (
              <LatestCard key={article.slug || article.title} article={article} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * MostReadBlock — ranking de mais lidas.
 *
 * Ordena por `engagement_score`, que a API pública já entrega
 * (`app/publisher.py`). Não é leitura inventada: é o mesmo campo que o
 * `rankHomepageArticles` usa para ordenar a home. Quando o campo vem nulo —
 * artigo recém-publicado ainda sem métrica — o artigo simplesmente não entra
 * no ranking, em vez de aparecer com um número fictício.
 */
export function MostReadBlock({ articles }: { articles: Article[] }) {
  const ranked = [...articles]
    .filter((article) => typeof article.engagement_score === "number" && article.engagement_score > 0)
    .sort((a, b) => (b.engagement_score ?? 0) - (a.engagement_score ?? 0))
    .slice(0, 5);

  if (ranked.length < 3) return null;

  return (
    <section aria-labelledby="mais-lidas-heading" className="container-editorial py-7 sm:py-9">
      <SectionHeader eyebrow="Ranking" title="Mais lidas" id="mais-lidas-heading" />
      {/* Duas colunas em vez de uma: com cinco itens e a largura do container
          inteiro, uma coluna só produziria linhas de texto muito longas. */}
      <ol className="mt-5 grid gap-x-10 gap-y-1 sm:grid-cols-2">
        {ranked.map((article, index) => (
          <li key={article.slug || article.title} className="flex items-start gap-4 border-b border-black/10 py-4">
            <span aria-hidden="true" className="font-display text-3xl font-black leading-none text-accent-leaf/35 tabular-nums">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-balance font-display text-base font-bold leading-snug text-text-primary">
                <Link href={article.slug ? `/noticia/${article.slug}` : article.url || "#"} className="transition-colors hover:text-accent-soil">
                  {article.title}
                </Link>
              </h3>
              <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-text-muted">
                {formatRelativeTime(article.published_at)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}