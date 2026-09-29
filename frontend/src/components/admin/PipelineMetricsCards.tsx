"use client";

import { StatusBadge } from "@/components/admin/AdminShared";
import type { PipelineStatus } from "@/lib/adminApi";

type Props = {
  statusData: PipelineStatus | null;
};

/** Cards com métricas de workers Celery, Redis lock e cadência diária. */
export function PipelineMetricsCards({ statusData }: Props) {
  const workers = statusData?.worker_status.workers ?? [];
  const redisOnline = statusData?.pipeline_lock.redis === "online";
  const isLocked = Boolean(statusData?.pipeline_lock.running);
  const metrics = statusData?.metrics ?? { published_today: 0, target_today: 10 };
  const schedule = statusData?.schedule ?? { interval_minutes: 30, min_articles_per_day: 10 };
  const targetPct = Math.min(
    100,
    Math.round((metrics.published_today / Math.max(1, metrics.target_today)) * 100)
  );

  return (
    <div className="adm-grid-3" style={{ marginBottom: "20px" }}>
      {/* Celery Workers */}
      <div className="adm-card" style={{ padding: "16px" }}>
        <div className="adm-flex-between" style={{ marginBottom: "10px" }}>
          <span style={{ fontWeight: 600, fontSize: "13px" }}>Workers Celery</span>
          <span
            className={`adm-badge ${
              workers.some((w) => w.status === "online")
                ? "adm-badge-online"
                : "adm-badge-offline"
            }`}
          >
            {statusData?.worker_status.online ?? 0} /{" "}
            {statusData?.worker_status.total ?? 0} online
          </span>
        </div>
        {workers.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {workers.map((w) => (
              <div key={w.name} className="adm-flex-between adm-text-sm">
                <span
                  style={{
                    color: "var(--adm-text-muted)",
                    fontFamily: "monospace",
                    fontSize: "11px",
                  }}
                >
                  {w.name}
                </span>
                <StatusBadge status={w.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="adm-text-sm adm-text-muted" style={{ margin: 0 }}>
            {statusData?.worker_status.error || "Nenhum worker detectado via broker."}
          </p>
        )}
      </div>

      {/* Redis & Pipeline Lock */}
      <div className="adm-card" style={{ padding: "16px" }}>
        <div className="adm-flex-between" style={{ marginBottom: "10px" }}>
          <span style={{ fontWeight: 600, fontSize: "13px" }}>Broker Redis & Trava</span>
          <StatusBadge status={redisOnline ? "online" : "offline"} />
        </div>
        <div className="adm-flex-between adm-text-sm" style={{ marginBottom: "6px" }}>
          <span className="adm-text-muted">Status do Lock:</span>
          <span
            style={{
              fontWeight: 600,
              color: isLocked ? "var(--adm-warning)" : "var(--adm-success)",
            }}
          >
            {isLocked ? "🔒 Executando (bloqueado)" : "🟢 Livre (ocioso)"}
          </span>
        </div>
        {isLocked && statusData?.pipeline_lock.lock_ttl_seconds && (
          <p className="adm-text-sm adm-text-muted" style={{ margin: 0 }}>
            TTL restante do lock: {statusData.pipeline_lock.lock_ttl_seconds}s
          </p>
        )}
      </div>

      {/* Daily Target & Cadence */}
      <div className="adm-card" style={{ padding: "16px" }}>
        <div className="adm-flex-between" style={{ marginBottom: "8px" }}>
          <span style={{ fontWeight: 600, fontSize: "13px" }}>Meta Diária & Cadência</span>
          <span className="adm-text-sm adm-font-bold" style={{ color: "var(--adm-accent)" }}>
            {metrics.published_today} / {metrics.target_today} ({targetPct}%)
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: "6px",
            background: "var(--adm-surface-2)",
            borderRadius: "3px",
            overflow: "hidden",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: `${targetPct}%`,
              height: "100%",
              background: targetPct >= 100 ? "var(--adm-success)" : "var(--adm-accent)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <p className="adm-text-sm adm-text-muted" style={{ margin: 0 }}>
          Varredura a cada <strong>{schedule.interval_minutes} minutos</strong> via Celery Beat.
        </p>
      </div>
    </div>
  );
}
