"use client";

import { useEffect, useState } from "react";
import { fetchAdminArticles, type AdminArticle } from "@/lib/adminApi";
import { sendManualTweet } from "@/lib/adminSocialApi";

type Props = {
  apiKey: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
};

export function SocialPostModal({ apiKey, onClose, onSuccess, onError }: Props) {
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [customText, setCustomText] = useState<string>("");
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchAdminArticles(apiKey, { limit: 20, status: "published" });
        setArticles(res.articles);
        if (res.articles.length > 0) {
          setSelectedSlug(res.articles[0].slug);
        }
      } catch {
        onError("Não foi possível carregar a lista de artigos recentes.");
      } finally {
        setLoadingArticles(false);
      }
    }
    load();
  }, [apiKey, onError]);

  const selectedArticle = articles.find((a) => a.slug === selectedSlug);

  // Generate preview text
  const defaultTweetText = selectedArticle
    ? `🚨 ${(selectedArticle.category || "GERAL").toUpperCase()}: ${selectedArticle.title}\n\nLeia mais: https://portalcerrado.com.br/noticia/${selectedArticle.slug}`
    : "";

  const effectiveText = customText.trim() ? customText : defaultTweetText;
  const charCount = effectiveText.length;
  const isOverLimit = charCount > 280;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlug) {
      onError("Selecione um artigo para postar.");
      return;
    }
    if (isOverLimit) {
      onError("O texto do tweet ultrapassa o limite de 280 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await sendManualTweet(apiKey, {
        slug: selectedSlug,
        custom_text: customText.trim() || undefined,
      });
      onSuccess("Tweet publicado com sucesso no Twitter/X!");
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao postar no Twitter");
    } finally {
      setSubmitting(false);
    }
  };

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
          maxWidth: "600px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          background: "var(--adm-surface)",
        }}
      >
        <div className="adm-flex-between" style={{ marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>
              🐦 Publicar no Twitter / X
            </h2>
            <p className="adm-text-sm adm-text-muted" style={{ margin: "2px 0 0" }}>
              Disparo manual de tweet com card renderizado automaticamente.
            </p>
          </div>
          <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Article Select */}
          <div style={{ marginBottom: "14px" }}>
            <label className="adm-label">Selecionar Artigo Publicado *</label>
            {loadingArticles ? (
              <p className="adm-text-sm adm-text-muted">Carregando artigos...</p>
            ) : (
              <select
                className="adm-input"
                value={selectedSlug}
                onChange={(e) => {
                  setSelectedSlug(e.target.value);
                  setCustomText("");
                }}
                required
              >
                {articles.map((art) => (
                  <option key={art.slug} value={art.slug}>
                    [{art.category || "Geral"}] {art.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Custom Text Option */}
          <div style={{ marginBottom: "16px" }}>
            <div className="adm-flex-between" style={{ marginBottom: "4px" }}>
              <label className="adm-label" style={{ margin: 0 }}>Texto Customizado (opcional)</label>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: isOverLimit ? "var(--adm-danger)" : "var(--adm-text-muted)",
                }}
              >
                {charCount} / 280
              </span>
            </div>
            <textarea
              className="adm-input"
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Deixe em branco para usar o modelo padrão com alerta de categoria e link."
            />
          </div>

          {/* Tweet Live Preview */}
          <div
            style={{
              background: "#000",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "var(--adm-radius-md)",
              padding: "14px 16px",
              marginBottom: "20px",
            }}
          >
            <div className="adm-flex" style={{ gap: "10px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--adm-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "12px",
                  color: "#fff",
                }}
              >
                PC
              </div>
              <div>
                <span style={{ fontWeight: 700, fontSize: "13px", color: "#fff" }}>
                  Portal Cerrado
                </span>
                <span style={{ marginLeft: "4px", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                  @portalcerrado
                </span>
              </div>
            </div>

            <p
              style={{
                margin: "0 0 10px",
                fontSize: "13px",
                lineHeight: "1.4",
                color: "#e8eaf0",
                whiteSpace: "pre-wrap",
              }}
            >
              {effectiveText || "Selecione um artigo acima para ver a prévia."}
            </p>

            <div
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "var(--adm-radius-sm)",
                padding: "8px 12px",
                fontSize: "11px",
                color: "var(--adm-text-muted)",
              }}
            >
              🖼️ Imagem social renderizada dinamicamente com título e categoria será anexada.
            </div>
          </div>

          {/* Actions */}
          <div className="adm-flex-between">
            <button
              type="button"
              className="adm-btn adm-btn-ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="adm-btn adm-btn-primary"
              disabled={submitting || !selectedSlug || isOverLimit}
            >
              {submitting ? <span className="adm-spinner" style={{ width: 14, height: 14 }} /> : "🚀"} Postar no Twitter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
