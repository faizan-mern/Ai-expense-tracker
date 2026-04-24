import {
  Bell,
  Bot,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Receipt,
  Settings,
  Wallet,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/ai", label: "AI Assistant", icon: Bot },
  { to: "/settings", label: "AI Settings", icon: Settings },
];

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#177b5a]">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="text-[0.95rem] font-bold text-white tracking-tight">
            AI Expense
          </span>
        </div>

        {/* Nav label */}
        <p className="px-3 text-[0.7rem] font-extrabold tracking-[0.14em] uppercase text-white/40 mb-1">
          Workspace
        </p>

        {/* Nav links — vertical on desktop, horizontal scroll on tablet */}
        <nav className="flex flex-col gap-0.5 flex-1 max-[1180px]:flex-row max-[1180px]:overflow-x-auto max-[1180px]:flex-none max-[1180px]:pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border-l-2 shrink-0 max-[1180px]:border-l-0 max-[1180px]:border-b-2",
                    isActive
                      ? "bg-white/10 text-white border-l-[#46b28b] max-[1180px]:border-b-[#46b28b]"
                      : "text-white/65 border-l-transparent border-b-transparent hover:bg-white/6 hover:text-white/90",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex items-center justify-center w-7 h-7 rounded-lg transition-colors shrink-0",
                        isActive
                          ? "bg-[#177b5a]/50 text-white"
                          : "text-white/60",
                      ].join(" ")}
                    >
                      <Icon size={15} />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: user + logout */}
        <div className="mt-auto pt-4 border-t border-white/10 max-[1180px]:mt-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/6 transition-colors group">
            {/* Avatar */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#177b5a]/50 text-white text-xs font-bold shrink-0">
              {getInitials(user?.fullName)}
            </div>
            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="m-0 text-[0.85rem] font-semibold text-white truncate leading-tight">
                {user?.fullName || "User"}
              </p>
              <p className="m-0 text-[0.72rem] text-white/50 truncate leading-tight">
                {user?.email}
              </p>
            </div>
            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut size={14} />
            </button>
          </div>
          <p className="px-2 mt-2 text-[0.68rem] text-white/30">
            v1.0.0 · Hiring Demo
          </p>
        </div>
      </aside>

      {/* ── Main workspace ── */}
      <main className="workspace">
        <div className="workspace-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
