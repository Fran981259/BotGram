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
    return [
      {
        source: "/api/:path((?!markets$).*)",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://portal_cerrado:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
