"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import {
  ConfirmModal,
  EmptyState,
  Spinner,
  StatusBadge,
  ToastContainer,
  useToast,
} from "@/components/admin/AdminShared";
import {
  fetchModerationItems,
  resolveModerationItem,
  type ModerationItem,
} from "@/lib/adminAuditApi";

export default function AdminModerationPage() {
  const { apiKey } = useAdminAuth();
  const { toasts, push: showToast } = useToast();

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Resolution modal state
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | "archive" | null>(null);
  const [reason, setReason] = useState("");
  const [resolving, setResolving] = useState(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (!apiKey) return;
      if (!silent) setRefreshing(true);
      try {
        const res = await fetchModerationItems(apiKey);
        setItems(res.items);
      } catch (err) {
        if (!silent) showToast(err instanceof Error ? err.message : "Erro ao carregar moderação", "error");
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

  const handleAction = async () => {
    if (!selectedItem || !pendingAction) return;
    setResolving(true);
    try {
      await resolveModerationItem(apiKey, selectedItem.id, pendingAction, reason.trim() || undefined);
      showToast(
        `Artigo #${selectedItem.id} ${
          pendingAction === "approve"
            ? "aprovado e publicado"
            : pendingAction === "archive"
            ? "arquivado"
            : "rejeitado"
        } com sucesso.`,
        "success"
      );
      setSelectedItem(null);
      setPendingAction(null);
      setReason("");
      loadData(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao moderar artigo", "error");
    } finally {
      setResolving(false);
    }
  };

  if (loading && !items.length) {
    return <Spinner label="Verificando fila de moderação de conteúdo…" />;
  }

  const reviewCount = items.filter((i) => i.status === "review").length;
  const failedCount = items.filter((i) => i.status === "failed").length;

  return (
    <div>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Fila de Moderação & Quarentena</h1>
          <p className="adm-page-sub">
            Artigos aguardando validação editorial humana ou recuperação de falhas de processamento.
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

      {/* Summary Banner */}
      <div className="adm-grid-2" style={{ marginBottom: "20px" }}>
        <div className="adm-card" style={{ padding: "16px" }}>
          <span className="adm-text-sm adm-text-muted">Aguardando Revisão Humana</span>
          <p style={{ fontSize: "24px", fontWeight: 800, margin: "4px 0 0", color: "var(--adm-warning)" }}>
            {reviewCount}
          </p>
        </div>
        <div className="adm-card" style={{ padding: "16px" }}>
          <span className="adm-text-sm adm-text-muted">Itens em Quarentena / Falhas</span>
          <p style={{ fontSize: "24px", fontWeight: 800, margin: "4px 0 0", color: "var(--adm-danger)" }}>
            {failedCount}
          </p>
        </div>
      </div>

      {/* Items Table */}
      <div className="adm-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700 }}>
          📋 Itens Pendentes de Decisão ({items.length})
        </h3>

        {items.length > 0 ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>ID</th>
                  <th>Status</th>
                  <th>Título do Artigo</th>
                  <th>Categoria</th>
                  <th>Scores (Imp/Eng)</th>
                  <th>Data</th>
                  <th style={{ textAlign: "right" }}>Ações de Moderação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <code style={{ fontSize: "12px", color: "var(--adm-accent)" }}>#{item.id}</code>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "13px" }}>{item.title}</p>
                    </td>
                    <td>
                      <span className="adm-badge adm-badge-review">{item.category || "Geral"}</span>
                    </td>
                    <td className="adm-text-sm">
                      ⭐ {item.importance_score ?? 0} / 🔥 {item.engagement_score ?? 0}
                    </td>
                    <td className="adm-text-sm adm-text-muted">
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="adm-flex" style={{ justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          type="button"
                          className="adm-btn adm-btn-primary adm-btn-sm"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => {
                            setSelectedItem(item);
                            setPendingAction("approve");
                          }}
                        >
                          ✅ Aprovar
                        </button>
                        <button
                          type="button"
                          className="adm-btn adm-btn-ghost adm-btn-sm"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => {
                            setSelectedItem(item);
                            setPendingAction("archive");
                          }}
                        >
                          📦 Arquivar
                        </button>
                        <button
                          type="button"
                          className="adm-btn adm-btn-danger adm-btn-sm"
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                          onClick={() => {
                            setSelectedItem(item);
                            setPendingAction("reject");
                          }}
                        >
                          ❌ Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="🛡️"
            title="Nenhum item pendente de moderação"
            sub="Todos os artigos estão em conformidade e processados sem pendências."
          />
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedItem && pendingAction && (
        <ConfirmModal
          title={`Confirmar Ação: ${
            pendingAction === "approve"
              ? "Aprovar Artigo"
              : pendingAction === "archive"
              ? "Arquivar Artigo"
              : "Rejeitar Artigo"
          }`}
          message={`Você está prestes a definir a ação '${pendingAction}' no artigo #${selectedItem.id} ("${selectedItem.title}"). Deseja prosseguir?`}
          confirmLabel={resolving ? "Processando..." : "Confirmar Decisão"}
          danger={pendingAction === "reject"}
          onConfirm={handleAction}
          onCancel={() => {
            setSelectedItem(null);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}
