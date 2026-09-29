/**
 * adminConfigApi.ts — Tipos e cliente de configurações, LLM e scheduler.
 */

export type SchedulerConfig = {
  update_interval_minutes: number;
  min_articles_per_day: number;
  ideal_articles_per_day: number;
  max_articles_per_day: number;
  articles_per_cycle: number;
  curiosities_enabled: boolean;
  anti_spam: {
    max_per_source_per_hour: number;
    max_per_topic_per_day: number;
    similarity_threshold: number;
  };
  peak_hours?: Record<string, unknown>;
};

export type LLMProviderInfo = {
  provider: string;
  is_primary: boolean;
  is_in_chain: boolean;
  api_key_configured: boolean;
  model: string;
};

export type LLMConfig = {
  active_provider: string;
  fallback_chain: string[];
  providers: LLMProviderInfo[];
};

export type SystemEnvConfig = {
  env: string;
  log_level: string;
  redis_url_set: boolean;
  sentry_enabled: boolean;
};

export type FullSystemConfig = {
  scheduler: SchedulerConfig;
  llm: LLMConfig;
  environment: SystemEnvConfig;
};

export type TestLLMResult = {
  provider: string;
  status: "success" | "error";
  message: string;
  latency_ms: number;
};

export type SourcePortalItem = {
  id: number;
  name: string;
  url: string;
  type: string;
};

async function apiFetch<T>(path: string, apiKey: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("Chave inválida ou sem permissão.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchFullSystemConfig(apiKey: string): Promise<FullSystemConfig> {
  return apiFetch<FullSystemConfig>("/api/admin/config/all", apiKey);
}

export async function testLLMProviderConnection(
  apiKey: string,
  provider?: string
): Promise<TestLLMResult> {
  return apiFetch<TestLLMResult>("/api/admin/config/test-llm", apiKey, {
    method: "POST",
    body: JSON.stringify({ provider }),
  });
}

export async function fetchSourcePortalsList(apiKey: string): Promise<SourcePortalItem[]> {
  const res = await apiFetch<{ total: number; sources: SourcePortalItem[] }>("/api/admin/config/sources", apiKey);
  return res.sources || [];
}
