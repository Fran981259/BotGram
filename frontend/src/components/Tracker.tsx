"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    _paq?: unknown[][];
  }
}

export function Tracker() {
  const pathname = usePathname();
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (trackedRef.current === pathname) return;
    trackedRef.current = pathname;

    const paq = (window._paq = window._paq || []);
    paq.push(["setCustomUrl", pathname]);
    paq.push(["setDocumentTitle", document.title]);
    paq.push(["trackPageView"]);
  }, [pathname]);

  return null;
}
