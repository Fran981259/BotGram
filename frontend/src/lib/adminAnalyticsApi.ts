/**
 * adminAnalyticsApi.ts — Tipos e cliente de dados analíticos do painel admin.
 */

export type AnalyticsKPIs = {
  total_pageviews: number;
  period_pageviews: number;
  total_published: number;
  period_published: number;
  avg_importance_score: number;
  avg_engagement_score: number;
};

export type TimelinePoint = {
  date: string;
  views: number;
  articles: number;
};

export type TopArticleMetric = {
  id: number;
  slug: string;
  title: string;
  category?: string | null;
  views: number;
  engagement_score: number;
  importance_score: number;
  published_at?: string | null;
};

export type CategoryMetric = {
  category: string;
  count: number;
  percentage: number;
};

export type ReporterMetric = {
  name: string;
  slug: string;
  role: string;
  articles_published: number;
  stage: string;
  active: boolean;
};

export type ReferrerMetric = {
  referrer: string;
  views: number;
};

export type AnalyticsOverview = {
  period_days: number;
  generated_at: string;
  kpis: AnalyticsKPIs;
  timeline: TimelinePoint[];
  top_articles: TopArticleMetric[];
  categories: CategoryMetric[];
  reporters: ReporterMetric[];
  top_referrers: ReferrerMetric[];
};

export async function fetchAnalyticsOverview(
  apiKey: string,
  days = 30
): Promise<AnalyticsOverview> {
  const res = await fetch(`/api/admin/analytics/overview?days=${days}`, {
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("Chave inválida ou sem permissão.");
  if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
  return res.json() as Promise<AnalyticsOverview>;
}
