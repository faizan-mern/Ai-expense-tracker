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
    description: "Month view, summaries, and budget health",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/expenses",
    label: "Expenses",
    description: "Capture, filter, and correct spending records",
    icon: Receipt,
  },
  {
    to: "/budgets",
    label: "Budgets",
    description: "Plan by month and category with live usage",
    icon: PiggyBank,
  },
  {
    to: "/alerts",
    label: "Alerts",
    description: "Review near-limit and unusual-spend signals",
    icon: Bell,
  },
  {
    to: "/ai",
    label: "AI Assistant",
    description: "Turn plain language into saved expenses",
    icon: Bot,
  },
  {
    to: "/settings",
    label: "AI Settings",
    description: "Manage model, key, and extraction instructions",
    icon: Settings,
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="brand-name">AI Expense Tracker</p>
          <p className="brand-tagline">Smart spending, clear budgets.</p>
        </div>

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
                <span className="nav-icon">
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

        <div className="sidebar-footer">
          <div>
            <p className="eyebrow">Signed in</p>
            <strong>{user?.fullName || "User"}</strong>
            <p>{user?.email}</p>
          </div>
          <button type="button" className="ghost-button" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
          <span className="version-badge">v1.0.0 · Hiring Demo</span>
        </div>
      </aside>

      <main className="workspace">
        <Outlet />
      </main>
    </div>
  );
}
