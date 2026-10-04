import Link from "next/link";
import { getMarketFeed } from "@/lib/markets";
import { formatMarketTime } from "@/lib/time";

function pctClass(direction: string): string {
  if (direction === "up") return "text-market-up";
  if (direction === "down") return "text-market-down";
  return "text-white/70";
}

function DirectionArrow({ direction, pct, label }: { direction: string; pct: number; label: string }) {
  if (direction === "up") {
    return <span aria-label={`${label}, alta de ${pct}%`} title={`${pct}%`} className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums ${pctClass("up")}`}><span aria-hidden="true">▲</span>{pct}%</span>;
  }
  if (direction === "down") {
    return <span aria-label={`${label}, queda de ${pct}%`} title={`${pct}%`} className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums ${pctClass("down")}`}><span aria-hidden="true">▼</span>{pct}%</span>;
  }
  return <span className="text-[11px] font-semibold text-white/65">estável</span>;
}

export async function MarketBar() {
  const feed = await getMarketFeed();
  const availableItems = feed.items.filter((item) => item.status === "ok");

  // A permanent strip of failures harms the masthead more than it informs.
  // The market module returns only when there is at least one verified quote.
  if (!availableItems.length) return null;

  return (
    /*
      A barra pertence ao topo da página e ROLA COM ELA.

      Medido na auditoria: com `sticky top-0` a faixa ficava presa sobre o
      conteúdo durante toda a rolagem, cobrindo a primeira linha de cada seção
      que o leitor alcançava. Cotações são informação de contexto do topo, não
      um instrumento fixo — nada no portal precisa dela enquanto o leitor rola.

      Consequência: nenhuma outro elemento do cabeçalho ganhou `sticky` para
      compensar. O cabeçalho continua `relative`, como estava.
    */
    <div className="bg-green-deep text-white" role="region" aria-label="Commodities e cotações agro">
      <div className="container-editorial flex items-center">
        <div className="hidden items-center gap-2 border-r border-white/15 py-2 pr-5 sm:flex" aria-hidden="true">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Commodities</span>
        </div>

        {/*
          Faixa rolável no eixo horizontal, com `min-w-0` no contêiner flex.

          A medição anterior usava `min-w-[128px]` em CADA item, o que espremiava
          rótulos longos até virarem truncamento sem significado no celular. Agora
          cada item dimensiona pelo próprio conteúdo (`w-max`), com `whitespace-nowrap`
          para o rótulo e o valor nunca quebrarem: o leitor vê o rótulo inteiro e
          desliza para alcançar todas as cotações, em vez de adivinhar uma sigla
          cortada.

          `min-w-0` no pai é o que permite a faixa encolher dentro do flex e
          mantener a rolagem dentro da barra — sem ele, a largura intrínseca dos
          itens empurrava a página e aparecia barra horizontal no documento.
        */}
        <div className="no-scrollbar relative flex min-w-0 flex-1 items-stretch overflow-x-auto overscroll-x-contain snap-x after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-l after:from-green-deep after:to-transparent">
          {availableItems.map((item) => (
            <Link
              key={item.id}
              href={item.sourceHref}
              target="_blank"
              rel="noopener noreferrer"
              title={`${item.label} — ${item.source}. Atualizado: ${formatMarketTime(item.updatedAt) || "não informado"}`}
              className="flex w-max shrink-0 snap-start flex-col justify-center border-l border-white/12 px-4 py-1.5 outline-offset-[-3px] transition-colors hover:bg-white/10"
            >
              <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-white/70">
                {item.label}
                <span className="ml-1 hidden font-medium normal-case tracking-normal text-white/55 lg:inline">{item.sublabel}</span>
              </span>
              {item.status === "ok" ? (
                <span className="mt-0.5 flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[13px] font-bold tabular-nums leading-none">{item.value}</span>
                  {item.changePct !== null && item.direction ? <DirectionArrow direction={item.direction} pct={item.changePct} label={item.label} /> : <span className="text-[11px] text-white/60">sem variação</span>}
                </span>
              ) : (
                <span className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-[11px] font-semibold text-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden="true" />
                  indisponível
                </span>
              )}
            </Link>
          ))}
        </div>
        <div className="hidden shrink-0 items-center pl-4 lg:flex" aria-hidden="true">
          <span className="text-[10px] leading-tight text-white/50">
            Fonte: {Array.from(new Set(availableItems.map((item) => item.source))).join(" · ")}
            {feed.degraded ? <span className="block text-amber-200">· parcialmente indisponível</span> : null}
          </span>
        </div>
      </div>
    </div>
  );
}
