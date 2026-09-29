"use client";

import { useCallback, useState } from "react";
import { CATEGORY_LIST } from "@/lib/categories";
import type { AdminArticle } from "@/lib/adminApi";
import { patchAdminArticle, getAdminArticle } from "@/lib/adminApi";
import { ConfirmModal } from "./AdminShared";
import { useAdminAuth } from "./AdminAuthGuard";

type EditableFields = {
  title: string;
  summary: string;
  content: string;
  category: string;
  image_url: string;
  importance_score: number | "";
  engagement_score: number | "";
};

type Props = {
  article: AdminArticle;
  onClose: () => void;
  onSaved: (updated: Partial<AdminArticle>) => void;
};

/** Modal de edição inline de artigo. Carrega o conteúdo completo ao abrir. */
export function ArticleEditModal({ article, onClose, onSaved }: Props) {
  const { apiKey } = useAdminAuth();
  const [fields, setFields] = useState<EditableFields>({
    title: article.title,
    summary: article.summary ?? "",
    content: "",
    category: article.category,
    image_url: article.image_url ?? "",
    importance_score: article.importance_score ?? "",
    engagement_score: article.engagement_score ?? "",
  });
  const [contentLoaded, setContentLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Carrega conteúdo completo na primeira vez que o modal abre
  const loadContent = useCallback(async () => {
    if (contentLoaded) return;
    setIsLoading(true);
    try {
      const full = await getAdminArticle(apiKey, article.slug);
      setFields((f) => ({ ...f, content: full.content ?? "" }));
      setContentLoaded(true);
    } catch {
      setError("Não foi possível carregar o conteúdo.");
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, article.slug, contentLoaded]);

  // Lazy load ao focar na aba de conteúdo
  const handleTabContent = () => loadContent();

  const set = (key: keyof EditableFields, value: string | number) => {
    setFields((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setError("");
  };

  const handleSave = async () => {
    if (!fields.title.trim()) return setError("Título não pode estar vazio.");
    setIsSaving(true);
    setError("");
    try {
      const changes: Parameters<typeof patchAdminArticle>[2] = {};
      if (fields.title !== article.title) changes.title = fields.title;
      if (fields.summary !== (article.summary ?? "")) changes.summary = fields.summary;
      if (contentLoaded && fields.content) changes.content = fields.content;
      if (fields.category !== article.category) changes.category = fields.category;
      if (fields.image_url !== (article.image_url ?? "")) changes.image_url = fields.image_url || undefined;
      if (fields.importance_score !== "" && fields.importance_score !== article.importance_score)
        changes.importance_score = Number(fields.importance_score);
      if (fields.engagement_score !== "" && fields.engagement_score !== article.engagement_score)
        changes.engagement_score = Number(fields.engagement_score);

      if (Object.keys(changes).length === 0) return onClose();
      await patchAdminArticle(apiKey, article.slug, changes);
      onSaved(changes);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (dirty) { setConfirmClose(true); return; }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(3px)",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          padding: "40px 16px", overflowY: "auto",
        }}
        onClick={handleClose}
      >
        <div
          className="adm-card"
          style={{
            width: "100%", maxWidth: 760,
            borderRadius: "var(--adm-radius-lg)",
            display: "flex", flexDirection: "column", gap: 20,
          }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal
          aria-labelledby="adm-edit-title"
        >
          {/* Header */}
          <div className="adm-flex-between">
            <h2 id="adm-edit-title" style={{ fontSize: 16, fontWeight: 700, color: "var(--adm-text)" }}>
              Editar artigo
            </h2>
            <button className="adm-btn-icon" onClick={handleClose} aria-label="Fechar editor">✕</button>
          </div>

          {/* Campos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Título */}
            <div>
              <label className="adm-label" htmlFor="edit-title">Título</label>
              <input
                id="edit-title"
                className="adm-input"
                value={fields.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>

            {/* Resumo */}
            <div>
              <label className="adm-label" htmlFor="edit-summary">Resumo</label>
              <textarea
                id="edit-summary"
                className="adm-textarea"
                value={fields.summary}
                onChange={(e) => set("summary", e.target.value)}
                rows={2}
              />
            </div>

            {/* Categoria + Scores */}
            <div className="adm-grid-3">
              <div>
                <label className="adm-label" htmlFor="edit-category">Categoria</label>
                <select
                  id="edit-category"
                  className="adm-select"
                  value={fields.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {CATEGORY_LIST.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="adm-label" htmlFor="edit-importance">Importância (0–100)</label>
                <input
                  id="edit-importance"
                  className="adm-input"
                  type="number" min={0} max={100}
                  value={fields.importance_score}
                  onChange={(e) => set("importance_score", e.target.value ? Number(e.target.value) : "")}
                />
              </div>
              <div>
                <label className="adm-label" htmlFor="edit-engagement">Engajamento (0–100)</label>
                <input
                  id="edit-engagement"
                  className="adm-input"
                  type="number" min={0} max={100}
                  value={fields.engagement_score}
                  onChange={(e) => set("engagement_score", e.target.value ? Number(e.target.value) : "")}
                />
              </div>
            </div>

            {/* Imagem */}
            <div>
              <label className="adm-label" htmlFor="edit-image">URL da imagem</label>
              <input
                id="edit-image"
                className="adm-input"
                type="url"
                value={fields.image_url}
                onChange={(e) => set("image_url", e.target.value)}
                placeholder="https://..."
              />
              {fields.image_url && (
                <div style={{ marginTop: 8, borderRadius: 6, overflow: "hidden", height: 80 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fields.image_url}
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>

            {/* Conteúdo */}
            <div>
              <div className="adm-flex-between" style={{ marginBottom: 4 }}>
                <label className="adm-label" htmlFor="edit-content">Conteúdo (HTML)</label>
                {!contentLoaded && (
                  <button
                    className="adm-btn adm-btn-ghost"
                    style={{ padding: "3px 10px", fontSize: 11 }}
                    onClick={handleTabContent}
                    disabled={isLoading}
                    type="button"
                  >
                    {isLoading ? "Carregando…" : "Carregar conteúdo"}
                  </button>
                )}
              </div>
              <textarea
                id="edit-content"
                className="adm-textarea"
                value={fields.content}
                onChange={(e) => set("content", e.target.value)}
                rows={10}
                placeholder={contentLoaded ? "" : "Clique em 'Carregar conteúdo' para editar"}
                disabled={!contentLoaded}
              />
            </div>
          </div>

          {/* Erro */}
          {error && <p className="adm-error-msg" role="alert">{error}</p>}

          {/* Ações */}
          <div className="adm-flex" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button className="adm-btn adm-btn-ghost" onClick={handleClose}>Cancelar</button>
            <button
              className="adm-btn adm-btn-primary"
              onClick={handleSave}
              disabled={isSaving}
              id="adm-save-article-btn"
            >
              {isSaving ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmar fechar com alterações não salvas */}
      {confirmClose && (
        <ConfirmModal
          title="Alterações não salvas"
          message="Você tem alterações não salvas. Deseja sair sem salvar?"
          confirmLabel="Sair sem salvar"
          danger
          onConfirm={onClose}
          onCancel={() => setConfirmClose(false)}
        />
      )}
    </>
  );
}
