/**
 * adminApi.ts — cliente do painel administrativo.
 * Todas as chamadas enviam X-API-Key; erros 401 são normalizados.
 */

// ─── Tipos compartilhados ────────────────────────────────────────────────────

export type AdminArticle = {
  id: number;
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  category: string;
  status: string;
  image_url?: string | null;
  reporter_slug?: string | null;
  reporter?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  importance_score?: number | null;
  engagement_score?: number | null;
  sources?: Array<{ url: string; name?: string }>;
};

export type AdminReporter = {
  id?: number;
  slug: string;
  display_name: string;
  name?: string;
  role: string;
  specialties?: string[];
  voice_profile?: Record<string, unknown>;
  prompt_system?: string | null;
  attribution?: string | null;
  articles_published?: number;
  article_count?: number;
  experience_points?: number;
  personality_stage?: string;
  stage?: string;
  age_days?: number;
  birth_date?: string | null;
  active?: boolean;
  is_active?: boolean;
  last_published_at?: string | null;
  recent_articles?: Array<{
    id: number;
    slug: string;
    title: string;
    category?: string | null;
    status: string;
    published_at?: string | null;
  }>;
};

export type OperationsStatus = {
  status: string;
  last_published_at?: string | null;
  published_count?: number;
  pending_count?: number;
  worker_alive?: boolean;
};

export type AdminStats = {
  total_published: number;
  total_pending: number;
  total_reporters: number;
  last_scan_at?: string | null;
  articles_today?: number;
  articles_this_week?: number;
};

// ─── Utilitário interno ───────────────────────────────────────────────────────

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
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── Status / operações ───────────────────────────────────────────────────────

/** Valida a chave e retorna o status operacional do portal. */
export async function fetchOperationsStatus(apiKey: string): Promise<OperationsStatus> {
  return apiFetch<OperationsStatus>("/api/operations/status", apiKey);
}

/** Retorna estatísticas consolidadas para o dashboard. */
export async function fetchAdminStats(apiKey: string): Promise<AdminStats> {
  try {
    type StatsRaw = { total_published: number; total_pending: number; total_reporters: number };
    const raw = await apiFetch<StatsRaw>("/api/admin/stats", apiKey);
    return { ...raw, last_scan_at: null, articles_today: 0, articles_this_week: 0 };
  } catch {
    const s = await apiFetch<OperationsStatus>("/api/operations/status", apiKey);
    return {
      total_published: s.published_count ?? 0,
      total_pending: s.pending_count ?? 0,
      total_reporters: 0,
      last_scan_at: s.last_published_at ?? null,
      articles_today: 0,
      articles_this_week: 0,
    };
  }
}

// ─── Artigos ──────────────────────────────────────────────────────────────────

export type ArticleListResponse = { total: number; articles: AdminArticle[] };

export type ArticleFilters = {
  offset?: number;
  limit?: number;
  status?: string;
  category?: string;
  q?: string;
};

export async function fetchAdminArticles(
  apiKey: string,
  { offset = 0, limit = 30, status, category, q }: ArticleFilters = {}
): Promise<ArticleListResponse> {
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
  if (status && status !== "all") params.set("status", status);
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  return apiFetch<ArticleListResponse>(`/api/admin/articles?${params}`, apiKey);
}

export async function getAdminArticle(
  apiKey: string,
  slug: string
): Promise<AdminArticle & { content?: string; sources?: unknown[] }> {
  return apiFetch(`/api/admin/articles/${encodeURIComponent(slug)}`, apiKey);
}

export async function patchAdminArticle(
  apiKey: string,
  slug: string,
  changes: Partial<Pick<AdminArticle,
    "title" | "summary" | "content" | "category" | "status" | "image_url" | "importance_score" | "engagement_score">>
): Promise<void> {
  await apiFetch<void>(`/api/admin/articles/${encodeURIComponent(slug)}`, apiKey, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export async function archiveAdminArticle(apiKey: string, slug: string): Promise<void> {
  await apiFetch<void>(`/api/admin/articles/${encodeURIComponent(slug)}`, apiKey, {
    method: "DELETE",
  });
}

/** Publica artigo existente promovendo status via PATCH. */
export async function publishAdminArticle(apiKey: string, slug: string): Promise<void> {
  await patchAdminArticle(apiKey, slug, { status: "published" });
}

export async function publishArticle(apiKey: string, slug: string): Promise<void> {
  await apiFetch<void>("/api/publish", apiKey, {
    method: "POST",
    body: JSON.stringify({ slug }),
  });
}

// ─── Repórteres ───────────────────────────────────────────────────────────────

export async function fetchAdminReporters(apiKey: string): Promise<AdminReporter[]> {
  try {
    const data = await apiFetch<{ total: number; reporters: AdminReporter[] }>("/api/admin/reporters", apiKey);
    return data.reporters || [];
  } catch {
    const data = await apiFetch<AdminReporter[] | { reporters?: AdminReporter[] }>("/api/reporters", apiKey);
    return Array.isArray(data) ? data : (data.reporters ?? []);
  }
}

export async function getAdminReporter(apiKey: string, slug: string): Promise<AdminReporter> {
  return apiFetch<AdminReporter>(`/api/admin/reporters/${encodeURIComponent(slug)}`, apiKey);
}

export async function patchAdminReporter(
  apiKey: string,
  slug: string,
  changes: Partial<AdminReporter>
): Promise<AdminReporter> {
  return apiFetch<AdminReporter>(`/api/admin/reporters/${encodeURIComponent(slug)}`, apiKey, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export async function createAdminReporter(apiKey: string, data: Partial<AdminReporter>): Promise<AdminReporter> {
  return apiFetch<AdminReporter>("/api/admin/reporters", apiKey, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Pipeline de Coleta ───────────────────────────────────────────────────────

export type WorkerInfo = { name: string; status: "online" | "offline" };

export type PipelineStatus = {
  checked_at: string;
  worker_status: {
    workers: WorkerInfo[];
    total: number;
    online: number;
    error?: string;
  };
  pipeline_lock: {
    running: boolean;
    redis: string;
    lock_ttl_seconds?: number;
  };
  queue: {
    draft?: number;
    classified?: number;
    review?: number;
    rewritten?: number;
    published?: number;
    failed?: number;
    archived?: number;
  };
  schedule: {
    interval_minutes: number;
    min_articles_per_day: number;
  };
  metrics: {
    published_today: number;
    target_today: number;
  };
  recent_logs: {
    action: string;
    article_id?: number;
    details?: string;
    at: string;
  }[];
};

export type TriggerPipelineResponse = {
  status: string;
  task_id?: string;
  message: string;
};

export type TaskResultResponse = {
  task_id: string;
  state: string;
  result?: unknown;
  error?: string;
};

export async function fetchPipelineStatus(apiKey: string): Promise<PipelineStatus> {
  return apiFetch<PipelineStatus>("/api/admin/pipeline/status", apiKey);
}

export async function triggerPipeline(apiKey: string): Promise<TriggerPipelineResponse> {
  return apiFetch<TriggerPipelineResponse>("/api/admin/pipeline/trigger", apiKey, {
    method: "POST",
  });
}

export async function fetchPipelineTaskResult(apiKey: string, taskId: string): Promise<TaskResultResponse> {
  return apiFetch<TaskResultResponse>(`/api/admin/pipeline/task/${encodeURIComponent(taskId)}`, apiKey);
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "admin_api_key";

export function saveApiKey(key: string): void {
  if (typeof sessionStorage !== "undefined") sessionStorage.setItem(STORAGE_KEY, key);
}

export function loadApiKey(): string {
  if (typeof sessionStorage !== "undefined") return sessionStorage.getItem(STORAGE_KEY) ?? "";
  return "";
}

export function clearApiKey(): void {
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
}

