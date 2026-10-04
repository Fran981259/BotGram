import { Suspense } from "react";
import { MarketPanel } from "@/components/markets/MarketPanel";

/**
 * MarketStrip — seção secundária de mercado.
 *
 * ── POR QUE ISTO MUDOU DE LUGAR ─────────────────────────────────────────────
 *
 * O `MarketPanel` vivia dentro do módulo de Agro, numa coluna de 4 ao lado do
 * artigo principal. A auditoria visual mediu o resultado: como o painel tem
 * seis linhas de cotação e é o elemento mais alto do módulo, a coluna do
 * artigo terminava bem antes dele e sobrava uma área morta. O painel também
 * ficava visualmente solto, como uma caixa branca ao lado de conteúdo sparse.
 *
 * Agora o Agro é uma das quatro colunas editoriais — que é como a referência
 * trata o tema — e o painel de mercado vira uma seção secundária, com a mesma
 * linguagem editorial do resto da página: filete em vez de caixa, cotações em
 * linha, não empilhadas.
 *
 * Nenhuma funcionalidade de mercado foi removida: os mesmos itens reais, a
 * mesma fonte e o mesmo link para os dados brutos. A faixa do topo continua
 * mostrando as cotações em destaque, e aqui fica a tabela completa.
 */
export function MarketStrip() {
  return (
    <section aria-label="Mercados e cotações" className="container-editorial py-6">
      <Suspense
        fallback={
          <div role="status" aria-label="Carregando cotações">
            <div className="rule-heading h-6 w-48 animate-pulse bg-black/5" />
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3 lg:grid-cols-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 animate-pulse bg-black/5" />
              ))}
            </div>
          </div>
        }
      >
        <MarketPanel />
      </Suspense>
    </section>
  );
}