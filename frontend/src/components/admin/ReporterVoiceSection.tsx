"use client";

export const STAGES = [
  { value: "newborn", label: "🌱 Newborn (0-30d — Experimental)" },
  { value: "developing", label: "🌿 Developing (1-3m — Encontrando voz)" },
  { value: "established", label: "🌳 Established (3-6m — Voz consolidada)" },
  { value: "mature", label: "⭐ Mature (6-12m — Confiança alta)" },
  { value: "signature", label: "👑 Signature (12-24m — Marca registrada)" },
  { value: "legendary", label: "🔥 Legendary (24m+ — Referência)" },
];

type Props = {
  tone: string;
  setTone: (val: string) => void;
  style: string;
  setStyle: (val: string) => void;
  bannedWords: string;
  setBannedWords: (val: string) => void;
  promptSystem: string;
  setPromptSystem: (val: string) => void;
};

/** Seção de perfil de voz editorial e instruções de persona para repórteres IA. */
export function ReporterVoiceSection({
  tone,
  setTone,
  style,
  setStyle,
  bannedWords,
  setBannedWords,
  promptSystem,
  setPromptSystem,
}: Props) {
  return (
    <>
      <div
        style={{
          background: "var(--adm-surface-2)",
          padding: "14px",
          borderRadius: "var(--adm-radius-md)",
          marginBottom: "14px",
        }}
      >
        <h4 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "var(--adm-text)" }}>
          🎙️ Perfil de Voz & Tom Editorial
        </h4>
        <div className="adm-grid-2" style={{ marginBottom: "10px" }}>
          <div>
            <label className="adm-label">Tom de Escrita</label>
            <input
              type="text"
              className="adm-input"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="ex: Analítico e acessível"
            />
          </div>
          <div>
            <label className="adm-label">Estilo Editorial</label>
            <input
              type="text"
              className="adm-input"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="ex: Jornalismo explicativo"
            />
          </div>
        </div>
        <div>
          <label className="adm-label">Palavras Proibidas / Clichês a Evitar</label>
          <input
            type="text"
            className="adm-input"
            value={bannedWords}
            onChange={(e) => setBannedWords(e.target.value)}
            placeholder="revolucionário, divisor de águas, sem sombra de dúvidas"
          />
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label className="adm-label">Prompt de Sistema / Instruções Customizadas da Persona</label>
        <textarea
          className="adm-input"
          rows={4}
          value={promptSystem}
          onChange={(e) => setPromptSystem(e.target.value)}
          placeholder="Você é Enzo Bianchi, repórter especializado em tecnologia do Portal Cerrado..."
          style={{ fontFamily: "monospace", fontSize: "12px" }}
        />
      </div>
    </>
  );
}
