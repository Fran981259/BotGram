"use client";

import { getCategory } from "@/lib/categories";

/**
 * Artefato editorial para matéria sem imagem própria.
 *
 * Problema que este componente resolve. O fallback anterior era uma foto de
 * banco de imagens, uma por editoria: toda matéria daquela editoria sem foto
 * recebia exatamente a mesma imagem. numa editoria com nove matérias sem
 * imagem, a página mostrava a mesma foto nove vezes — o resultado parecia
 * automático. Além disso a foto era genérica e sem relação com a notícia, o
 * que é pior que não ter imagem nenhuma.
 *
 * O que este artefato faz, e o que ele não faz:
 *   - não simula fotografia e não inventa fato: ele declara a editoria;
 *   - é determinístico: a variante vem de um hash do slug ou do título, então o
 *     servidor e o cliente renderizam exatamente o mesmo desenho;
 *   - não muda a cada renderização e não depende de `Math.random`;
 *   - não pede nada à rede, então não entra na CSP;
 *   - usa só a paleta do site: verde Cerrado, carvão e dourado contido.
 *
 * A posição é fixa aqui dentro, em `absolute inset-0`. Receber `relative` de
 * fora, ou receber `absolute` e ter o `relative` daqui vencendo no CSS, faz a
 * caixa ficar com altura zero — foi exatamente o que aconteceu na primeira
 * versão, e é o mesmo defeito que sumia com o herói no desktop.
 *
 * A variação por hash resolve a repetição sem fabricar conteúdo: são quatro
 * arranjos geométricos, e a caixa continua sendo a mesma do componente de
 * imagem, então não há deslocamento de layout quando a foto falta.
 */

/** Hash estável: mesma entrada, mesmo número, em qualquer máquina. */
function hashEstavel(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Chave estável do artigo: slug quando existe, senão o título. */
function chaveDoArtigo(slug?: string, titulo?: string): string {
  return (slug && slug.trim()) || (titulo && titulo.trim()) || "geral";
}

export function ImageFallback({
  category,
  slug,
  title,
  denso = false,
}: {
  category?: string;
  slug?: string;
  title?: string;
  /** Caixa pequena: o rótulo sai porque o card já mostra a editoria ao lado. */
  denso?: boolean;
}) {
  const cat = getCategory(category);
  const semente = hashEstavel(chaveDoArtigo(slug, title));
  const variante = semente % 4;
  // Duas escalas degolden ratio para o deslocamento dos blocos, tiradas da
  // mesma semente: o desenho muda entre matérias, mas continua reprodutível.
  const deslocamento = (semente >> 3) % 5;
  const inclinacao = ((semente >> 6) % 2) * 4 - 2;

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-charcoal"
      role="img"
      aria-label={`Imagem indisponível — ${cat.label}`}
    >
      {/* Base: verde Cerrado escuro, sem brilho e sem desfoque. */}
      <div className="absolute inset-0 bg-accent-soil" aria-hidden="true" />

      {/* Arranjo geométrico. Cada variante tem um desenho distinto, e a largura
          de cada faixa sai da mesma semente — sem classe de largura em
          conflito com o estilo inline. */}
      <div
        className="absolute inset-0 flex flex-col justify-center gap-[7%] px-[8%]"
        aria-hidden="true"
        style={{ transform: `rotate(${inclinacao}deg) scale(1.06)` }}
      >
        {[0, 1, 2].map((linha) => {
          const fator = ((deslocamento + linha * 3 + variante) % 7) + 3;
          return (
            <span
              key={linha}
              className={
                linha === 1
                  ? "h-[6%] bg-gold/70"
                  : linha === 0
                    ? "h-[4%] bg-white/15"
                    : "h-[4%] bg-white/15"
              }
              style={{ width: `${fator * 10}%` }}
            />
          );
        })}
      </div>

      {/* Rodapé editorial. Só sai em caixa normal: medido na versão anterior,
          numa miniatura de 96px o texto era cortado e lia "SEGURANÇ", que é
          pior do que não ter rótulo. */}
      {!denso && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-4 py-3">
          <span className="truncate font-display text-[11px] font-black uppercase tracking-[0.2em] text-white/85">
            {cat.label}
          </span>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white/45">
            sem imagem
          </span>
        </div>
      )}
    </div>
  );
}