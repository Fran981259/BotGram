"use client";

import { useMemo, useState } from "react";
import type { TimelinePoint } from "@/lib/adminAnalyticsApi";

type Props = {
  data: TimelinePoint[];
  periodDays: number;
};

export function AnalyticsTimelineChart({ data, periodDays }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { maxViews, maxArticles, points } = useMemo(() => {
    if (!data.length) return { maxViews: 10, maxArticles: 10, points: [] };
    const maxV = Math.max(...data.map((d) => d.views), 5);
    const maxA = Math.max(...data.map((d) => d.articles), 5);
    return { maxViews: maxV, maxArticles: maxA, points: data };
  }, [data]);

  const height = 180;
  const paddingX = 20;
  const paddingY = 24;
  const chartH = height - paddingY * 2;

  // Generate SVG path points
  const { pathViews, pathArticles } = useMemo(() => {
    if (points.length < 2) return { pathViews: "", pathArticles: "" };
    const stepX = (1000 - paddingX * 2) / (points.length - 1);

    const vCoords = points.map((p, idx) => {
      const x = paddingX + idx * stepX;
      const y = height - paddingY - (p.views / maxViews) * chartH;
      return `${x},${y}`;
    });

    const aCoords = points.map((p, idx) => {
      const x = paddingX + idx * stepX;
      const y = height - paddingY - (p.articles / maxArticles) * chartH;
      return `${x},${y}`;
    });

    return {
      pathViews: `M ${vCoords.join(" L ")}`,
      pathArticles: `M ${aCoords.join(" L ")}`,
    };
  }, [points, maxViews, maxArticles, height, chartH, paddingX, paddingY]);

  const hoveredPoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="adm-card" style={{ padding: "20px" }}>
      <div className="adm-flex-between" style={{ marginBottom: "16px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
            📈 Tendência de Audiência & Produção
          </h3>
          <p className="adm-text-sm adm-text-muted" style={{ margin: "2px 0 0" }}>
            Histórico diário dos últimos {periodDays} dias
          </p>
        </div>
        <div className="adm-flex" style={{ gap: "16px", fontSize: "12px" }}>
          <div className="adm-flex" style={{ gap: "6px" }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: "var(--adm-info)" }} />
            <span className="adm-text-muted">Visualizações</span>
          </div>
          <div className="adm-flex" style={{ gap: "6px" }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: "var(--adm-accent)" }} />
            <span className="adm-text-muted">Artigos Publicados</span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
        <svg
          viewBox={`0 0 1000 ${height}`}
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1="0" y1={paddingY} x2="1000" y2={paddingY} stroke="var(--adm-border)" strokeDasharray="3 3" />
          <line x1="0" y1={height / 2} x2="1000" y2={height / 2} stroke="var(--adm-border)" strokeDasharray="3 3" />
          <line x1="0" y1={height - paddingY} x2="1000" y2={height - paddingY} stroke="var(--adm-border)" />

          {/* Area / Path for Articles */}
          {pathArticles && (
            <path
              d={pathArticles}
              fill="none"
              stroke="var(--adm-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Area / Path for Views */}
          {pathViews && (
            <path
              d={pathViews}
              fill="none"
              stroke="var(--adm-info)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}

          {/* Hover interactive bars */}
          {points.map((p, idx) => {
            const stepX = (1000 - paddingX * 2) / Math.max(1, points.length - 1);
            const x = paddingX + idx * stepX;
            return (
              <rect
                key={p.date}
                x={x - stepX / 2}
                y={0}
                width={stepX}
                height={height}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 16,
              background: "var(--adm-surface-2)",
              border: "1px solid var(--adm-border-mid)",
              borderRadius: "var(--adm-radius-sm)",
              padding: "8px 12px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              zIndex: 10,
            }}
          >
            <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--adm-text)" }}>
              📅 {new Date(hoveredPoint.date + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
            <div className="adm-flex" style={{ gap: "12px" }}>
              <span style={{ color: "var(--adm-info)" }}>👁️ {hoveredPoint.views} views</span>
              <span style={{ color: "var(--adm-accent)" }}>📰 {hoveredPoint.articles} artigos</span>
            </div>
          </div>
        )}
      </div>

      {/* Date labels at bottom */}
      <div className="adm-flex-between adm-text-sm adm-text-muted" style={{ marginTop: "8px", fontSize: "11px" }}>
        <span>{points[0] ? new Date(points[0].date + "T00:00:00").toLocaleDateString("pt-BR") : ""}</span>
        <span>
          {points[Math.floor(points.length / 2)]
            ? new Date(points[Math.floor(points.length / 2)].date + "T00:00:00").toLocaleDateString("pt-BR")
            : ""}
        </span>
        <span>
          {points[points.length - 1]
            ? new Date(points[points.length - 1].date + "T00:00:00").toLocaleDateString("pt-BR")
            : ""}
        </span>
      </div>
    </div>
  );
}
