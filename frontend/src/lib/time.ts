const CAMPO_GRANDE_TIMEZONE = "America/Campo_Grande";

function parseDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatRelativeTime(iso?: string | null): string {
  const date = parseDate(iso);
  if (!date) return "";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "agora";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} ${days === 1 ? "dia" : "dias"}`;
  return formatCampoGrandeDate(iso, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatCampoGrandeDate(iso?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  const date = parseDate(iso);
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", { timeZone: CAMPO_GRANDE_TIMEZONE, ...opts }).format(date);
  } catch {
    return new Intl.DateTimeFormat("pt-BR", opts).format(date);
  }
}

export function formatMarketTime(iso?: string | null): string {
  return formatCampoGrandeDate(iso, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Só a hora, no fuso de Campo Grande.
 *
 * Existe para o trilho "Últimas notícias" da home, cuja linha é
 * `16:24  Manchete` — hora na coluna estreita, manchete ocupando o resto. Com
 * `formatMarketTime` a data inteira ocupava a coluna e a manchete ficava com
 * 55px de largura.
 *
 * O fuso é o mesmo dos demais formatos de data do site, então a hora que o
 * leitor vê é a de Campo Grosso do Sul, e não a do navegador dele.
 */
export function formatTimeOnly(iso?: string | null): string {
  return formatCampoGrandeDate(iso, { hour: "2-digit", minute: "2-digit" });
}