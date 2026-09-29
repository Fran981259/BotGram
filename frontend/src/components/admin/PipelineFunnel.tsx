"use client";

import Link from "next/link";

type PipelineFunnelProps = {
  queue: {
    draft?: number;
    classified?: number;
    rewritten?: number;
    review?: number;
    published?: number;
    failed?: number;
    archived?: number;
  };
};

type StageItem = {
  key: string;
  label: string;
  count: number;
  desc: string;
  icon: string;
  color: string;
  filterStatus: string;
};

export function PipelineFunnel({ queue }: PipelineFunnelProps) {
  const stages: StageItem[] = [
    {
      key: "draft",
      label: "1. Coleta (Draft)",
      count: queue.draft ?? 0,
      desc: "Artigos brutos coletados por RSS / Google News",
      icon: "📥",
      color: "var(--adm-text-muted)",
      filterStatus: "draft",
    },
    {
      key: "classified",
      label: "2. Classificação",
      count: queue.classified ?? 0,
      desc: "Avaliados por relevância e categorizados",
      icon: "🏷️",
      color: "var(--adm-info)",
      filterStatus: "classified",
    },
    {
      key: "rewritten",
      label: "3. Redação IA",
      count: queue.rewritten ?? 0,
      desc: "Reescritos e adaptados pelos repórteres",
      icon: "✍️",
      color: "var(--adm-accent)",
      filterStatus: "rewritten",
    },
    {
      key: "review",
      label: "4. Mesa Editorial",
      count: queue.review ?? 0,
      desc: "Aguardando aprovação / revisão humana",
      icon: "⚖️",
      color: "var(--adm-warning)",
      filterStatus: "review",
    },
    {
      key: "published",
      label: "5. Publicados",
      count: queue.published ?? 0,
      desc: "No ar no portal público",
      icon: "🚀",
      color: "var(--adm-success)",
      filterStatus: "published",
    },
  ];

  return (
    <div className="adm-card" style={{ padding: "20px" }}>
      <div className="adm-flex-between" style={{ marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>Funil de Coleta e Publicação</h3>
          <p className="adm-text-sm adm-text-muted" style={{ margin: "4px 0 0" }}>
            Distribuição de artigos pelos estágios do pipeline
          </p>
        </div>
        <div className="adm-flex" style={{ gap: "12px" }}>
          {(queue.failed ?? 0) > 0 && (
            <Link
              href="/admin/artigos?status=failed"
              className="adm-badge adm-badge-failed"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              ⚠️ {queue.failed} com falha
            </Link>
          )}
          {(queue.archived ?? 0) > 0 && (
            <span className="adm-badge adm-badge-offline" style={{ opacity: 0.8 }}>
              📦 {queue.archived} arquivados
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
        }}
      >
        {stages.map((st) => (
          <Link
            key={st.key}
            href={`/admin/artigos?status=${st.filterStatus}`}
            style={{
              display: "block",
              textDecoration: "none",
              background: "var(--adm-surface-2)",
              border: "1px solid var(--adm-border)",
              borderRadius: "var(--adm-radius-md)",
              padding: "14px 16px",
              transition: "transform 0.15s ease, border-color 0.15s ease",
            }}
          >
            <div className="adm-flex-between" style={{ marginBottom: "8px" }}>
              <span style={{ fontSize: "18px" }}>{st.icon}</span>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: st.color,
                }}
              >
                {st.count}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--adm-text)" }}>
              {st.label}
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "11px",
                color: "var(--adm-text-muted)",
                lineHeight: "1.3",
              }}
            >
              {st.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
