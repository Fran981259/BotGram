"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  section?: string;
};

const NAV: NavItem[] = [
  { section: "Visão geral", label: "Dashboard",       href: "/admin/dashboard",       icon: "⬛" },
  { section: "Conteúdo",    label: "Artigos",          href: "/admin/artigos",          icon: "📰" },
  {                         label: "Mesa editorial",   href: "/admin/editorial",        icon: "✍️" },
  {                         label: "Repórteres",       href: "/admin/reporteres",       icon: "🤖" },
  { section: "Operações",   label: "Pipeline",         href: "/admin/pipeline",         icon: "⚙️" },
  {                         label: "Redes sociais",    href: "/admin/redes-sociais",    icon: "📡" },
  { section: "Dados",       label: "Analytics",        href: "/admin/analytics",        icon: "📊" },
  {                         label: "Logs",             href: "/admin/logs",             icon: "📋" },
  {                         label: "Moderação",        href: "/admin/moderacao",        icon: "🛡️" },
  { section: "Sistema",     label: "Configurações",    href: "/admin/configuracoes",    icon: "🔧" },
  {                         label: "Usuários",         href: "/admin/usuarios",         icon: "👥" },
];

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  onSignOut: () => void;
};

/** Sidebar de navegação do painel admin com suporte a colapso. */
export function AdminSidebar({ collapsed, onToggle, onSignOut }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={`adm-sidebar${collapsed ? " collapsed" : ""}`}
      aria-label="Navegação do painel admin"
    >
      {/* Logo */}
      <div className="adm-sidebar-logo">
        <div className="adm-sidebar-logo-icon" aria-hidden>PC</div>
        <span className="adm-sidebar-logo-text">Portal Cerrado</span>
        <button
          className="adm-collapse-btn"
          onClick={onToggle}
          aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Nav */}
      <nav className="adm-sidebar-nav" aria-label="Menu principal">
        {NAV.map((item) => {
          const showSection = Boolean(item.section);

          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <div key={item.href}>
              {showSection && !collapsed && (
                <p className="adm-nav-section" aria-hidden>{item.section}</p>
              )}
              <Link
                href={item.href}
                className={`adm-nav-item${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className="adm-nav-icon" aria-hidden>{item.icon}</span>
                <span className="adm-nav-label">{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="adm-sidebar-footer">
        <button
          className="adm-nav-item"
          onClick={onSignOut}
          style={{ width: "100%", margin: 0 }}
          title={collapsed ? "Sair" : undefined}
        >
          <span className="adm-nav-icon" aria-hidden>🚪</span>
          <span className="adm-nav-label">Sair</span>
        </button>
      </div>
    </aside>
  );
}
