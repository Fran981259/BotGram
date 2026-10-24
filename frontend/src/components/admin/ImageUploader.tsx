"use client";

import { useRef, useState } from "react";
import { uploadAdminImage } from "@/lib/adminApi";
import { useAdminAuth } from "./AdminAuthGuard";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  value: string;
  onChange: (url: string) => void;
};

/**
 * Campo de imagem com upload direto ou entrada manual de URL.
 * Valida tipo e tamanho no cliente antes de enviar ao backend.
 */
export function ImageUploader({ value, onChange }: Props) {
  const { apiKey } = useAdminAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");

  const handleFile = async (file: File) => {
    setError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Tipo não suportado. Use JPEG, PNG, WebP ou GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Arquivo muito grande (${Math.round(file.size / 1024)} KB). Máximo: 5 MB.`);
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadAdminImage(apiKey, file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Tabs upload / URL */}
      <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
        <button
          type="button"
          className={`adm-btn adm-btn-ghost${mode === "upload" ? " adm-btn-active" : ""}`}
          style={{ padding: "3px 10px", fontSize: 11 }}
          onClick={() => setMode("upload")}
        >
          Upload
        </button>
        <button
          type="button"
          className={`adm-btn adm-btn-ghost${mode === "url" ? " adm-btn-active" : ""}`}
          style={{ padding: "3px 10px", fontSize: 11 }}
          onClick={() => setMode("url")}
        >
          URL externa
        </button>
      </div>

      {mode === "upload" ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Área de upload de imagem"
          style={{
            border: "2px dashed var(--adm-border, #444)",
            borderRadius: 8,
            padding: "16px 12px",
            textAlign: "center",
            cursor: uploading ? "wait" : "pointer",
            opacity: uploading ? 0.6 : 1,
            background: "var(--adm-card-bg, transparent)",
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            style={{ display: "none" }}
            onChange={handleInputChange}
          />
          {uploading ? (
            <span style={{ fontSize: 13, color: "var(--adm-text-muted, #aaa)" }}>Enviando…</span>
          ) : (
            <span style={{ fontSize: 13, color: "var(--adm-text-muted, #aaa)" }}>
              Arraste ou <u>clique</u> para escolher (JPEG, PNG, WebP, GIF · máx 5 MB)
            </span>
          )}
        </div>
      ) : (
        <input
          className="adm-input"
          type="url"
          value={value}
          onChange={(e) => { setError(""); onChange(e.target.value); }}
          placeholder="https://..."
        />
      )}

      {error && (
        <p className="adm-error-msg" role="alert" style={{ margin: 0 }}>
          {error}
        </p>
      )}

      {/* Preview */}
      {value && (
        <div style={{ position: "relative", borderRadius: 6, overflow: "hidden", height: 80 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview da imagem"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            type="button"
            aria-label="Remover imagem"
            onClick={() => { setError(""); onChange(""); }}
            style={{
              position: "absolute", top: 4, right: 4,
              background: "rgba(0,0,0,0.6)", border: "none",
              borderRadius: "50%", width: 22, height: 22,
              color: "#fff", cursor: "pointer", fontSize: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
