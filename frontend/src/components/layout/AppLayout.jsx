import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  {
    to: "/",
    label: "Dashboard",
    description: "Month view, summaries, and budget health",
    end: true,
  },
  {
    to: "/expenses",
    label: "Expenses",
    description: "Capture, filter, and correct spending records",
  },
  {
    to: "/budgets",
    label: "Budgets",
    description: "Plan by month and category with live usage",
  },
  {
    to: "/alerts",
    label: "Alerts",
    description: "Review near-limit and unusual-spend signals",
  },
  {
    to: "/ai",
    label: "AI Assistant",
    description: "Turn plain language into saved expenses",
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">AI Expense Tracker</p>
          <h1>Control every rupee with one calm workspace.</h1>
          <p className="sidebar-copy">
            Track spending, set monthly guardrails, and respond before your budget drifts.
          </p>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <p className="eyebrow">Signed in</p>
            <strong>{user?.fullName || "User"}</strong>
            <p>{user?.email}</p>
          </div>
          <button type="button" className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="workspace">
        <Outlet />
      </main>
    </div>
  );
}
