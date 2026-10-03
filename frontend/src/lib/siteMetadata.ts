import { PATTERN_IMAGES } from "@/lib/categories";

/** Shared fallback image used by public route previews. */
export const DEFAULT_SOCIAL_IMAGE = {
  url: PATTERN_IMAGES.general,
  alt: "Portal Cerrado — Notícias de Mato Grosso do Sul",
};

/**
 * Ajusta uma descrição para meta tag dentro da faixa útil.
 *
 * O que foi medido na auditoria técnica da fase 9:
 *   - editoria:  42 caracteres, curta demais
 *   - busca:     48 caracteres, curta demais
 *   - artigo:   177 caracteres, longa demais
 *   - repórter: 176 caracteres, longa demais
 *
 * Google trunca por volta de 155–160 caracteres em desktop e 120 em celular, e
 * o texto que sobra é o que decide o clique. Uma descrição que não cabe é uma
 * descrição que não foi escrita.
 *
 * O corte respeita a palavra: não parte no meio de um termo, e acrescenta
 * reticências para o leitor saber que houve corte.
 *
 * Não inventa informação — só escolhe até onde mostrar o texto que já existe.
 */
export function metaDescription(text: string, maxLength = 155): string {
  const limpo = (text || "").replace(/\s+/g, " ").trim();
  if (limpo.length <= maxLength) return limpo;
  const cortado = limpo.slice(0, maxLength - 1);
  const ultimoEspaco = cortado.lastIndexOf(" ");
  // Só recua até o espaço se o resto da palavra for curto o bastante; senão
  // partiria uma palavra grande como "desmatamento" em "desmata".
  const base = ultimoEspaco > maxLength * 0.6 ? cortado.slice(0, ultimoEspaco) : cortado;
  return `${base.replace(/[\s,;:.!?—-]+$/, "")}…`;
}
