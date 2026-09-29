"use client";

import { StatusBadge } from "@/components/admin/AdminShared";
import type { PipelineStatus } from "@/lib/adminApi";

type Props = {
  logs?: PipelineStatus["recent_logs"];
};

/** Tabela com histórico de atividades recentes do pipeline Celery. */
export function PipelineLogsCard({ logs }: Props) {
  return (
    <div className="adm-card" style={{ padding: "20px" }}>
      <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 16px" }}>
        Atividades Recentes do Pipeline
      </h3>
      {logs && logs.length > 0 ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Ação</th>
                <th>Artigo ID</th>
                <th>Detalhes</th>
                <th>Horário (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx}>
                  <td>
                    <StatusBadge status={log.action} />
                  </td>
                  <td>
                    {log.article_id ? (
                      <code style={{ fontSize: "12px", color: "var(--adm-accent)" }}>
                        #{log.article_id}
                      </code>
                    ) : (
                      <span className="adm-text-faint">—</span>
                    )}
                  </td>
                  <td className="adm-text-sm" style={{ maxWidth: "300px", wordBreak: "break-word" }}>
                    {log.details || "—"}
                  </td>
                  <td className="adm-text-sm adm-text-muted">
                    {new Date(log.at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="adm-text-sm adm-text-muted" style={{ margin: 0 }}>
          Nenhum registro recente de execução do pipeline.
        </p>
      )}
    </div>
  );
}
