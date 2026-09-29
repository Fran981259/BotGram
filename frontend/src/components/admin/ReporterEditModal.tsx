"use client";

import { useEffect, useState } from "react";
import type { AdminReporter } from "@/lib/adminApi";
import { createAdminReporter, patchAdminReporter } from "@/lib/adminApi";
import { ReporterVoiceSection, STAGES } from "@/components/admin/ReporterVoiceSection";

type Props = {
  reporter?: AdminReporter | null;
  isNew?: boolean;
  apiKey: string;
  onClose: () => void;
  onSaved: (saved: AdminReporter) => void;
  onError: (msg: string) => void;
};

export function ReporterEditModal({ reporter, isNew, apiKey, onClose, onSaved, onError }: Props) {
  const [slug, setSlug] = useState(reporter?.slug || "");
  const [displayName, setDisplayName] = useState(reporter?.display_name || "");
  const [role, setRole] = useState(reporter?.role || "general");
  const [specialtiesStr, setSpecialtiesStr] = useState((reporter?.specialties || []).join(", "));
  const [stage, setStage] = useState(reporter?.personality_stage || "newborn");
  const [active, setActive] = useState(reporter?.active ?? true);
  const [attribution, setAttribution] = useState(reporter?.attribution || "");

  // Voice Profile
  const voice = (reporter?.voice_profile as Record<string, unknown>) || {};
  const [tone, setTone] = useState((voice.tone as string) || "");
  const [style, setStyle] = useState((voice.style as string) || "");
  const [bannedWords, setBannedWords] = useState(
    Array.isArray(voice.banned_words) ? voice.banned_words.join(", ") : ""
  );

  // System Prompt
  const [promptSystem, setPromptSystem] = useState(
    typeof reporter?.prompt_system === "string"
      ? reporter.prompt_system
      : reporter?.prompt_system
      ? JSON.stringify(reporter.prompt_system, null, 2)
      : ""
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || (!reporter && !slug.trim())) {
      onError("Nome e slug são obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const specialties = specialtiesStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const banned = bannedWords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const voiceProfile = {
        ...voice,
        tone: tone.trim() || undefined,
        style: style.trim() || undefined,
        banned_words: banned.length > 0 ? banned : undefined,
      };

      let saved: AdminReporter;
      if (isNew) {
        saved = await createAdminReporter(apiKey, {
          slug: slug.trim().toLowerCase(),
          display_name: displayName.trim(),
          role: role.trim(),
          specialties,
          voice_profile: voiceProfile,
          prompt_system: promptSystem.trim() || undefined,
          attribution: attribution.trim() || undefined,
          active,
        });
      } else if (reporter) {
        saved = await patchAdminReporter(apiKey, reporter.slug, {
          display_name: displayName.trim(),
          role: role.trim(),
          specialties,
          personality_stage: stage,
          voice_profile: voiceProfile,
          prompt_system: promptSystem.trim() || undefined,
          attribution: attribution.trim() || undefined,
          active,
        });
      } else {
        return;
      }

      onSaved(saved);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Erro ao salvar repórter");
    } finally {
      setSaving(false);
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
          maxWidth: "680px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          background: "var(--adm-surface)",
        }}
      >
        <div className="adm-flex-between" style={{ marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
              {isNew ? "✨ Novo Repórter Digital IA" : `🤖 Editar Repórter: ${displayName}`}
            </h2>
            <p className="adm-text-sm adm-text-muted" style={{ margin: "4px 0 0" }}>
              Configure persona, especialidades, voz editorial e diretrizes do agente.
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

        <form onSubmit={handleSubmit}>
          {/* Identificação */}
          <div className="adm-grid-2" style={{ marginBottom: "14px" }}>
            <div>
              <label className="adm-label">Nome de Exibição *</label>
              <input
                type="text"
                className="adm-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ex: ENZO BIANCHI"
                required
              />
            </div>
            <div>
              <label className="adm-label">Slug identificador *</label>
              <input
                type="text"
                className="adm-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: enzo.bianchi"
                disabled={!isNew}
                required
              />
            </div>
          </div>

          <div className="adm-grid-2" style={{ marginBottom: "14px" }}>
            <div>
              <label className="adm-label">Papel / Editoria Principal</label>
              <input
                type="text"
                className="adm-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="technology, politics, health, etc."
              />
            </div>
            <div>
              <label className="adm-label">Estágio de Evolução</label>
              <select
                className="adm-input"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                disabled={isNew}
              >
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Especialidades */}
          <div style={{ marginBottom: "14px" }}>
            <label className="adm-label">Especialidades (separadas por vírgula)</label>
            <input
              type="text"
              className="adm-input"
              value={specialtiesStr}
              onChange={(e) => setSpecialtiesStr(e.target.value)}
              placeholder="IA, Inovação, Startups, Cibersegurança"
            />
          </div>

          {/* Voice Profile & System Prompt */}
          <ReporterVoiceSection
            tone={tone}
            setTone={setTone}
            style={style}
            setStyle={setStyle}
            bannedWords={bannedWords}
            setBannedWords={setBannedWords}
            promptSystem={promptSystem}
            setPromptSystem={setPromptSystem}
          />

          {/* Atribuição & Ativo */}
          <div className="adm-grid-2" style={{ marginBottom: "20px" }}>
            <div>
              <label className="adm-label">Texto de Atribuição / Bio Curta</label>
              <input
                type="text"
                className="adm-input"
                value={attribution}
                onChange={(e) => setAttribution(e.target.value)}
                placeholder="ex: Reportagem especializada em tecnologia do Portal Cerrado"
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "6px" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: active ? "var(--adm-success)" : "var(--adm-text-muted)",
                }}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ accentColor: "var(--adm-success)", width: 16, height: 16 }}
                />
                Repórter Ativo no Pipeline
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="adm-flex-between">
            <button
              type="button"
              className="adm-btn adm-btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="adm-btn adm-btn-primary"
              disabled={saving}
            >
              {saving ? <span className="adm-spinner" style={{ width: 14, height: 14 }} /> : "💾"} Salvar Repórter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
