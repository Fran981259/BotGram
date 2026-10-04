import type { Article } from "@/lib/api";
import { getReporter } from "@/lib/reporters";
import { formatMarketTime } from "@/lib/time";

/**
 * ArticleMeta — metadados padronizados de uma matéria.
 *
 * Extrai uma família do plano §7. Regra deliberada: este componente mostra
 * apenas metadados que o backend REAL entrega. Não há tempo de leitura no
 * tipo `Article`, então nada de "5 min" inventado — o plano §33 é explícito
 * sobre não fabricar dado de produção.
 *
 * Se `updated_at` for relevante, ele aparece; caso contrário, só a publicação.
 */
export function ArticleMeta({
  article,
  variant = "default",
  showCategory = false,
  /** Some com a linha "atualizado …", que é ruído em peça editorial densa. */
  showUpdated = true,
  className = "",
}: {
  article: Article;
  /** `inline` é para listas densas; `stack` empilha em telas estreitas. */
  variant?: "default" | "inline" | "stack";
  showCategory?: boolean;
  showUpdated?: boolean;
  className?: string;
}) {
  const reporter = getReporter(article.reporter_slug);
  const published = formatMarketTime(article.published_at);
  const updated = showUpdated ? formatMarketTime(article.updated_at) : "";

  // Sem reporter e sem data não há linha de metadados que valha a pena.
  if (!reporter.name && !published) return null;

  const stack = variant === "stack";
  const container = stack
    ? "flex flex-col gap-1"
    : "flex flex-wrap items-center gap-x-3 gap-y-1";

  const size = variant === "inline" ? "text-[11px]" : "text-xs";

  return (
    <div className={`${container} ${size} font-semibold text-text-muted ${className}`}>
      {showCategory && <span className="font-black uppercase tracking-[0.18em] text-accent-leaf">{article.category}</span>}
      {reporter.name && <span className="font-bold text-text-primary">{reporter.name}</span>}
      {reporter.name && published && <Dot />}
      {published && <span>{published}</span>}
      {updated && (
        <>
          <Dot />
          <span>atualizado {updated}</span>
        </>
      )}
    </div>
  );
}

/** Separador entre itens de metadados. Some da leitura para leitores de tela. */
function Dot() {
  return <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />;
}