"use client";

import type { SchedulerConfig } from "@/lib/adminConfigApi";

type Props = {
  scheduler: SchedulerConfig;
};

export function SchedulerConfigCard({ scheduler: s }: Props) {
  return (
    <div className="adm-grid-2" style={{ marginBottom: "20px" }}>
      {/* Volume Parameters */}
      <div className="adm-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700 }}>
          ⏰ Volume & Cadência Editorial
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="adm-flex-between adm-text-sm">
            <span className="adm-text-muted">Intervalo de Atualização:</span>
            <span style={{ fontWeight: 600, color: "var(--adm-accent)" }}>
              A cada {s.update_interval_minutes} minutos
            </span>
          </div>
          <div className="adm-flex-between adm-text-sm">
            <span className="adm-text-muted">Meta Mínima Diária:</span>
            <span style={{ fontWeight: 600 }}>{s.min_articles_per_day} artigos</span>
          </div>
          <div className="adm-flex-between adm-text-sm">
            <span className="adm-text-muted">Meta Ideal Diária:</span>
            <span style={{ fontWeight: 600 }}>{s.ideal_articles_per_day} artigos</span>
          </div>
          <div className="adm-flex-between adm-text-sm">
            <span className="adm-text-muted">Teto Máximo Diário:</span>
            <span style={{ fontWeight: 600 }}>{s.max_articles_per_day} artigos</span>
          </div>
          <div className="adm-flex-between adm-text-sm">
            <span className="adm-text-muted">Artigos por Ciclo:</span>
            <span style={{ fontWeight: 600 }}>{s.articles_per_cycle} matérias</span>
          </div>
          <div className="adm-flex-between adm-text-sm">
            <span className="adm-text-muted">Curiosidades Automáticas:</span>
            <span style={{ fontWeight: 600, color: s.curiosities_enabled ? "var(--adm-success)" : "var(--adm-text-muted)" }}>
              {s.curiosities_enabled ? "Ativadas" : "Desativadas"}
            </span>
          </div>
        </div>
      </div>

      {/* Anti-Spam & Similarity Policies */}
      <div className="adm-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700 }}>
          🛡️ Políticas Anti-Spam & Deduplicação
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="adm-flex-between adm-text-sm">
            <span className="adm-text-muted">Máx por Fonte / Hora:</span>
            <span style={{ fontWeight: 600 }}>{s.anti_spam?.max_per_source_per_hour ?? 3} artigos</span>
          </div>
          <div className="adm-flex-between adm-text-sm">
            <span className="adm-text-muted">Máx por Tema / 24h:</span>
            <span style={{ fontWeight: 600 }}>{s.anti_spam?.max_per_topic_per_day ?? 5} artigos</span>
          </div>
          <div className="adm-flex-between adm-text-sm">
            <span className="adm-text-muted">Limiar de Similaridade (Duplicata):</span>
            <span style={{ fontWeight: 600, color: "var(--adm-warning)" }}>
              {Math.round((s.anti_spam?.similarity_threshold ?? 0.85) * 100)}%
            </span>
          </div>
          <div
            style={{
              marginTop: "8px",
              padding: "10px 12px",
              background: "var(--adm-surface-2)",
              borderRadius: "var(--adm-radius-sm)",
              fontSize: "12px",
              color: "var(--adm-text-muted)",
            }}
          >
            💡 Valores declarativos carregados de <code>config/scheduler.yaml</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
