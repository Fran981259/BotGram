"use client";

import { useState } from "react";
import type { AuthCtx } from "./AdminAuthGuard";

/** Tela de login do painel admin — aceita chave via input ou Enter. */
export function AdminLoginPanel({ signIn, isLoading, error }: Pick<AuthCtx, "signIn" | "isLoading" | "error">) {
  const [key, setKey] = useState("");

  const handleSubmit = () => {
    if (key.trim()) signIn(key.trim());
  };

  return (
    <div className="adm-login-wrap">
      <div className="adm-login-card">
        <div className="adm-login-logo" aria-hidden>PC</div>
        <h1 className="adm-login-title">Painel Admin</h1>
        <p className="adm-login-sub">
          Portal Cerrado — acesso restrito.<br />
          Use a chave editorial para entrar.
        </p>

        <label className="adm-label" htmlFor="adm-api-key">Chave de acesso</label>
        <input
          id="adm-api-key"
          className="adm-input"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="••••••••••••••••••••••••••••••••"
          autoComplete="current-password"
          autoFocus
        />

        {error && (
          <p className="adm-error-msg" role="alert">{error}</p>
        )}

        <button
          className="adm-btn adm-btn-primary"
          style={{ width: "100%", marginTop: 16, justifyContent: "center" }}
          onClick={handleSubmit}
          disabled={isLoading || !key.trim()}
          id="adm-login-btn"
        >
          {isLoading ? (
            <><span className="adm-spinner" /> Verificando…</>
          ) : (
            "Entrar no painel"
          )}
        </button>

        <p style={{ marginTop: 20, fontSize: 11, color: "var(--adm-text-faint)", textAlign: "center" }}>
          A chave fica armazenada apenas nesta sessão de navegador.
        </p>
      </div>
    </div>
  );
}
