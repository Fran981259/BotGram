import { getMarketFeed } from "@/lib/markets";
import { formatMarketTime } from "@/lib/time";

function ChangePct({ direction, pct }: { direction: string | null; pct: number | null }) {
  if (pct === null || !direction) {
    return <span className="text-[11px] text-text-muted">estável</span>;
  }
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "·";
  const color =
    direction === "up" ? "text-market-up" : direction === "down" ? "text-market-down" : "text-text-muted";
  return (
    <span className={`text-[11px] font-bold tabular-nums ${color}`} aria-label={`Variação de ${pct}%`}>
      <span aria-hidden="true">{arrow}</span> {Math.abs(pct).toLocaleString("pt-BR")}%
    </span>
  );
}

/**
 * MarketPanel — cotações em linha, com a linguagem editorial da página.
 *
 * Antes isto era uma caixa branca com borda e sombra, empilhada, ocupando uma
 * coluna ao lado do artigo de Agro. A referência não tem nenhuma peça assim:
 * cotações são informação em faixa, separada por filete.
 *
 * A peça continua com os mesmos dados reais, a mesma fonte declarada e o mesmo
 * link para `/api/markets`. Mudou a forma: uma linha por produto, com rótulo e
 * unidade à esquerda, valor e variação à direita, e um filete entre as linhas.
 *
 * Item sem cotação verificada não entra na lista — a faixa do topo já anuncia
 * "indisponível" por item, e repetir o texto aqui poluiria a tabela.
 */
export async function MarketPanel() {
  const feed = await getMarketFeed();
  const availableItems = feed.items.filter((item) => item.status === "ok");
  const sources = Array.from(new Set(availableItems.map((item) => item.source)));
  const updated = availableItems
    .map((item) => item.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  if (!availableItems.length) return null;

  return (
    <div>
      <div className="rule-heading flex flex-wrap items-baseline justify-between gap-3 pb-2">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-text-primary">
          Mercados e cotações
        </h2>
        <p className="text-[11px] font-semibold text-text-muted">
          Fonte: {sources.join(" · ")}
          {updated ? ` · ${formatMarketTime(updated)}` : ""}
        </p>
      </div>

      <ul className="hairline mt-1 grid grid-cols-2 gap-x-6 md:grid-cols-3 lg:grid-cols-6">
        {availableItems.map((item) => (
          <li key={item.id} className="py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-bold text-text-primary">{item.label}</span>
              <ChangePct direction={item.direction} pct={item.changePct} />
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-2">
              <span className="truncate text-[11px] text-text-muted">{item.sublabel}</span>
              <span className="shrink-0 font-display text-base font-bold tabular-nums text-text-primary">
                {item.value}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-text-muted">
        {feed.degraded && (
          <span className="mr-2 font-semibold text-gold-deep">
            Exibimos somente cotações verificadas disponíveis no momento.
          </span>
        )}
        <a
          href="/api/markets"
          className="py-1 font-semibold text-accent-soil underline decoration-gold decoration-2 underline-offset-2 hover:text-gold-deep"
        >
          dados brutos
        </a>
      </p>
    </div>
  );
}