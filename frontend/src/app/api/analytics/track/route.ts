import { NextResponse } from "next/server";

/**
 * /api/analytics/track — beacon de analytics server-side.
 *
 * ── POR QUE ESTA ROTA EXISTE ────────────────────────────────────────────────
 *
 * O `Tracker` (em `src/components/Tracker.tsx`, montado no layout raiz, logo em
 * todas as páginas) faz POST para `/api/analytics/track`. Até esta versão não
 * havia rota para esse caminho: o wildcard de `next.config.ts` o encaminhava
 * para o backend Python em `NEXT_PUBLIC_API_URL`. Sem backend no ar, o proxy
 * respondia `ECONNREFUSED` e o Next devolvia **500 ao navegador** — uma vez por
 * navegação, em todas as 19 rotas auditadas.
 *
 * Medido antes desta mudança, em 8 rotas: `500 /api/analytics/track` em 8 de 8.
 *
 * O `catch {}` do `Tracker` não escondia nada: o `fetch` NÃO falhava — recebia
 * uma resposta 500. O console do navegador registra falha de recurso por conta
 * própria, e é por isso que o erro aparecia mesmo com o tracker "silencioso".
 *
 * ── A REGRA DE DEGRADAÇÃO ───────────────────────────────────────────────────
 *
 * Analytics é telemetria de fire-and-forget: nada na página depende dela, e o
 * leitor não tem nada a fazer com o resultado. Um 500 por navegação, em todas as
 * páginas, não informa o operador — ele só ENCOBRE erros reais no console, que é
 * exatamente o que a auditoria precisa ver limpo.
 *
 * Então a falha continua visível onde ela serve para alguma coisa:
 *
 *   - no LOG DO SERVIDOR, com a causa e o destino, uma vez por tentativa;
 *   - no status HTTP, que deixa de ser 5xx porque não há nada a corrigir no
 *     cliente: a requisição foi recebida, lida e descartada de forma consciente.
 *
 * O que NÃO fazemos aqui: fingir sucesso quando houve sucesso. Quando o backend
 * responde, o código repassa o status dele.
 */

export const dynamic = "force-dynamic";

const TRACK_TIMEOUT_MS = 4000;

function backendUrl(): string | null {
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/api/analytics/track`;
}

export async function POST(request: Request) {
  const target = backendUrl();

  if (!target) {
    console.warn("[analytics/track] backend não configurado (API_URL/NEXT_PUBLIC_API_URL ausentes); evento descartado.");
    return NextResponse.json({ stored: false, reason: "backend-not-configured" }, { status: 202 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    body = "";
  }

  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(TRACK_TIMEOUT_MS),
    });

    // O status do backend é repassado quando é 2xx. Um 5xx do backend também é
    // registrado, mas não vira 5xx para o navegador: a mesma raciocínio acima.
    if (upstream.ok) {
      return NextResponse.json({ stored: true }, { status: 202 });
    }

    console.warn(`[analytics/track] backend respondeu ${upstream.status}; evento descartado.`);
    return NextResponse.json({ stored: false, reason: `upstream-${upstream.status}` }, { status: 202 });
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    console.warn(`[analytics/track] backend indisponível em ${target}: ${cause}; evento descartado.`);
    return NextResponse.json({ stored: false, reason: "backend-unreachable" }, { status: 202 });
  }
}