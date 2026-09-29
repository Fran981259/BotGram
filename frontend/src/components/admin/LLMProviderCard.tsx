"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/admin/AdminShared";
import type { LLMProviderInfo, TestLLMResult } from "@/lib/adminConfigApi";
import { testLLMProviderConnection } from "@/lib/adminConfigApi";

type Props = {
  provider: LLMProviderInfo;
  apiKey: string;
};

const PROVIDER_ICONS: Record<string, string> = {
  gemini: "✨",
  groq: "⚡",
  openai: "🧠",
};

export function LLMProviderCard({ provider: p, apiKey }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestLLMResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testLLMProviderConnection(apiKey, p.provider);
      setTestResult(res);
    } catch (err) {
      setTestResult({
        provider: p.provider,
        status: "error",
        message: err instanceof Error ? err.message : "Falha na requisição",
        latency_ms: 0,
      });
    } finally {
      setTesting(false);
    }
  };

  const icon = PROVIDER_ICONS[p.provider] || "🤖";

  return (
    <div
      className="adm-card"
      style={{
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderTop: p.is_primary ? "3px solid var(--adm-accent)" : "3px solid var(--adm-border)",
      }}
    >
      <div>
        {/* Header */}
        <div className="adm-flex-between" style={{ marginBottom: "10px" }}>
          <div className="adm-flex" style={{ gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>{icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 700, textTransform: "uppercase" }}>
                {p.provider}
              </h3>
              <span className="adm-text-sm adm-text-muted" style={{ fontSize: "11px" }}>
                {p.model}
              </span>
            </div>
          </div>
          <div className="adm-flex" style={{ gap: "4px" }}>
            {p.is_primary && (
              <span className="adm-badge adm-badge-published" style={{ fontSize: "11px" }}>
                Primário
              </span>
            )}
            {p.is_in_chain && !p.is_primary && (
              <span className="adm-badge adm-badge-review" style={{ fontSize: "11px" }}>
                Failover
              </span>
            )}
          </div>
        </div>

        {/* API Key Status */}
        <div className="adm-flex-between adm-text-sm" style={{ marginBottom: "14px" }}>
          <span className="adm-text-muted">Chave de API (.env):</span>
          <StatusBadge status={p.api_key_configured ? "active" : "offline"} />
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            style={{
              padding: "8px 10px",
              borderRadius: "var(--adm-radius-sm)",
              fontSize: "12px",
              marginBottom: "12px",
              background:
                testResult.status === "success"
                  ? "rgba(34, 197, 94, 0.12)"
                  : "rgba(239, 68, 68, 0.12)",
              border: `1px solid ${
                testResult.status === "success"
                  ? "rgba(34, 197, 94, 0.3)"
                  : "rgba(239, 68, 68, 0.3)"
              }`,
              color: testResult.status === "success" ? "var(--adm-success)" : "var(--adm-danger)",
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>
              {testResult.status === "success" ? "✅ Conexão OK" : "❌ Falha no Teste"}
              {testResult.latency_ms > 0 && ` (${testResult.latency_ms}ms)`}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", opacity: 0.9 }}>
              {testResult.message}
            </p>
          </div>
        )}
      </div>

      {/* Test Button */}
      <button
        type="button"
        className="adm-btn adm-btn-ghost adm-btn-sm"
        style={{ width: "100%", justifyContent: "center", marginTop: "10px" }}
        onClick={handleTest}
        disabled={testing}
      >
        {testing ? <span className="adm-spinner" style={{ width: 14, height: 14 }} /> : "🔌"} Testar Conexão
      </button>
    </div>
  );
}
