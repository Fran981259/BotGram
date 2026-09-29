"use client";

import { useState, useCallback } from "react";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };
let nextId = 1;

type StatCardProps = {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
  color?: string;
};

/** Card de KPI reutilizável no dashboard. */
export function StatCard({ label, value, icon, sub, color = "var(--adm-accent)" }: StatCardProps) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-icon" style={{ background: `${color}18` }}>
        <span aria-hidden style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <p className="adm-stat-label">{label}</p>
      <p className="adm-stat-value">{value}</p>
      {sub && <p className="adm-stat-sub">{sub}</p>}
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  published:  { cls: "adm-badge-published",  label: "Publicado" },
  draft:      { cls: "adm-badge-draft",       label: "Rascunho" },
  review:     { cls: "adm-badge-review",      label: "Revisão" },
  rewritten:  { cls: "adm-badge-rewritten",   label: "Reescrito" },
  classified: { cls: "adm-badge-review",      label: "Classificado" },
  failed:     { cls: "adm-badge-failed",      label: "Falhou" },
  online:     { cls: "adm-badge-online",      label: "Online" },
  offline:    { cls: "adm-badge-offline",     label: "Offline" },
  active:     { cls: "adm-badge-published",   label: "Ativo" },
  paused:     { cls: "adm-badge-warning",     label: "Pausado" },
};

/** Badge de status para artigos, workers e fontes. */
export function StatusBadge({ status }: { status: string }) {
  const mapped = STATUS_MAP[status.toLowerCase()] ?? { cls: "adm-badge-draft", label: status };
  return <span className={`adm-badge ${mapped.cls}`}>{mapped.label}</span>;
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Modal de confirmação para ações destrutivas. */
export function ConfirmModal({
  title, message, confirmLabel = "Confirmar", danger = false, onConfirm, onCancel,
}: ConfirmModalProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
      onClick={onCancel}
    >
      <div
        className="adm-card"
        style={{ maxWidth: 420, width: "100%", borderRadius: "var(--adm-radius-lg)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="adm-confirm-title"
      >
        <h2 id="adm-confirm-title" style={{ fontSize: 18, fontWeight: 700, color: "var(--adm-text)", marginBottom: 8 }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: "var(--adm-text-muted)", lineHeight: 1.6 }}>{message}</p>
        <div className="adm-flex" style={{ marginTop: 24, justifyContent: "flex-end" }}>
          <button className="adm-btn adm-btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            className={`adm-btn ${danger ? "adm-btn-danger" : "adm-btn-primary"}`}
            onClick={onConfirm}
            id="adm-confirm-action-btn"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── useToast ─────────────────────────────────────────────────────────────────

/** Hook para disparar toasts. Renderize <ToastContainer toasts={toasts} /> no layout. */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return { toasts, push };
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div className="adm-toast-wrap" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`adm-toast adm-toast-${t.type}`}>
          <span aria-hidden>
            {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="adm-empty">
      <span className="adm-spinner" aria-label={label} />
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

export function EmptyState({ icon = "📭", title, sub, action }: {
  icon?: string; title: string; sub?: string; action?: React.ReactNode;
}) {
  return (
    <div className="adm-empty">
      <span className="adm-empty-icon" aria-hidden>{icon}</span>
      <p className="adm-empty-title">{title}</p>
      {sub && <p className="adm-empty-sub">{sub}</p>}
      {action}
    </div>
  );
}
