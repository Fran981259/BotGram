"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import {
  ConfirmModal,
  EmptyState,
  Spinner,
  ToastContainer,
  useToast,
} from "@/components/admin/AdminShared";
import { ArticleEditModal } from "@/components/admin/ArticleEditModal";
import { ArticleFilterBar } from "@/components/admin/ArticleFilterBar";
import { ArticleTable } from "@/components/admin/ArticleTable";
import {
  archiveAdminArticle,
  fetchAdminArticles,
  publishAdminArticle,
  type AdminArticle,
  type ArticleFilters,
} from "@/lib/adminApi";

const PAGE_SIZE = 30;

export default function ArtigosPage() {
  const { apiKey } = useAdminAuth();
  const { toasts, push } = useToast();

  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<ArticleFilters>({
    status: "all",
    category: "all",
    q: "",
  });
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingArticle, setEditingArticle] = useState<AdminArticle | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<AdminArticle | null>(null);
  const [confirmPublish, setConfirmPublish] = useState<AdminArticle | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const load = useCallback(
    async (p = 0, f = filters) => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetchAdminArticles(apiKey, {
          offset: p * PAGE_SIZE,
          limit: PAGE_SIZE,
          status: f.status,
          category: f.category,
          q: f.q,
        });
        setArticles(res.articles);
        setTotal(res.total);
        setPage(p);
        setSelected(new Set());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar artigos.");
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, filters]
  );

  useEffect(() => {
    void load(0, filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilter = (key: keyof ArticleFilters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (key === "q") {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => load(0, next), 400);
    } else {
      load(0, next);
    }
  };

  const resetFilters = () => {
    const next = { status: "all", category: "all", q: "" };
    setFilters(next);
    load(0, next);
  };

  const allSelected = articles.length > 0 && selected.size === articles.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(articles.map((a) => a.slug)));
  const toggleOne = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const doPublish = async (article: AdminArticle) => {
    setIsBusy(true);
    try {
      await publishAdminArticle(apiKey, article.slug);
      setArticles((prev) =>
        prev.map((a) => (a.slug === article.slug ? { ...a, status: "published" } : a))
      );
      push(`"${article.title}" publicado com sucesso.`, "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Erro ao publicar.", "error");
    } finally {
      setIsBusy(false);
      setConfirmPublish(null);
    }
  };

  const doArchive = async (article: AdminArticle) => {
    setIsBusy(true);
    try {
      await archiveAdminArticle(apiKey, article.slug);
      setArticles((prev) => prev.filter((a) => a.slug !== article.slug));
      setTotal((t) => t - 1);
      push(`"${article.title}" arquivado.`, "info");
    } catch (err) {
      push(err instanceof Error ? err.message : "Erro ao arquivar.", "error");
    } finally {
      setIsBusy(false);
      setConfirmArchive(null);
    }
  };

  const doBatchArchive = async () => {
    if (selected.size === 0) return;
    setIsBusy(true);
    let ok = 0;
    for (const slug of selected) {
      try {
        await archiveAdminArticle(apiKey, slug);
        ok++;
      } catch {
        /* continua */
      }
    }
    push(`${ok} artigo(s) arquivado(s).`, ok > 0 ? "success" : "error");
    load(page, filters);
    setIsBusy(false);
  };

  const handleSaved = (changes: Partial<AdminArticle>) => {
    if (!editingArticle) return;
    const slug = editingArticle.slug;
    setArticles((prev) =>
      prev.map((a) => (a.slug === slug ? { ...a, ...changes } : a))
    );
    setEditingArticle(null);
    push("Artigo salvo com sucesso.", "success");
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <ToastContainer toasts={toasts} />

      <ArticleFilterBar
        filters={filters}
        total={total}
        selectedCount={selected.size}
        isBusy={isBusy}
        onApplyFilter={applyFilter}
        onResetFilters={resetFilters}
        onBatchArchive={doBatchArchive}
      />

      {isLoading ? (
        <Spinner label="Carregando artigos…" />
      ) : error ? (
        <EmptyState icon="❌" title="Erro ao carregar" sub={error} />
      ) : articles.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Nenhum artigo encontrado"
          sub="Tente ajustar os filtros."
          action={
            <button className="adm-btn adm-btn-ghost" onClick={resetFilters}>
              Limpar filtros
            </button>
          }
        />
      ) : (
        <ArticleTable
          articles={articles}
          selected={selected}
          allSelected={allSelected}
          isBusy={isBusy}
          page={page}
          pageCount={pageCount}
          onToggleAll={toggleAll}
          onToggleOne={toggleOne}
          onEdit={setEditingArticle}
          onPublish={setConfirmPublish}
          onArchive={setConfirmArchive}
          onPageChange={(p) => load(p, filters)}
        />
      )}

      {editingArticle && (
        <ArticleEditModal
          article={editingArticle}
          onClose={() => setEditingArticle(null)}
          onSaved={handleSaved}
        />
      )}

      {confirmPublish && (
        <ConfirmModal
          title="Publicar Artigo"
          message={`Confirmar publicação imediata de "${confirmPublish.title}"?`}
          confirmLabel="Publicar agora"
          onConfirm={() => doPublish(confirmPublish)}
          onCancel={() => setConfirmPublish(null)}
        />
      )}

      {confirmArchive && (
        <ConfirmModal
          title="Arquivar Artigo"
          message={`Tem certeza que deseja arquivar "${confirmArchive.title}"? O artigo sairá da listagem ativa.`}
          confirmLabel="Sim, arquivar"
          danger
          onConfirm={() => doArchive(confirmArchive)}
          onCancel={() => setConfirmArchive(null)}
        />
      )}
    </>
  );
}
