"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import { StatCard, StatusBadge, Spinner, EmptyState } from "@/components/admin/AdminShared";
import { fetchAdminStats, fetchAdminArticles, type AdminStats, type AdminArticle } from "@/lib/adminApi";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { apiKey } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<AdminArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    Promise.all([
      fetchAdminStats(apiKey),
      fetchAdminArticles(apiKey, { limit: 6, status: "published" }),
    ])
      .then(([s, q]) => {
        if (!active) return;
        setStats({ ...s, total_published: q.total });
        setRecent(q.articles);
      })
      .catch((err) => { if (active) setError(String(err)); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [apiKey]);

  if (isLoading) return <Spinner label="Carregando dashboard…" />;
  if (error) return <EmptyState icon="❌" title="Erro ao carregar" sub={error} />;

  return (
    <div>
      {/* KPIs */}
      <div className="adm-grid-4" style={{ marginBottom: 28 }}>
        <StatCard
          label="Artigos publicados"
          value={stats?.total_published ?? "—"}
          icon="📰"
          sub="total no banco"
          color="var(--adm-accent)"
        />
        <StatCard
          label="Na fila"
          value={stats?.total_pending ?? "—"}
          icon="⏳"
          sub="aguardando publicação"
          color="var(--adm-warning)"
        />
        <StatCard
          label="Repórteres ativos"
          value={stats?.total_reporters || "—"}
          icon="🤖"
          sub="agentes IA"
          color="var(--adm-success)"
        />
        <StatCard
          label="Última publicação"
          value={stats?.last_scan_at ? formatRelative(stats.last_scan_at) : "—"}
          icon="🕐"
          sub="tempo relativo"
          color="var(--adm-info)"
        />
      </div>

      {/* Acesso rápido */}
      <div className="adm-grid-3" style={{ marginBottom: 28 }}>
        <QuickLink href="/admin/artigos"       icon="📰" label="Gerenciar artigos"       sub="Listar, editar, publicar" />
        <QuickLink href="/admin/pipeline"      icon="⚙️" label="Pipeline de coleta"       sub="Status e scan manual" />
        <QuickLink href="/admin/editorial"     icon="✍️" label="Mesa editorial"           sub="Revisão da fila" />
        <QuickLink href="/admin/analytics"     icon="📊" label="Analytics"               sub="Alcance e engajamento" />
        <QuickLink href="/admin/reporteres"    icon="🤖" label="Repórteres"              sub="Agentes IA" />
        <QuickLink href="/admin/configuracoes" icon="🔧" label="Configurações"            sub="Sistema e LLM" />
      </div>

      {/* Artigos recentes */}
      <div className="adm-card">
        <div className="adm-flex-between" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--adm-text)" }}>
            Publicados recentemente
          </h2>
          <a
            href="/admin/artigos"
            style={{ fontSize: 12, color: "var(--adm-accent)", textDecoration: "none", fontWeight: 600 }}
          >
            Ver todos →
          </a>
        </div>

        {recent.length === 0 ? (
          <EmptyState icon="📭" title="Nenhum artigo publicado" sub="Publique o primeiro artigo pela mesa editorial." />
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Publicado em</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.slug}>
                    <td style={{ maxWidth: 340 }}>
                      <a
                        href={`/noticia/${a.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--adm-text)", textDecoration: "none", fontWeight: 500 }}
                      >
                        {a.title}
                      </a>
                    </td>
                    <td style={{ color: "var(--adm-text-muted)" }}>{a.category}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td style={{ color: "var(--adm-text-faint)", fontSize: 12, whiteSpace: "nowrap" }}>
                      {a.published_at ? formatDate(a.published_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function QuickLink({ href, icon, label, sub }: { href: string; icon: string; label: string; sub: string }) {
  return (
    <a
      href={href}
      className="adm-stat-card"
      style={{ textDecoration: "none", flexDirection: "row", alignItems: "center", gap: 14 }}
    >
      <span style={{ fontSize: 24, flexShrink: 0 }} aria-hidden>{icon}</span>
      <div>
        <p style={{ fontWeight: 600, color: "var(--adm-text)", fontSize: 13 }}>{label}</p>
        <p style={{ color: "var(--adm-text-muted)", fontSize: 11, marginTop: 2 }}>{sub}</p>
      </div>
    </a>
  );
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `${min}min atrás`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h atrás`;
    return `${Math.floor(h / 24)}d atrás`;
  } catch { return "—"; }
}
