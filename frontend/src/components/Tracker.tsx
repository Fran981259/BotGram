"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export function Tracker() {
  const pathname = usePathname();
  const viewIdRef = useRef<number | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    viewIdRef.current = null;
    startRef.current = Date.now();

    const referrer =
      typeof document !== "undefined" ? document.referrer ?? "" : "";

    // Registra pageview e guarda view_id para atualizar tempo depois
    fetch(`${API}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true,
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.view_id) viewIdRef.current = data.view_id;
      })
      .catch(() => {});

    // Envia tempo na página quando o usuário sai ou muda de aba
    function flush() {
      const vid = viewIdRef.current;
      if (!vid) return;
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      if (seconds < 1) return;
      const body = JSON.stringify({ view_id: vid, seconds });
      // sendBeacon é fire-and-forget, seguro em unload
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(`${API}/api/analytics/update_time`, blob);
      } else {
        fetch(`${API}/api/analytics/update_time`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
      viewIdRef.current = null; // evita double-flush
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);

    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname]);

  return null;
}
