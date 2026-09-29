"use client";

import { StatusBadge } from "@/components/admin/AdminShared";
import type { AdminArticle } from "@/lib/adminApi";

type Props = {
  articles: AdminArticle[];
  selected: Set<string>;
  allSelected: boolean;
  isBusy: boolean;
  page: number;
  pageCount: number;
  onToggleAll: () => void;
  onToggleOne: (slug: string) => void;
  onEdit: (article: AdminArticle) => void;
  onPublish: (article: AdminArticle) => void;
  onArchive: (article: AdminArticle) => void;
  onPageChange: (newPage: number) => void;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Campo_Grande",
    });
  } catch {
    return iso;
  }
}

/** Tabela responsiva de listagem, seleção e ações rápidas sobre artigos. */
export function ArticleTable({
  articles,
  selected,
  allSelected,
  isBusy,
  page,
  pageCount,
  onToggleAll,
  onToggleOne,
  onEdit,
  onPublish,
  onArchive,
  onPageChange,
}: Props) {
  return (
    <>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Selecionar todos"
                  id="adm-select-all"
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th>Título</th>
              <th>Categoria</th>
              <th>Status</th>
              <th>Importância</th>
              <th>Publicado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.slug}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(article.slug)}
                    onChange={() => onToggleOne(article.slug)}
                    aria-label={`Selecionar "${article.title}"`}
                    style={{ cursor: "pointer" }}
                  />
                </td>
                <td style={{ maxWidth: 380 }}>
                  <div style={{ fontWeight: 500, color: "var(--adm-text)", lineHeight: 1.4 }}>
                    {article.title}
                  </div>
                  {article.reporter && (
                    <div className="adm-text-sm adm-text-faint" style={{ marginTop: 2 }}>
                      {article.reporter}
                    </div>
                  )}
                </td>
                <td style={{ color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                  {article.category}
                </td>
                <td><StatusBadge status={article.status} /></td>
                <td style={{ color: "var(--adm-text-muted)", textAlign: "center" }}>
                  {article.importance_score ?? "—"}
                </td>
                <td style={{ color: "var(--adm-text-faint)", fontSize: 12, whiteSpace: "nowrap" }}>
                  {article.published_at ? formatDate(article.published_at) : "—"}
                </td>
                <td>
                  <div className="adm-flex" style={{ gap: 6 }}>
                    <button
                      className="adm-btn-icon"
                      title="Editar"
                      onClick={() => onEdit(article)}
                      aria-label={`Editar "${article.title}"`}
                    >
                      ✏️
                    </button>
                    {article.status === "published" && (
                      <a
                        className="adm-btn-icon"
                        href={`/noticia/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no portal"
                        aria-label="Ver no portal"
                      >
                        🔗
                      </a>
                    )}
                    {article.status !== "published" && article.status !== "archived" && (
                      <button
                        className="adm-btn adm-btn-success"
                        style={{ padding: "4px 10px", fontSize: 11 }}
                        onClick={() => onPublish(article)}
                        disabled={isBusy}
                        aria-label={`Publicar "${article.title}"`}
                        title="Publicar"
                      >
                        Publicar
                      </button>
                    )}
                    {article.status !== "archived" && (
                      <button
                        className="adm-btn-icon"
                        title="Arquivar"
                        onClick={() => onArchive(article)}
                        disabled={isBusy}
                        aria-label={`Arquivar "${article.title}"`}
                        style={{ color: "var(--adm-danger)" }}
                      >
                        🗃️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <nav
          className="adm-flex-between"
          style={{ marginTop: 16 }}
          aria-label="Paginação de artigos"
        >
          <button
            className="adm-btn adm-btn-ghost"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            ← Anterior
          </button>
          <span className="adm-text-muted adm-text-sm">
            Página {page + 1} de {pageCount}
          </span>
          <button
            className="adm-btn adm-btn-ghost"
            disabled={page >= pageCount - 1}
            onClick={() => onPageChange(page + 1)}
          >
            Próxima →
          </button>
        </nav>
      )}
    </>
  );
}
