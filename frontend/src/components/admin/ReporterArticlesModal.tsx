"use client";

import Link from "next/link";
import { Spinner, StatusBadge } from "@/components/admin/AdminShared";
import type { AdminReporter } from "@/lib/adminApi";

type Props = {
  reporter: AdminReporter | null;
  loading: boolean;
  onClose: () => void;
};

export function ReporterArticlesModal({ reporter, loading, onClose }: Props) {
  if (!reporter) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="adm-card"
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "24px",
          background: "var(--adm-surface)",
        }}
      >
        <div className="adm-flex-between" style={{ marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
              📰 Matérias de {reporter.display_name}
            </h2>
            <p className="adm-text-sm adm-text-muted" style={{ margin: "2px 0 0" }}>
              Últimos artigos produzidos por esta persona digital.
            </p>
          </div>
          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <Spinner label="Buscando artigos..." />
        ) : reporter.recent_articles && reporter.recent_articles.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {reporter.recent_articles.map((art) => (
              <div
                key={art.id}
                style={{
                  background: "var(--adm-surface-2)",
                  padding: "12px 14px",
                  borderRadius: "var(--adm-radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "var(--adm-text)" }}>
                    {art.title}
                  </p>
                  <span className="adm-text-sm adm-text-muted" style={{ fontSize: "11px" }}>
                    {art.category} · {art.published_at ? new Date(art.published_at).toLocaleDateString("pt-BR") : "Rascunho"}
                  </span>
                </div>
                <div className="adm-flex" style={{ gap: "8px" }}>
                  <StatusBadge status={art.status} />
                  <Link
                    href={`/noticia/${art.slug}`}
                    target="_blank"
                    className="adm-btn adm-btn-ghost adm-btn-sm"
                    style={{ textDecoration: "none", fontSize: "11px", padding: "4px 8px" }}
                  >
                    Ver ↗
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="adm-text-sm adm-text-muted">Nenhum artigo encontrado para este repórter.</p>
        )}
      </div>
    </div>
  );
}
