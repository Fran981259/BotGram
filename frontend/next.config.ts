import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O executor CLI do TypeScript perde stdout neste ambiente Node 22, fazendo
  // o Next falhar ao interpretar `tsc --showConfig`. O compilador via API é o
  // caminho padrão e estável para TypeScript 5.x.
  experimental: {
    useTypeScriptCli: false,
  },
  images: {
    // Allowlist only the image CDNs used by editorial fallbacks and known portals.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**.picsum.photos" },
      { protocol: "https", hostname: "**.midiamax.com.br" },
      { protocol: "https", hostname: "**.campograndenews.com.br" },
      { protocol: "https", hostname: "**.correiodoestado.com.br" },
      { protocol: "https", hostname: "**.capitalnews.com.br" },
      { protocol: "https", hostname: "**.oestadoonline.com.br" },
      { protocol: "https", hostname: "**.websiteseguro.com" },
      { protocol: "https", hostname: "**.interago.com.br" },
      { protocol: "https", hostname: "**.glbimg.com" },
      { protocol: "https", hostname: "**.globo.com" },
      { protocol: "https", hostname: "**.ms.gov.br" },
      { protocol: "https", hostname: "**.primeirapagina.com.br" },
      { protocol: "https", hostname: "**.msnoticias.com.br" },
      { protocol: "https", hostname: "**.acritica.net" },
      { protocol: "https", hostname: "**.jd1noticias.com" },
      { protocol: "https", hostname: "**.diariodigital.com.br" },
      { protocol: "https", hostname: "**.douradosnews.com.br" },
      { protocol: "https", hostname: "**.douranews.com.br" },
      { protocol: "https", hostname: "**.progresso.com.br" },
      { protocol: "https", hostname: "**.douradosagora.com.br" },
      { protocol: "https", hostname: "**.agorams.com.br" },
      { protocol: "https", hostname: "**.perfilnews.com.br" },
      { protocol: "https", hostname: "**.correiodetreslagoas.com.br" },
      { protocol: "https", hostname: "**.jpnews.com.br" },
      { protocol: "https", hostname: "**.rcn67.com.br" },
      { protocol: "https", hostname: "**.hojemais.com.br" },
      { protocol: "https", hostname: "**.diariodetreslagoas.com.br" },
      { protocol: "https", hostname: "**.correiodecorumba.com.br" },
      { protocol: "https", hostname: "**.diarionline.com.br" },
      { protocol: "https", hostname: "**.capitaldopantanal.com.br" },
      { protocol: "https", hostname: "**.reporterms.com.br" },
      { protocol: "https", hostname: "**.pontaporainforma.com.br" },
      { protocol: "https", hostname: "**.conesulnews.com.br" },
      { protocol: "https", hostname: "**.opantaneiro.com.br" },
      { protocol: "https", hostname: "**.jovemsulnews.com.br" },
      { protocol: "https", hostname: "**.coximagora.com.br" },
      { protocol: "https", hostname: "**.edicaoms.com.br" },
      { protocol: "https", hostname: "**.mstododia.com.br" },
      { protocol: "https", hostname: "**.costaricaemfoco.com.br" },
      { protocol: "https", hostname: "**.jornaldanova.com.br" },
      { protocol: "https", hostname: "**.naviraidiario.com.br" },
      { protocol: "https", hostname: "**.bonitobrazil.com.br" },
      { protocol: "https", hostname: "**.regiaomsnoticias.com.br" },
      { protocol: "https", hostname: "**.maracajunahora.com.br" },
      { protocol: "https", hostname: "**.msnews.com.br" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.wp.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://portal_cerrado:8000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
