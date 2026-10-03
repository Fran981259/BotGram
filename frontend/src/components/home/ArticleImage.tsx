"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getCategory } from "@/lib/categories";
import { ImageFallback } from "@/components/editorial/ImageFallback";
import type { Article } from "@/lib/api";

/**
 * Devolve a URL da foto, ou null quando não há foto utilizável.
 *
 * Antes devolvia a foto genérica da editoria, uma por editoria. Isso fazia
 * toda matéria sem imagem receber exatamente a mesma figura e a página
 * parecer automática. Quem devolve null agora é o artefato editorial, que varia
 * por artigo e declara a editoria em vez de fingir ser uma fotografia.
 */
function safeImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function ArticleImage({
  article,
  sizes,
  priority = false,
  className = "aspect-[16/9]",
  showBadge = true,
  denso = false,
}: {
  article: Article;
  sizes?: string;
  priority?: boolean;
  className?: string;
  showBadge?: boolean;
  /** Miniatura pequena: o artefato fica sem rótulo para não cortar o texto. */
  denso?: boolean;
}) {
  const initialSrc = safeImageUrl(article.image_url);
  const [src, setSrc] = useState(initialSrc);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setSrc(safeImageUrl(article.image_url));
    setErrored(false);
  }, [article.image_url, article.category]);

  const cat = getCategory(article.category);
  const semFoto = src === null || errored;

  // Sem foto utilizável, o artefato editorial ocupa exatamente a mesma caixa.
  // A classe com a razão vem junto, então não há deslocamento de layout.
  if (semFoto) {
    return (
      <div className={`relative shrink-0 overflow-hidden ${className}`}>
        {/* Sem classe de posição: o artefato já ocupa a caixa inteira. Sem selo
            de editoria, porque o próprio artefato declara a editoria — os dois
            juntos apareciam empilhados no herói. */}
        <ImageFallback
          category={article.category}
          slug={article.slug}
          title={article.title}
          denso={denso}
        />
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 overflow-hidden bg-black/5 ${className}`}>
      <Image
        src={src}
        alt={article.title}
        fill
        priority={priority}
        sizes={sizes ?? "(max-width: 640px) 100vw, 50vw"}
        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        onError={() => setErrored(true)}
        // External editorial images stay in the browser; Next must not proxy arbitrary hosts.
        unoptimized={src.startsWith("http://") || src.startsWith("https://")}
      />
      {showBadge && (
        <span className="absolute left-3 top-3 z-10 rounded bg-accent-soil px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
          {cat.label}
        </span>
      )}
    </div>
  );
}
