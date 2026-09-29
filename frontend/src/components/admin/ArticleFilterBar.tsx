"use client";

import type { ArticleFilters } from "@/lib/adminApi";
import { CATEGORY_LIST } from "@/lib/categories";

const STATUS_OPTIONS = [
  { value: "all",        label: "Todos os status" },
  { value: "published",  label: "Publicados" },
  { value: "review",     label: "Em revisão" },
  { value: "rewritten",  label: "Reescritos" },
  { value: "classified", label: "Classificados" },
  { value: "draft",      label: "Rascunhos" },
  { value: "failed",     label: "Falhos" },
  { value: "archived",   label: "Arquivados" },
];

type Props = {
  filters: ArticleFilters;
  total: number;
  selectedCount: number;
  isBusy: boolean;
  onApplyFilter: (key: keyof ArticleFilters, value: string) => void;
  onResetFilters: () => void;
  onBatchArchive: () => void;
};

/** Barra superior de filtros, busca e ações em lote para a tabela de artigos. */
export function ArticleFilterBar({
  filters,
  total,
  selectedCount,
  isBusy,
  onApplyFilter,
  onResetFilters,
  onBatchArchive,
}: Props) {
  return (
    <div className="adm-card adm-flex-wrap" style={{ marginBottom: 20, gap: 12 }}>
      <input
        className="adm-input"
        style={{ maxWidth: 260 }}
        placeholder="Buscar por título…"
        value={filters.q ?? ""}
        onChange={(e) => onApplyFilter("q", e.target.value)}
        aria-label="Buscar artigo"
        id="adm-search-articles"
      />
      <select
        className="adm-select"
        style={{ maxWidth: 200 }}
        value={filters.status ?? "all"}
        onChange={(e) => onApplyFilter("status", e.target.value)}
        aria-label="Filtrar por status"
        id="adm-filter-status"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        className="adm-select"
        style={{ maxWidth: 200 }}
        value={filters.category ?? "all"}
        onChange={(e) => onApplyFilter("category", e.target.value)}
        aria-label="Filtrar por categoria"
        id="adm-filter-category"
      >
        <option value="all">Todas as categorias</option>
        {CATEGORY_LIST.map((c) => (
          <option key={c.slug} value={c.slug}>{c.label}</option>
        ))}
      </select>
      <button className="adm-btn adm-btn-ghost" onClick={onResetFilters}>
        Limpar
      </button>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="adm-text-muted adm-text-sm">
          {total} artigo{total !== 1 ? "s" : ""}
        </span>
        {selectedCount > 0 && (
          <button
            className="adm-btn adm-btn-danger"
            onClick={onBatchArchive}
            disabled={isBusy}
            id="adm-batch-archive-btn"
          >
            Arquivar {selectedCount} selecionados
          </button>
        )}
      </div>
    </div>
  );
}
