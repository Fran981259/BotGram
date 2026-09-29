"use client";

import type { CategoryMetric, ReporterMetric, ReferrerMetric } from "@/lib/adminAnalyticsApi";

type Props = {
  categories: CategoryMetric[];
  reporters: ReporterMetric[];
  referrers: ReferrerMetric[];
};

export function AnalyticsDistribution({ categories, reporters, referrers }: Props) {
  return (
    <div className="adm-grid-3" style={{ marginBottom: "20px" }}>
      {/* Categories */}
      <div className="adm-card" style={{ padding: "18px" }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>
          🏷️ Artigos por Categoria
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {categories.slice(0, 6).map((cat) => (
            <div key={cat.category}>
              <div className="adm-flex-between adm-text-sm" style={{ marginBottom: "4px" }}>
                <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{cat.category}</span>
                <span className="adm-text-muted">
                  {cat.count} ({cat.percentage}%)
                </span>
              </div>
              <div
                style={{
                  height: "4px",
                  background: "var(--adm-surface-2)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${cat.percentage}%`,
                    height: "100%",
                    background: "var(--adm-accent)",
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="adm-text-sm adm-text-muted">Nenhuma categoria registrada.</p>
          )}
        </div>
      </div>

      {/* Reporters */}
      <div className="adm-card" style={{ padding: "18px" }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>
          🤖 Produção por Repórter IA
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {reporters.slice(0, 6).map((rep) => (
            <div
              key={rep.slug}
              className="adm-flex-between adm-text-sm"
              style={{
                padding: "6px 8px",
                background: "var(--adm-surface-2)",
                borderRadius: "var(--adm-radius-sm)",
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: "var(--adm-text)" }}>{rep.name}</span>
                <span className="adm-text-faint" style={{ marginLeft: "6px", fontSize: "11px" }}>
                  ({rep.role})
                </span>
              </div>
              <span className="adm-badge adm-badge-published" style={{ fontSize: "11px" }}>
                {rep.articles_published} matérias
              </span>
            </div>
          ))}
          {reporters.length === 0 && (
            <p className="adm-text-sm adm-text-muted">Nenhum repórter encontrado.</p>
          )}
        </div>
      </div>

      {/* Traffic Sources / Referrers */}
      <div className="adm-card" style={{ padding: "18px" }}>
        <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>
          🌐 Origem do Tráfego
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {referrers.map((ref) => (
            <div
              key={ref.referrer}
              className="adm-flex-between adm-text-sm"
              style={{
                padding: "6px 8px",
                background: "var(--adm-surface-2)",
                borderRadius: "var(--adm-radius-sm)",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "var(--adm-text-muted)",
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ref.referrer || "Direto / Desconhecido"}
              </span>
              <span className="adm-badge adm-badge-online" style={{ fontSize: "11px" }}>
                {ref.views} views
              </span>
            </div>
          ))}
          {referrers.length === 0 && (
            <p className="adm-text-sm adm-text-muted">
              Nenhuma origem registrada no período (tráfego direto prevalente).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
