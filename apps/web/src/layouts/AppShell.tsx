import { type PropsWithChildren, type ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../api/client";
import { canViewRoles, canViewUsers } from "../lib/permissions";
import type { AuthUser } from "../types";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  visible: boolean;
};

export function AppShell({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const user = getStoredUser() as AuthUser | null;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "Guest";
  const avatarLabel = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "PM";

  const navItems: NavItem[] = [
    {
      to: "/",
      label: "Dashboard",
      visible: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      ),
    },
    {
      to: "/projects",
      label: "Projects",
      visible: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
          <path d="M4 10.5h16" />
        </svg>
      ),
    },
    {
      to: "/tickets",
      label: "Tickets",
      visible: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6.5h16" />
          <path d="M4 17.5h16" />
          <path d="M9 3.5v17" />
          <path d="M15 3.5v17" />
        </svg>
      ),
    },
    {
      to: "/users",
      label: "Users",
      visible: canViewUsers(user),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
          <path d="M4 20c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" />
        </svg>
      ),
    },
    {
      to: "/roles",
      label: "Roles",
      visible: canViewRoles(user),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3 5 6v5c0 5 3.5 9.74 7 10 3.5-.26 7-5 7-10V6l-7-3Z" />
          <path d="M9.5 11h5" />
        </svg>
      ),
    },
    {
      to: "/reports",
      label: "Reports",
      visible: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 19h14" />
          <path d="M7 15v4" />
          <path d="M12 9v10" />
          <path d="M17 12v7" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>ProjectMGT</h1>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 12h12" />
              <path d="M12 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="sidebar-copy">
          A premium workspace shell for tracking delivery, team activity, and portfolio health.
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.filter((item) => item.visible).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-meta">
            <span className="sidebar-user-avatar">{avatarLabel}</span>
            <div className="sidebar-user-copy">
              <strong>{user?.name ?? "Guest User"}</strong>
              <span>{user?.role ?? "No role assigned"}</span>
            </div>
          </div>
          <button
            className="button ghost icon-button logout-button"
            type="button"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="search-wrapper">
            <span className="search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input className="search-input" type="search" placeholder="Search tickets, projects, users" aria-label="Search workspace" />
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-button notification-button" aria-label="View notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="notification-badge">3</span>
            </button>
            <button type="button" className="profile-pill" aria-label="Open profile menu">
              <span className="avatar">{avatarLabel}</span>
              <span className="profile-details">
                <strong>{firstName}</strong>
                <span>{user?.role ?? "Visitor"}</span>
              </span>
            </button>
          </div>
        </header>

        <div className="page-wrap">{children}</div>
      </main>
    </div>
  );
}
