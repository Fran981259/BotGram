/**
 * adminSocialApi.ts — Cliente de API para redes sociais e distribuição (Twitter/X).
 */

export type TwitterStatus = {
  configured: boolean;
  api_key_set: boolean;
  access_token_set: boolean;
  schedule: string;
  total_posts: number;
  last_post_at?: string | null;
};

export type SocialStatusResponse = {
  twitter: TwitterStatus;
};

export type SocialHistoryItem = {
  id: number;
  article_id?: number | null;
  action: string;
  details?: string | null;
  article_title?: string | null;
  article_slug?: string | null;
  category?: string | null;
  created_at: string;
};

export type ManualTweetPayload = {
  slug: string;
  custom_text?: string;
};

export async function fetchSocialStatus(apiKey: string): Promise<SocialStatusResponse> {
  const res = await fetch("/api/admin/social/status", {
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("Chave inválida ou sem permissão.");
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
  return res.json() as Promise<SocialStatusResponse>;
}

export async function fetchSocialHistory(apiKey: string, limit = 30): Promise<SocialHistoryItem[]> {
  const res = await fetch(`/api/admin/social/history?limit=${limit}`, {
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("Chave inválida ou sem permissão.");
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
  const data = (await res.json()) as { history: SocialHistoryItem[] };
  return data.history || [];
}

export async function sendManualTweet(apiKey: string, payload: ManualTweetPayload): Promise<void> {
  const res = await fetch("/api/admin/social/tweet", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("Chave inválida ou sem permissão.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erro ${res.status}: ${res.statusText}`);
  }
}

export async function triggerTopNewsTweet(apiKey: string): Promise<{ task_id: string; message: string }> {
  const res = await fetch("/api/admin/social/trigger-top-news", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
  });
  if (res.status === 401) throw new Error("Chave inválida ou sem permissão.");
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
  return res.json() as Promise<{ task_id: string; message: string }>;
}
