"use client";

import { useState } from "react";
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { AdminLoginPanel } from "@/components/admin/AdminLoginPanel";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminAuth } from "@/components/admin/AdminAuthGuard";
import { usePathname } from "next/navigation";
import "@/styles/admin.css";

// ─── Shell interno (autenticado) ──────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard":     "Dashboard",
  "/admin/artigos":       "Artigos",
  "/admin/editorial":     "Mesa editorial",
  "/admin/repórteres":    "Repórteres",
  "/admin/pipeline":      "Pipeline de coleta",
  "/admin/analytics":     "Analytics",
  "/admin/redes-sociais": "Redes sociais",
  "/admin/configuracoes": "Configurações",
  "/admin/usuarios":      "Usuários",
  "/admin/moderacao":     "Moderação",
  "/admin/logs":          "Logs & auditoria",
};

function AdminShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAdminAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const title =
    Object.entries(PAGE_TITLES).find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1] ??
    "Admin";

  return (
    <div className="adm-root">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onSignOut={signOut}
      />
      <div className={`adm-main${collapsed ? " sidebar-collapsed" : ""}`}>
        {/* Top bar */}
        <div className="adm-topbar">
          <h1 className="adm-topbar-title">{title}</h1>
          <span className="adm-topbar-badge">Admin</span>
        </div>

        {/* Conteúdo da página */}
        <div className="adm-page">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Layout exportado (raiz de /admin) ───────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard
      loginSlot={(ctx) => (
        <AdminLoginPanel
          signIn={ctx.signIn}
          isLoading={ctx.isLoading}
          error={ctx.error}
        />
      )}
    >
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
