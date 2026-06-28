import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PenLine,
  BarChart3,
  Users,
  MapPin,
  User,
  LogOut,
  Brain,
  X,
  Menu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/log", icon: PenLine, label: "Log Mood" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/support", icon: Users, label: "Peer Support" },
  { to: "/therapists", icon: MapPin, label: "Therapists" },
  { to: "/profile", icon: User, label: "Profile" },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center gradient-bg shadow-lg flex-shrink-0"
          style={{ boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}
        >
          <Brain size={18} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-bold text-base leading-none" style={{ color: "var(--text-primary)" }}>
            MindMap
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Mental Health Tracker
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-3" style={{ color: "var(--text-muted)" }}>
          Navigation
        </p>
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "gradient-bg text-white shadow-lg"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { boxShadow: "0 4px 14px rgba(99,102,241,0.35)" } : {}
                }
              >
                <Icon size={17} strokeWidth={2} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-xl mb-2"
          style={{ background: "var(--bg-secondary)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 gradient-bg"
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {user?.name || "User"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {user?.email || ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 text-slate-400"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 h-screen sticky top-0 flex-shrink-0"
        style={{
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: Hamburger button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl glass"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        id="mobile-menu-open"
      >
        <Menu size={20} style={{ color: "var(--text-primary)" }} />
      </button>

      {/* Mobile: Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="relative z-50 w-72 h-full flex flex-col animate-slide-in"
            style={{ background: "var(--bg-secondary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} style={{ color: "var(--text-secondary)" }} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
