"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import {
  EmptyState,
  Spinner,
  StatCard,
  StatusBadge,
  ToastContainer,
  useToast,
} from "@/components/admin/AdminShared";
import { AnalyticsDistribution } from "@/components/admin/AnalyticsDistribution";
import { AnalyticsTimelineChart } from "@/components/admin/AnalyticsTimelineChart";
import {
  fetchAnalyticsOverview,
  type AnalyticsOverview,
} from "@/lib/adminAnalyticsApi";

export default function AdminAnalyticsPage() {
  const { apiKey } = useAdminAuth();
  const { toasts, push: showToast } = useToast();

  const [periodDays, setPeriodDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (!apiKey) return;
      if (!silent) setRefreshing(true);
      try {
        const overview = await fetchAnalyticsOverview(apiKey, periodDays);
        setData(overview);
      } catch (err) {
        if (!silent) showToast(err instanceof Error ? err.message : "Erro ao carregar analytics", "error");
      } finally {
        setLoading(false);
        if (!silent) setRefreshing(false);
      }
    },
    [apiKey, periodDays, showToast]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !data) {
    return <Spinner label="Calculando métricas e audiência do portal…" />;
  }

  const kpis = data?.kpis ?? {
    total_pageviews: 0,
    period_pageviews: 0,
    total_published: 0,
    period_published: 0,
    avg_importance_score: 0,
    avg_engagement_score: 0,
  };
  const audience = data?.audience;
  const variation = audience?.pageview_change_percent;

  return (
    <div>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Inteligência de Audiência</h1>
          <p className="adm-page-sub">
            Audiência agregada, canais de aquisição e desempenho editorial — sem identificar leitores.
          </p>
        </div>
        <div className="adm-flex" style={{ gap: "10px" }}>
          {/* Period Selector */}
          <div className="adm-flex" style={{ gap: "4px" }}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                className={`adm-btn adm-btn-sm ${periodDays === d ? "adm-btn-primary" : "adm-btn-ghost"}`}
                onClick={() => setPeriodDays(d)}
              >
                {d} dias
              </button>
            ))}
          </div>

          <button
            type="button"
            className="adm-btn adm-btn-ghost adm-btn-sm"
            onClick={() => loadData(false)}
            disabled={refreshing}
          >
            {refreshing ? <span className="adm-spinner" style={{ width: 14, height: 14 }} /> : "🔄"} Atualizar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="adm-grid-4" style={{ marginBottom: "20px" }}>
        <StatCard
          label="Visualizações no Período"
          value={kpis.period_pageviews.toLocaleString("pt-BR")}
          icon="👁️"
          sub={`Total acumulado: ${kpis.total_pageviews.toLocaleString("pt-BR")}`}
          color="var(--adm-info)"
        />
        <StatCard
          label="Variação de audiência"
          value={variation === null || variation === undefined ? "Novo" : `${variation > 0 ? "+" : ""}${variation}%`}
          icon={variation && variation < 0 ? "↘️" : "↗️"}
          sub={`${audience?.previous_pageviews.toLocaleString("pt-BR") || 0} views no período anterior`}
          color="var(--adm-accent)"
        />
        <StatCard
          label="Produção no período"
          value={kpis.period_published}
          icon="📰"
          sub={`${kpis.total_published} matérias no acervo`}
          color="var(--adm-warning)"
        />
        <StatCard
          label="Engajamento editorial"
          value={`${kpis.avg_engagement_score} / 100`}
          icon="🔥"
          sub={`Importância média: ${kpis.avg_importance_score} / 100`}
          color="var(--adm-danger)"
        />
      </div>

      <div className="adm-grid-2" style={{ marginBottom: "20px" }}>
        <div className="adm-card" style={{ padding: "20px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "15px" }}>🧭 Canais de aquisição</h3>
          {(audience?.traffic_channels || []).map((item) => (
            <div key={item.channel} style={{ marginBottom: "11px" }}>
              <div className="adm-flex-between adm-text-sm"><strong>{item.channel}</strong><span>{item.views} views · {item.percentage}%</span></div>
              <div style={{ height: 6, background: "var(--adm-surface-2)", borderRadius: 4, marginTop: 5 }}><div style={{ width: `${item.percentage}%`, height: "100%", borderRadius: 4, background: "var(--adm-info)" }} /></div>
            </div>
          ))}
          {!audience?.traffic_channels.length && <p className="adm-text-muted adm-text-sm">Ainda não há tráfego registrado neste período.</p>}
        </div>
        <div className="adm-card" style={{ padding: "20px" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "15px" }}>🚪 Páginas de entrada e interesse</h3>
          {(audience?.top_pages || []).slice(0, 5).map((item) => (
            <div key={item.path} className="adm-flex-between adm-text-sm" style={{ padding: "8px 0", borderBottom: "1px solid var(--adm-border)" }}>
              <span style={{ maxWidth: "75%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.path || "/"}</span><strong>{item.views}</strong>
            </div>
          ))}
          {!audience?.top_pages.length && <p className="adm-text-muted adm-text-sm">As páginas mais acessadas aparecerão quando houver eventos.</p>}
        </div>
      </div>

      <p className="adm-text-sm adm-text-muted" style={{ margin: "-8px 0 20px" }}>🔒 {audience?.tracked_note || "Dados agregados e first-party."}</p>

      {/* Timeline Chart */}
      <div style={{ marginBottom: "20px" }}>
        <AnalyticsTimelineChart data={data?.timeline || []} periodDays={periodDays} />
      </div>

      {/* Distributions */}
      <AnalyticsDistribution
        categories={data?.categories || []}
        reporters={data?.reporters || []}
        referrers={data?.top_referrers || []}
      />

      {/* Top Articles Table */}
      <div className="adm-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700 }}>
          🏆 Top 10 Artigos Mais Acessados / Relevantes
        </h3>

        {data?.top_articles && data.top_articles.length > 0 ? (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>#</th>
                  <th>Título da Notícia</th>
                  <th>Categoria</th>
                  <th>Visualizações</th>
                  <th>Engajamento</th>
                  <th>Publicado em</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.top_articles.map((art, idx) => (
                  <tr key={art.id}>
                    <td style={{ fontWeight: 700, color: "var(--adm-text-faint)" }}>
                      {idx + 1}
                    </td>
                    <td>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "13px" }}>{art.title}</p>
                    </td>
                    <td>
                      <StatusBadge status={art.category || "Geral"} />
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--adm-info)" }}>
                      👁️ {art.views}
                    </td>
                    <td>
                      <span className="adm-badge adm-badge-published" style={{ fontSize: "11px" }}>
                        🔥 {art.engagement_score}
                      </span>
                    </td>
                    <td className="adm-text-sm adm-text-muted">
                      {art.published_at ? new Date(art.published_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/noticia/${art.slug}`}
                        target="_blank"
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        style={{ textDecoration: "none", fontSize: "11px", padding: "4px 8px" }}
                      >
                        Ver no Portal ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="📊"
            title="Nenhum artigo registrado no período"
            sub="Assim que o tráfego e novas matérias forem gerados, o ranking será exibido aqui."
          />
        )}
      </div>
    </div>
  );
}
