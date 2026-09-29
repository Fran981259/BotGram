"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import {
  EmptyState,
  Spinner,
  StatCard,
  StatusBadge,
  ToastContainer,
  useToast,
} from "@/components/admin/AdminShared";
import { SocialPostModal } from "@/components/admin/SocialPostModal";
import {
  fetchSocialHistory,
  fetchSocialStatus,
  triggerTopNewsTweet,
  type SocialHistoryItem,
  type TwitterStatus,
} from "@/lib/adminSocialApi";

export default function AdminSocialMediaPage() {
  const { apiKey } = useAdminAuth();
  const { toasts, push: showToast } = useToast();

  const [status, setStatus] = useState<TwitterStatus | null>(null);
  const [history, setHistory] = useState<SocialHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [triggeringTopNews, setTriggeringTopNews] = useState(false);

  // Modal
  const [showPostModal, setShowPostModal] = useState(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (!apiKey) return;
      if (!silent) setRefreshing(true);
      try {
        const [statusRes, historyRes] = await Promise.all([
          fetchSocialStatus(apiKey),
          fetchSocialHistory(apiKey),
        ]);
        setStatus(statusRes.twitter);
        setHistory(historyRes);
      } catch (err) {
        if (!silent) showToast(err instanceof Error ? err.message : "Erro ao carregar status social", "error");
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

  const handleTriggerTopNews = async () => {
    setTriggeringTopNews(true);
    try {
      const res = await triggerTopNewsTweet(apiKey);
      showToast(res.message || "Task de publicação enfileirada no Celery!", "success");
      loadData(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao disparar publicação", "error");
    } finally {
      setTriggeringTopNews(false);
    }
  };

  if (loading && !status) {
    return <Spinner label="Verificando integrações com redes sociais…" />;
  }

  const isConfigured = Boolean(status?.configured);

  return (
    <div>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Redes Sociais & Distribuição</h1>
          <p className="adm-page-sub">
            Automação de postagens no Twitter / X, cards visuais e histórico de publicações.
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

          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={handleTriggerTopNews}
            disabled={triggeringTopNews}
          >
            {triggeringTopNews ? <span className="adm-spinner" style={{ width: 14, height: 14 }} /> : "⚡"} Disparar Top News
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={() => setShowPostModal(true)}
          >
            ✍️ Novo Tweet Manual
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="adm-grid-3" style={{ marginBottom: "20px" }}>
        {/* Twitter / X Integration */}
        <div className="adm-card" style={{ padding: "18px" }}>
          <div className="adm-flex-between" style={{ marginBottom: "10px" }}>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>Integração Twitter / X</span>
            <StatusBadge status={isConfigured ? "online" : "offline"} />
          </div>
          <p className="adm-text-sm adm-text-muted" style={{ margin: "0 0 10px" }}>
            {isConfigured
              ? "Credenciais da API do Twitter (v2/v1.1) configuradas e ativas."
              : "Credenciais ausentes no .env. Configure TWITTER_API_KEY e ACCESS_TOKEN."}
          </p>
          <div className="adm-flex-wrap" style={{ gap: "6px" }}>
            <span className={`adm-badge ${status?.api_key_set ? "adm-badge-published" : "adm-badge-draft"}`}>
              API Key: {status?.api_key_set ? "OK" : "Ausente"}
            </span>
            <span className={`adm-badge ${status?.access_token_set ? "adm-badge-published" : "adm-badge-draft"}`}>
              Token: {status?.access_token_set ? "OK" : "Ausente"}
            </span>
          </div>
        </div>

        {/* Schedule & Automation */}
        <div className="adm-card" style={{ padding: "18px" }}>
          <span style={{ fontWeight: 700, fontSize: "14px", display: "block", marginBottom: "8px" }}>
            ⏰ Automação Celery Beat
          </span>
          <p className="adm-text-sm" style={{ margin: "0 0 8px", color: "var(--adm-accent)", fontWeight: 600 }}>
            {status?.schedule || "3x ao dia (08h, 14h, 20h UTC)"}
          </p>
          <p className="adm-text-sm adm-text-muted" style={{ margin: 0 }}>
            Seleciona automaticamente a matéria com maior relevância das últimas 12 horas.
          </p>
        </div>

        {/* Total Posts */}
        <StatCard
          label="Total de Publicações nas Redes"
          value={status?.total_posts ?? 0}
          icon="📡"
          sub={
            status?.last_post_at
              ? `Último post: ${new Date(status.last_post_at).toLocaleDateString("pt-BR")}`
              : "Nenhum post registrado ainda"
          }
          color="var(--adm-info)"
        />
      </div>

      {/* History Table */}
      <div className="adm-card" style={{ padding: "20px" }}>
        <div className="adm-flex-between" style={{ marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
              📋 Histórico de Publicações em Redes Sociais
            </h3>
            <p className="adm-text-sm adm-text-muted" style={{ margin: "2px 0 0" }}>
              Registro de disparos automáticos e manuais via API do Twitter.
            </p>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Notícia Relacionada</th>
                  <th>Categoria</th>
                  <th>Detalhes</th>
                  <th>Data/Hora (UTC)</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <StatusBadge status={item.action.replace("social_", "")} />
                    </td>
                    <td>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "13px" }}>
                        {item.article_title || (item.article_id ? `Artigo #${item.article_id}` : "—")}
                      </p>
                    </td>
                    <td>
                      {item.category ? (
                        <span className="adm-badge adm-badge-review">{item.category}</span>
                      ) : (
                        <span className="adm-text-faint">—</span>
                      )}
                    </td>
                    <td className="adm-text-sm adm-text-muted" style={{ maxWidth: "260px" }}>
                      {item.details || "—"}
                    </td>
                    <td className="adm-text-sm adm-text-muted">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {item.article_slug && (
                        <Link
                          href={`/noticia/${item.article_slug}`}
                          target="_blank"
                          className="adm-btn adm-btn-ghost adm-btn-sm"
                          style={{ textDecoration: "none", fontSize: "11px", padding: "4px 8px" }}
                        >
                          Ver Matéria ↗
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="🐦"
            title="Nenhum post registrado ainda"
            sub="Dispare um tweet manual ou aguarde o agendamento automático da Top News."
          />
        )}
      </div>

      {/* Manual Tweet Modal */}
      {showPostModal && (
        <SocialPostModal
          apiKey={apiKey}
          onClose={() => setShowPostModal(false)}
          onSuccess={(msg) => {
            showToast(msg, "success");
            loadData(true);
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}
    </div>
  );
}
