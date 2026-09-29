"use client";

import type { AdminReporter } from "@/lib/adminApi";

const STAGE_COLORS: Record<string, string> = {
  newborn: "#10b981",
  developing: "#06b6d4",
  established: "#3b82f6",
  mature: "#8b5cf6",
  signature: "#f59e0b",
  legendary: "#ef4444",
};

type Props = {
  reporter: AdminReporter;
  onToggleActive: (rep: AdminReporter) => void;
  onEdit: (rep: AdminReporter) => void;
  onViewArticles: (rep: AdminReporter) => void;
};

export function ReporterCard({ reporter: rep, onToggleActive, onEdit, onViewArticles }: Props) {
  const name = rep.display_name || rep.name || rep.slug;
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const stage = rep.personality_stage || rep.stage || "newborn";
  const stageColor = STAGE_COLORS[stage] || "var(--adm-accent)";
  const voice = (rep.voice_profile as Record<string, string>) || {};

  return (
    <div
      className="adm-card"
      style={{
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        opacity: rep.active ? 1 : 0.65,
        borderLeft: `4px solid ${stageColor}`,
      }}
    >
      <div>
        {/* Card Header */}
        <div className="adm-flex-between" style={{ marginBottom: "12px" }}>
          <div className="adm-flex" style={{ gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: `${stageColor}22`,
                color: stageColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "13px",
                border: `1px solid ${stageColor}44`,
              }}
            >
              {initials}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--adm-text)" }}>
                {name}
              </h3>
              <span className="adm-text-sm adm-text-muted">{rep.role}</span>
            </div>
          </div>
          <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={rep.active}
              onChange={() => onToggleActive(rep)}
              style={{ accentColor: "var(--adm-success)", cursor: "pointer" }}
            />
          </label>
        </div>

        {/* Stage & Metrics */}
        <div className="adm-flex-wrap" style={{ gap: "6px", marginBottom: "12px" }}>
          <span
            className="adm-badge"
            style={{
              background: `${stageColor}18`,
              color: stageColor,
              border: `1px solid ${stageColor}44`,
              fontSize: "11px",
              textTransform: "capitalize",
            }}
          >
            🌟 {stage}
          </span>
          <span className="adm-badge adm-badge-published" style={{ fontSize: "11px" }}>
            📝 {rep.articles_published ?? 0} matérias
          </span>
          {rep.age_days !== undefined && (
            <span className="adm-badge adm-badge-offline" style={{ fontSize: "11px" }}>
              ⏳ {rep.age_days}d de vida
            </span>
          )}
        </div>

        {/* Specialties */}
        {rep.specialties && rep.specialties.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <div className="adm-flex-wrap" style={{ gap: "4px" }}>
              {rep.specialties.map((sp) => (
                <span
                  key={sp}
                  style={{
                    fontSize: "10px",
                    padding: "2px 8px",
                    background: "var(--adm-surface-2)",
                    borderRadius: "4px",
                    color: "var(--adm-text-muted)",
                  }}
                >
                  {sp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Voice Profile summary */}
        {(voice.tone || voice.style) && (
          <p
            className="adm-text-sm adm-text-muted"
            style={{
              margin: "0 0 12px",
              fontSize: "11px",
              background: "var(--adm-surface-2)",
              padding: "6px 10px",
              borderRadius: "var(--adm-radius-sm)",
            }}
          >
            🗣️ {voice.tone ? `Tom: ${voice.tone}` : ""}
            {voice.tone && voice.style ? " · " : ""}
            {voice.style ? `Estilo: ${voice.style}` : ""}
          </p>
        )}
      </div>

      {/* Card Actions */}
      <div className="adm-flex" style={{ gap: "8px", marginTop: "12px" }}>
        <button
          type="button"
          className="adm-btn adm-btn-ghost adm-btn-sm"
          style={{ flex: 1 }}
          onClick={() => onEdit(rep)}
        >
          ✏️ Persona
        </button>
        <button
          type="button"
          className="adm-btn adm-btn-ghost adm-btn-sm"
          style={{ flex: 1 }}
          onClick={() => onViewArticles(rep)}
        >
          📰 Matérias
        </button>
      </div>
    </div>
  );
}
