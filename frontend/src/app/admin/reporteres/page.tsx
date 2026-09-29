"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import {
  EmptyState,
  Spinner,
  ToastContainer,
  useToast,
} from "@/components/admin/AdminShared";
import { ReporterArticlesModal } from "@/components/admin/ReporterArticlesModal";
import { ReporterCard } from "@/components/admin/ReporterCard";
import { ReporterEditModal } from "@/components/admin/ReporterEditModal";
import {
  fetchAdminReporters,
  getAdminReporter,
  patchAdminReporter,
  type AdminReporter,
} from "@/lib/adminApi";

export default function AdminReportersPage() {
  const { apiKey } = useAdminAuth();
  const { toasts, push: showToast } = useToast();

  const [reporters, setReporters] = useState<AdminReporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");

  // Modals
  const [editingReporter, setEditingReporter] = useState<AdminReporter | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingArticlesReporter, setViewingArticlesReporter] = useState<AdminReporter | null>(null);
  const [loadingArticles, setLoadingArticles] = useState(false);

  const loadReporters = useCallback(async () => {
    if (!apiKey) return;
    try {
      const data = await fetchAdminReporters(apiKey);
      setReporters(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao carregar repórteres", "error");
    } finally {
      setLoading(false);
    }
  }, [apiKey, showToast]);

  useEffect(() => {
    loadReporters();
  }, [loadReporters]);

  const handleToggleActive = async (rep: AdminReporter) => {
    const nextState = !rep.active;
    try {
      await patchAdminReporter(apiKey, rep.slug, { active: nextState });
      setReporters((prev) =>
        prev.map((r) => (r.slug === rep.slug ? { ...r, active: nextState } : r))
      );
      showToast(
        `${rep.display_name || rep.slug} ${nextState ? "ativado" : "desativado"} com sucesso.`,
        "success"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao atualizar status", "error");
    }
  };

  const handleOpenArticles = async (rep: AdminReporter) => {
    setLoadingArticles(true);
    try {
      const detailed = await getAdminReporter(apiKey, rep.slug);
      setViewingArticlesReporter(detailed);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao buscar artigos do repórter", "error");
    } finally {
      setLoadingArticles(false);
    }
  };

  const filteredReporters = useMemo(() => {
    return reporters.filter((r) => {
      if (filterStatus === "active" && !r.active) return false;
      if (filterStatus === "inactive" && r.active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (r.display_name || r.name || "").toLowerCase();
        const role = (r.role || "").toLowerCase();
        const spec = (r.specialties || []).join(" ").toLowerCase();
        return name.includes(q) || role.includes(q) || spec.includes(q);
      }
      return true;
    });
  }, [reporters, filterStatus, search]);

  const totalPublished = reporters.reduce((acc, r) => acc + (r.articles_published || 0), 0);
  const totalActive = reporters.filter((r) => r.active).length;

  if (loading) {
    return <Spinner label="Carregando agentes e repórteres digitais…" />;
  }

  return (
    <div>
      <ToastContainer toasts={toasts} />

      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Agentes & Repórteres IA</h1>
          <p className="adm-page-sub">
            Gestão de personas editoriais, especialidades, voz e evolução dos repórteres digitais.
          </p>
        </div>
        <div className="adm-flex" style={{ gap: "10px" }}>
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-btn-sm"
            onClick={() => setIsCreating(true)}
          >
            ✨ Novo Repórter IA
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="adm-grid-3" style={{ marginBottom: "20px" }}>
        <div className="adm-card" style={{ padding: "16px" }}>
          <span className="adm-text-sm adm-text-muted">Total de Agentes</span>
          <p style={{ fontSize: "24px", fontWeight: 800, margin: "4px 0 0" }}>{reporters.length}</p>
        </div>
        <div className="adm-card" style={{ padding: "16px" }}>
          <span className="adm-text-sm adm-text-muted">Repórteres Ativos</span>
          <p style={{ fontSize: "24px", fontWeight: 800, margin: "4px 0 0", color: "var(--adm-success)" }}>
            {totalActive}
          </p>
        </div>
        <div className="adm-card" style={{ padding: "16px" }}>
          <span className="adm-text-sm adm-text-muted">Artigos Publicados por IA</span>
          <p style={{ fontSize: "24px", fontWeight: 800, margin: "4px 0 0", color: "var(--adm-accent)" }}>
            {totalPublished}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="adm-card" style={{ padding: "14px 16px", marginBottom: "20px" }}>
        <div className="adm-flex-between" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="adm-flex" style={{ gap: "8px" }}>
            <input
              type="text"
              className="adm-input"
              style={{ width: "240px", padding: "6px 12px", fontSize: "13px" }}
              placeholder="Buscar por nome ou especialidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="adm-flex" style={{ gap: "6px" }}>
            {(["all", "active", "inactive"] as const).map((st) => (
              <button
                key={st}
                type="button"
                className={`adm-btn adm-btn-sm ${filterStatus === st ? "adm-btn-primary" : "adm-btn-ghost"}`}
                onClick={() => setFilterStatus(st)}
              >
                {st === "all" ? "Todos" : st === "active" ? "Ativos" : "Inativos"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reporter Grid */}
      {filteredReporters.length === 0 ? (
        <EmptyState
          icon="🤖"
          title="Nenhum repórter encontrado"
          sub="Tente alterar os filtros ou adicione um novo repórter IA."
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {filteredReporters.map((rep) => (
            <ReporterCard
              key={rep.slug}
              reporter={rep}
              onToggleActive={handleToggleActive}
              onEdit={setEditingReporter}
              onViewArticles={handleOpenArticles}
            />
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      {(editingReporter || isCreating) && (
        <ReporterEditModal
          reporter={editingReporter}
          isNew={isCreating}
          apiKey={apiKey}
          onClose={() => {
            setEditingReporter(null);
            setIsCreating(false);
          }}
          onSaved={(saved) => {
            setReporters((prev) => {
              if (isCreating) return [saved, ...prev];
              return prev.map((r) => (r.slug === saved.slug ? saved : r));
            });
            setEditingReporter(null);
            setIsCreating(false);
            showToast("Repórter salvo com sucesso!", "success");
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {/* Recent Articles Modal */}
      <ReporterArticlesModal
        reporter={viewingArticlesReporter}
        loading={loadingArticles}
        onClose={() => setViewingArticlesReporter(null)}
      />
    </div>
  );
}
