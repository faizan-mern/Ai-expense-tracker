import {
  Bell,
  Bot,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Receipt,
  Settings,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    description: "Month overview and key signals",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/expenses",
    label: "Expenses",
    description: "Create, filter, and update entries",
    icon: Receipt,
  },
  {
    to: "/budgets",
    label: "Budgets",
    description: "Monthly limits and live usage",
    icon: PiggyBank,
  },
  {
    to: "/alerts",
    label: "Alerts",
    description: "Unread warnings and activity",
    icon: Bell,
  },
  {
    to: "/ai",
    label: "AI Assistant",
    description: "Parse natural-language expenses",
    icon: Bot,
  },
  {
    to: "/settings",
    label: "AI Settings",
    description: "Keys, model, and prompt rules",
    icon: Settings,
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-block">
            <p className="brand-kicker">AI Expense Tracker</p>
            <p className="brand-name">Clear spending control for daily use.</p>
            <p className="brand-tagline">
              Track expenses, monitor budgets, and keep AI-assisted entries predictable.
            </p>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-section-label">Workspace</p>
            <nav className="nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                  >
                    <span className="nav-icon" aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <span className="nav-text">
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <p className="eyebrow">Signed in</p>
            <strong>{user?.fullName || "User"}</strong>
            <p>{user?.email}</p>
          </div>
          <button type="button" className="ghost-button ghost-button--sidebar" onClick={logout}>
            <span className="btn-content">
              <LogOut size={16} />
              <span>Logout</span>
            </span>
          </button>
          <span className="version-badge">v1.0.0 / Hiring Demo</span>
        </div>
      </aside>

      <main className="workspace">
        <div className="workspace-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
