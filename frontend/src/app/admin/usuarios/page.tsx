"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import {
  Spinner,
  StatCard,
  StatusBadge,
  ToastContainer,
  useToast,
} from "@/components/admin/AdminShared";
import { fetchSecurityInfo, type SecurityInfo } from "@/lib/adminAuditApi";

export default function AdminUsersSecurityPage() {
  const { apiKey } = useAdminAuth();
  const { toasts, push: showToast } = useToast();

  const [security, setSecurity] = useState<SecurityInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!apiKey) return;
    try {
      const data = await fetchSecurityInfo(apiKey);
      setSecurity(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao carregar dados de segurança", "error");
    } finally {
      setLoading(false);
    }
  }, [apiKey, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !security) {
    return <Spinner label="Verificando políticas de acesso e segurança…" />;
  }

  const maskedKey = apiKey ? `${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}` : "Não definida";

  return (
    <div>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Usuários, Acessos & Segurança</h1>
          <p className="adm-page-sub">
            Gestão de credenciais de publicação, operadores de sistema e políticas de isolamento.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="adm-grid-3" style={{ marginBottom: "20px" }}>
        <StatCard
          label="Operador Autenticado"
          value={security?.active_operator || "Admin Master"}
          icon="👤"
          sub={`Ambiente: ${security?.environment || "development"}`}
          color="var(--adm-accent)"
        />
        <StatCard
          label="Método de Autenticação"
          value={security?.auth_method || "X-API-Key"}
          icon="🔑"
          sub={security?.api_key_configured ? "Chave mestra ativa no .env" : "Pendente de chave"}
          color="var(--adm-success)"
        />
        <StatCard
          label="Força da Chave (Prod)"
          value="Min 32 Caracteres"
          icon="🛡️"
          sub="Impedimento em produção se fraca"
          color="var(--adm-info)"
        />
      </div>

      {/* Active Session & Credentials */}
      <div className="adm-grid-2" style={{ marginBottom: "20px" }}>
        {/* Credentials Card */}
        <div className="adm-card" style={{ padding: "20px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700 }}>
            🔐 Chave de API Ativa (Sessão Atual)
          </h3>
          <p className="adm-text-sm adm-text-muted" style={{ margin: "0 0 14px" }}>
            Esta chave concede privilégios para publicação, edição, revisão editorial e moderação.
          </p>
          <div
            style={{
              background: "var(--adm-surface-2)",
              border: "1px solid var(--adm-border)",
              borderRadius: "var(--adm-radius-sm)",
              padding: "10px 14px",
              fontFamily: "monospace",
              fontSize: "13px",
              color: "var(--adm-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <span>{maskedKey}</span>
            <StatusBadge status="active" />
          </div>
          <p className="adm-text-sm adm-text-muted" style={{ margin: 0 }}>
            Para rotacionar a chave em produção, consulte o procedimento formal em{" "}
            <code>documento/OPERACAO.md</code>.
          </p>
        </div>

        {/* Security Policies */}
        <div className="adm-card" style={{ padding: "20px" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700 }}>
            🛡️ Políticas de Proteção Ativas
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {security?.policies &&
              Object.entries(security.policies).map(([key, desc]) => (
                <div
                  key={key}
                  style={{
                    background: "var(--adm-surface-2)",
                    padding: "10px 12px",
                    borderRadius: "var(--adm-radius-sm)",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: "12px", textTransform: "capitalize", display: "block" }}>
                    {key.replace("_", " ")}
                  </span>
                  <span className="adm-text-sm adm-text-muted">{desc}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Network & CORS */}
      <div className="adm-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700 }}>
          🌐 Origens Permitidas (CORS) & Proxies Confiáveis
        </h3>
        <div className="adm-grid-2">
          <div>
            <span className="adm-text-sm adm-text-muted" style={{ display: "block", marginBottom: "6px" }}>
              CORS Allowlist (Origins autorizadas)
            </span>
            <div className="adm-flex-wrap" style={{ gap: "6px" }}>
              {security?.cors_origins.map((origin) => (
                <code
                  key={origin}
                  style={{
                    background: "var(--adm-surface-2)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  {origin}
                </code>
              ))}
            </div>
          </div>

          <div>
            <span className="adm-text-sm adm-text-muted" style={{ display: "block", marginBottom: "6px" }}>
              Proxies Confiáveis (X-Forwarded-For)
            </span>
            <div className="adm-flex-wrap" style={{ gap: "6px" }}>
              {security?.trusted_proxies.map((proxy) => (
                <code
                  key={proxy}
                  style={{
                    background: "var(--adm-surface-2)",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  {proxy}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
