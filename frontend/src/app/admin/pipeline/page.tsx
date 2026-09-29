"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import {
  ConfirmModal,
  Spinner,
  ToastContainer,
  useToast,
} from "@/components/admin/AdminShared";
import { PipelineFunnel } from "@/components/admin/PipelineFunnel";
import { PipelineLogsCard } from "@/components/admin/PipelineLogsCard";
import { PipelineMetricsCards } from "@/components/admin/PipelineMetricsCards";
import {
  fetchPipelineStatus,
  fetchPipelineTaskResult,
  triggerPipeline,
  type PipelineStatus,
} from "@/lib/adminApi";

export default function AdminPipelinePage() {
  const { apiKey } = useAdminAuth();
  const { toasts, push: showToast } = useToast();

  const [statusData, setStatusData] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Trigger state & polling
  const [showTriggerConfirm, setShowTriggerConfirm] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskState, setTaskState] = useState<string | null>(null);

  const loadStatus = useCallback(
    async (silent = false) => {
      if (!apiKey) return;
      if (!silent) setRefreshing(true);
      try {
        const data = await fetchPipelineStatus(apiKey);
        setStatusData(data);
      } catch (err) {
        if (!silent) showToast(err instanceof Error ? err.message : "Erro ao carregar status", "error");
      } finally {
        setLoading(false);
        if (!silent) setRefreshing(false);
      }
    },
    [apiKey, showToast]
  );

  // Initial load
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Auto-refresh timer (10s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadStatus(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadStatus]);

  // Polling for active Celery task
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!activeTaskId || !apiKey) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetchPipelineTaskResult(apiKey, activeTaskId);
        setTaskState(res.state);
        if (res.state === "SUCCESS") {
          showToast("Varredura manual concluída com sucesso!", "success");
          setActiveTaskId(null);
          loadStatus(true);
        } else if (res.state === "FAILURE") {
          showToast(`Falha na varredura: ${res.error || "Erro desconhecido"}`, "error");
          setActiveTaskId(null);
          loadStatus(true);
        }
      } catch {
        // Polling silent retry
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeTaskId, apiKey, loadStatus, showToast]);

  const handleTrigger = async () => {
    setShowTriggerConfirm(false);
    setTriggering(true);
    try {
      const res = await triggerPipeline(apiKey);
      showToast(res.message || "Pipeline enfileirado!", "success");
      if (res.task_id) {
        setActiveTaskId(res.task_id);
        setTaskState("PENDING");
      }
      loadStatus(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Falha ao disparar pipeline", "error");
    } finally {
      setTriggering(false);
    }
  };

  if (loading && !statusData) {
    return <Spinner label="Carregando status do pipeline…" />;
  }

  const isLocked = Boolean(statusData?.pipeline_lock.running);
  const queue = statusData?.queue ?? {};

  return (
    <div>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Pipeline de Coleta & Workers</h1>
          <p className="adm-page-sub">
            Monitoramento do Celery, agendamento de tarefas e disparo manual de varredura.
          </p>
        </div>
        <div className="adm-flex" style={{ gap: "10px" }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              fontSize: "12px",
              color: "var(--adm-text-muted)",
              background: "var(--adm-surface)",
              border: "1px solid var(--adm-border)",
              borderRadius: "var(--adm-radius-sm)",
              padding: "6px 12px",
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ accentColor: "var(--adm-accent)", cursor: "pointer" }}
            />
            Auto-refresh (10s)
          </label>

          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={() => loadStatus(false)}
            disabled={refreshing}
          >
            {refreshing ? <span className="adm-spinner" style={{ width: 14, height: 14 }} /> : "🔄"} Atualizar
          </button>

          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={() => setShowTriggerConfirm(true)}
            disabled={triggering || isLocked || activeTaskId !== null}
          >
            {triggering ? <span className="adm-spinner" style={{ width: 14, height: 14 }} /> : "⚡"} Disparar Varredura
          </button>
        </div>
      </div>

      {/* Active task banner */}
      {activeTaskId && (
        <div
          style={{
            background: "rgba(59, 130, 246, 0.12)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            borderRadius: "var(--adm-radius-md)",
            padding: "12px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="adm-flex" style={{ gap: "12px" }}>
            <span className="adm-spinner" style={{ width: 18, height: 18 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "13px", color: "var(--adm-info)" }}>
                Varredura manual em andamento... (Estado: {taskState || "PENDING"})
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--adm-text-muted)" }}>
                Task ID: <code>{activeTaskId}</code>
              </p>
            </div>
          </div>
          <span className="adm-badge adm-badge-review">Em Execução</span>
        </div>
      )}

      {/* Health & Infrastructure Banner */}
      <PipelineMetricsCards statusData={statusData} />

      {/* Funnel visualization */}
      <div style={{ marginBottom: "20px" }}>
        <PipelineFunnel queue={queue} />
      </div>

      {/* Recent Pipeline Activity Logs */}
      <PipelineLogsCard logs={statusData?.recent_logs} />

      {/* Trigger Confirm Modal */}
      {showTriggerConfirm && (
        <ConfirmModal
          title="Disparar Varredura Manual"
          message="Essa ação iniciará imediatamente o pipeline completo (coleta RSS, classificação, redação IA e publicação/revisão). Deseja continuar?"
          confirmLabel="Iniciar Varredura"
          onConfirm={handleTrigger}
          onCancel={() => setShowTriggerConfirm(false)}
        />
      )}
    </div>
  );
}
