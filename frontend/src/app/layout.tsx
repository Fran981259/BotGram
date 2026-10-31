import type { Metadata } from "next";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/zilla-slab/latin-400.css";
import "@fontsource/zilla-slab/latin-500.css";
import "@fontsource/zilla-slab/latin-600.css";
import "@fontsource/zilla-slab/latin-700.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/siteMetadata";
import { getPublicSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Portal Cerrado — Notícias de Mato Grosso do Sul",
    template: "%s | Portal Cerrado",
  },
  description: "Portal de notícias de Mato Grosso do Sul. Política, economia, segurança, agronegócio e tecnologia com atualização 24 horas.",
  keywords: ["notícias", "Mato Grosso do Sul", "Campo Grande", "MS", "política", "economia"],
  authors: [{ name: "Portal Cerrado" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Portal Cerrado",
    title: "Portal Cerrado — Notícias de Mato Grosso do Sul",
    description: "Portal de notícias de Mato Grosso do Sul com atualização 24h.",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_SOCIAL_IMAGE] },
  robots: { index: true, follow: true },
  metadataBase: new URL(getPublicSiteUrl()),
};

import { Tracker } from "@/components/Tracker";

const SITE_URL = getPublicSiteUrl();

// ================================================================
// MATOMO ANALYTICS
// Painel:  https://analytics.portalcerrado.com.br
// Site ID: 1  |  Rastreamento SPA: src/components/Tracker.tsx
// Variáveis: NEXT_PUBLIC_MATOMO_URL  NEXT_PUBLIC_MATOMO_SITE_ID
// ================================================================
const MATOMO_URL = (process.env.NEXT_PUBLIC_MATOMO_URL ?? "https://analytics.portalcerrado.com.br/").replace(/\/?$/, "/");
const MATOMO_SITE_ID = process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? "1";
const matomoInit = `var _paq=window._paq=window._paq||[];_paq.push(["trackPageView"]);_paq.push(["enableLinkTracking"]);(function(){var u="${MATOMO_URL}";_paq.push(["setTrackerUrl",u+"matomo.php"]);_paq.push(["setSiteId","${MATOMO_SITE_ID}"]);var d=document,g=d.createElement("script"),s=d.getElementsByTagName("script")[0];g.async=true;g.src=u+"matomo.js";s.parentNode.insertBefore(g,s);})();`;
// ================================================================

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: "Portal Cerrado",
  url: SITE_URL,
  description: "Portal de notícias independente com foco em Mato Grosso do Sul.",
  foundingLocation: { "@type": "Place", name: "Campo Grande, MS, Brasil" },
  areaServed: { "@type": "State", name: "Mato Grosso do Sul" },
  inLanguage: "pt-BR",
  publishingPrinciples: `${SITE_URL}/sobre`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* ── MATOMO ANALYTICS ── */}
        <script dangerouslySetInnerHTML={{ __html: matomoInit }} />
        {/* ── END MATOMO ── */}
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-accent-soil focus:px-4 focus:py-2 focus:text-white">Pular para o conteúdo</a>
        <Tracker />
        <Header />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
