"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import {
  EmptyState,
  Spinner,
  StatusBadge,
  ToastContainer,
  useToast,
} from "@/components/admin/AdminShared";
import { LLMProviderCard } from "@/components/admin/LLMProviderCard";
import { SchedulerConfigCard } from "@/components/admin/SchedulerConfigCard";
import {
  fetchFullSystemConfig,
  fetchSourcePortalsList,
  type FullSystemConfig,
  type SourcePortalItem,
} from "@/lib/adminConfigApi";

export default function AdminSettingsPage() {
  const { apiKey } = useAdminAuth();
  const { toasts, push: showToast } = useToast();

  const [config, setConfig] = useState<FullSystemConfig | null>(null);
  const [sources, setSources] = useState<SourcePortalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (!apiKey) return;
      if (!silent) setRefreshing(true);
      try {
        const [cfgRes, srcRes] = await Promise.all([
          fetchFullSystemConfig(apiKey),
          fetchSourcePortalsList(apiKey),
        ]);
        setConfig(cfgRes);
        setSources(srcRes);
      } catch (err) {
        if (!silent) showToast(err instanceof Error ? err.message : "Erro ao carregar configurações", "error");
      } finally {
        setLoading(false);
        if (!silent) setRefreshing(false);
      }
    },
    [apiKey, showToast]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !config) {
    return <Spinner label="Carregando parâmetros e configurações do sistema…" />;
  }

  return (
    <div>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Configurações & Modelos IA</h1>
          <p className="adm-page-sub">
            Parâmetros do pipeline editorial, modelos LLM, cadeia de failover e fontes de coleta.
          </p>
        </div>
        <div className="adm-flex" style={{ gap: "10px" }}>
          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={() => loadData(false)}
            disabled={refreshing}
          >
            {refreshing ? <span className="adm-spinner" style={{ width: 14, height: 14 }} /> : "🔄"} Atualizar
          </button>
        </div>
      </div>

      {/* Section 1: LLM Providers */}
      <div style={{ marginBottom: "24px" }}>
        <div className="adm-flex-between" style={{ marginBottom: "14px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
              🧠 Provedores de Inteligência Artificial & LLM
            </h2>
            <p className="adm-text-sm adm-text-muted" style={{ margin: "2px 0 0" }}>
              Cadeia de failover configurada: <code>{config?.llm.fallback_chain.join(" ➔ ") || "gemini"}</code>
            </p>
          </div>
        </div>

        <div className="adm-grid-3">
          {config?.llm.providers.map((p) => (
            <LLMProviderCard key={p.provider} provider={p} apiKey={apiKey} />
          ))}
        </div>
      </div>

      {/* Section 2: Scheduler Policies */}
      {config?.scheduler && (
        <div style={{ marginBottom: "24px" }}>
          <SchedulerConfigCard scheduler={config.scheduler} />
        </div>
      )}

      {/* Section 3: Source Portals */}
      <div className="adm-card" style={{ padding: "20px", marginBottom: "24px" }}>
        <div className="adm-flex-between" style={{ marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
              🌐 Portais & Fontes Monitoradas ({sources.length})
            </h3>
            <p className="adm-text-sm adm-text-muted" style={{ margin: "2px 0 0" }}>
              Fontes cadastradas no banco de dados para mineração e RSS.
            </p>
          </div>
        </div>

        {sources.length > 0 ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>ID</th>
                  <th>Nome do Portal</th>
                  <th>URL de Origem / RSS</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <code style={{ fontSize: "11px", color: "var(--adm-text-faint)" }}>#{s.id}</code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: "13px" }}>{s.name}</span>
                    </td>
                    <td>
                      <code style={{ fontSize: "12px", color: "var(--adm-text-muted)" }}>{s.url}</code>
                    </td>
                    <td>
                      <span className="adm-badge adm-badge-draft">{s.type}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <StatusBadge status="active" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="📰"
            title="Nenhum portal cadastrado no banco"
            sub="O pipeline utiliza RSS e Google News dinâmicos declarados nas políticas de scan."
          />
        )}
      </div>

      {/* Section 4: System Environment Diagnostic */}
      <div className="adm-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700 }}>
          ⚙️ Diagnóstico de Ambiente & Infraestrutura
        </h3>
        <div className="adm-grid-4">
          <div>
            <span className="adm-text-sm adm-text-muted">Ambiente:</span>
            <p style={{ margin: "2px 0 0", fontWeight: 600, textTransform: "uppercase", fontSize: "13px" }}>
              {config?.environment.env}
            </p>
          </div>
          <div>
            <span className="adm-text-sm adm-text-muted">Nível de Log:</span>
            <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: "13px" }}>
              {config?.environment.log_level}
            </p>
          </div>
          <div>
            <span className="adm-text-sm adm-text-muted">Broker Redis:</span>
            <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: "13px", color: config?.environment.redis_url_set ? "var(--adm-success)" : "var(--adm-danger)" }}>
              {config?.environment.redis_url_set ? "Configurado (REDIS_URL)" : "Não configurado"}
            </p>
          </div>
          <div>
            <span className="adm-text-sm adm-text-muted">Monitoramento Sentry:</span>
            <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: "13px" }}>
              {config?.environment.sentry_enabled ? "Ativo" : "Inativo / Local"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
