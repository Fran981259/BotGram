/**
 * adminAuditApi.ts — Tipos e cliente de auditoria, moderação e segurança.
 */

export type AuditLogItem = {
  id: number;
  action: string;
  details?: string | null;
  article_id?: number | null;
  article_title?: string | null;
  article_slug?: string | null;
  category?: string | null;
  reporter_name?: string | null;
  reporter_slug?: string | null;
  created_at: string;
};

export type AuditLogsResponse = {
  total: number;
  offset: number;
  limit: number;
  logs: AuditLogItem[];
};

export type AuditStats = {
  total_logs: number;
  today_logs: number;
  week_logs: number;
  actions_breakdown: Record<string, number>;
};

export type ModerationItem = {
  id: number;
  slug: string;
  title: string;
  category?: string | null;
  status: string;
  importance_score?: number | null;
  engagement_score?: number | null;
  created_at: string;
};

export type SecurityInfo = {
  environment: string;
  auth_method: string;
  api_key_configured: boolean;
  key_strength_policy: string;
  trusted_proxies: string[];
  cors_origins: string[];
  active_operator: string;
  policies: Record<string, string>;
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

export async function fetchAuditLogs(
  apiKey: string,
  { offset = 0, limit = 30, action, q }: { offset?: number; limit?: number; action?: string; q?: string } = {}
): Promise<AuditLogsResponse> {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  if (action && action !== "all") params.set("action", action);
  if (q && q.trim()) params.set("q", q.trim());
  return apiFetch<AuditLogsResponse>(`/api/admin/audit/logs?${params}`, apiKey);
}

export async function fetchAuditStats(apiKey: string): Promise<AuditStats> {
  return apiFetch<AuditStats>("/api/admin/audit/stats", apiKey);
}

export async function fetchModerationItems(apiKey: string): Promise<{ total: number; items: ModerationItem[] }> {
  return apiFetch<{ total: number; items: ModerationItem[] }>("/api/admin/moderation/items", apiKey);
}

export async function resolveModerationItem(
  apiKey: string,
  articleId: number,
  action: "approve" | "reject" | "archive",
  reason?: string
): Promise<void> {
  await apiFetch<void>("/api/admin/moderation/action", apiKey, {
    method: "POST",
    body: JSON.stringify({ article_id: articleId, action, reason }),
  });
}

export async function fetchSecurityInfo(apiKey: string): Promise<SecurityInfo> {
  return apiFetch<SecurityInfo>("/api/admin/security/info", apiKey);
}
