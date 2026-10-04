import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O executor CLI do TypeScript perde stdout neste ambiente Node 22, fazendo
  // o Next falhar ao interpretar `tsc --showConfig`. O compilador via API é o
  // caminho padrão e estável para TypeScript 5.x.
  experimental: {
    useTypeScriptCli: false,
  },
  async rewrites() {
    // Rotas API servidas pelo próprio Next.js NÃO podem cair no proxy para o
    // backend Python. Sem a exclusão abaixo, o wildcard captura também
    // /api/markets e o App Router nunca chega a atender a rota — o resultado
    // em produção é um 404 que não existe no código-fonte.
    //
    // O Caddy já entrega /api/markets ao frontend; este rewrite é a segunda
    // camada e precisa respeitar a mesma divisão de responsabilidade.
    //
    // `analytics` entrou na lista pelo mesmo motivo e pelo mesmo sintoma: o
    // Tracker fazia POST para /api/analytics/track em TODA navegação, o wildcard
    // encaminhava para o backend, e sem backend no ar o proxy devolvia 500 ao
    // navegador — uma vez por página, nas 19 rotas. Agora existe
    // `app/api/analytics/track/route.ts`, e ele precisa ser alcançado.
    //
    // A exclusão usa DOIS lookaheads independentes em vez de `(markets|analytics)`
    // porque o Next 16 recusa grupo capturante em `source` ("Capturing groups are
    // not allowed"). E não pode ser ancorada em `$` como a versão anterior
    // (`markets$`): `/api/analytics/track` tem `/track` depois do primeiro
    // segmento, então `analytics$` não casaria e o caminho voltaria a ser
    // encaminhado ao proxy — exatamente o 500 que estamos removendo.
    //
    // O lookahead de prefixo é deliberadamente mais largo que o necessário:
    // não existe rota `/api/analytics*`, e na dúvida é mais seguro falhar para o
    // App Router do que para um proxy cujo backend pode não estar no ar.
    return [
      {
        source: "/api/:path((?!markets)(?!analytics).*)",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://portal_cerrado:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
