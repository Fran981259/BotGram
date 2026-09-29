"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { loadApiKey, saveApiKey, clearApiKey, fetchOperationsStatus } from "@/lib/adminApi";

// ─── Context ──────────────────────────────────────────────────────────────────

type AuthCtx = {
  apiKey: string;
  signIn: (key: string) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
  error: string;
};

export type { AuthCtx };

const AdminAuthContext = createContext<AuthCtx | null>(null);

export function useAdminAuth(): AuthCtx {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth deve ser usado dentro de AdminAuthGuard");
  return ctx;
}

// ─── Provider + Guard ─────────────────────────────────────────────────────────

type Props = {
  children: React.ReactNode;
  loginSlot: (ctx: AuthCtx) => React.ReactNode;
};

/**
 * Verifica PUBLISH_API_KEY via /api/operations/status.
 * Persiste a chave na sessionStorage (limpa ao fechar aba).
 * Renderiza `loginSlot` enquanto não autenticado.
 */
export function AdminAuthGuard({ children, loginSlot }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const verify = useCallback(async (key: string, opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setIsLoading(true);
    setError("");
    try {
      await fetchOperationsStatus(key.trim());
      setApiKey(key.trim());
      saveApiKey(key.trim());
      setAuthenticated(true);
    } catch {
      clearApiKey();
      setAuthenticated(false);
      if (!opts.silent) setError("Chave inválida. Verifique e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tenta restaurar sessão do sessionStorage
  useEffect(() => {
    const stored = loadApiKey();
    if (stored) {
      void verify(stored, { silent: true });
    } else {
      setIsLoading(false);
    }
  }, [verify]);

  const signIn = useCallback(async (key: string) => {
    await verify(key);
  }, [verify]);

  const signOut = useCallback(() => {
    clearApiKey();
    setApiKey("");
    setAuthenticated(false);
    setError("");
  }, []);

  const ctx: AuthCtx = { apiKey, signIn, signOut, isLoading, error };

  if (isLoading) {
    return (
      <div className="adm-login-wrap">
        <div className="adm-spinner" aria-label="Verificando acesso…" />
      </div>
    );
  }

  if (!authenticated) {
    return <>{loginSlot(ctx)}</>;
  }

  return (
    <AdminAuthContext.Provider value={ctx}>
      {children}
    </AdminAuthContext.Provider>
  );
}
