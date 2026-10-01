import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { Menu, X, Moon, Sun, LogOut, Settings, ChevronsUpDown } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import BrandLogo from "./BrandLogo.jsx";
import { Avatar, cx } from "./ui.jsx";
import SiteBanner from "./SiteBanner.jsx";

const NavItem = ({ item, onNavigate }) => (
  <NavLink
    to={item.to}
    end={item.end}
    onClick={onNavigate}
    className={({ isActive }) =>
      cx(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        isActive ? "bg-muted font-medium text-fg" : "text-fg-muted hover:bg-subtle hover:text-fg"
      )
    }
  >
    <item.icon size={16} strokeWidth={1.9} className="shrink-0" />
    <span className="truncate">{item.label}</span>
    {item.badge ? <span className="tabular ml-auto rounded bg-accent-soft px-1.5 text-xs text-accent-fg">{item.badge}</span> : null}
  </NavLink>
);

const UserMenu = () => {
  const { user, isSuper, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const settingsPath = user.role === "admin" ? "/admin/settings" : "/dashboard/settings";

  useEffect(() => {
    if (!open) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-subtle"
      >
        <Avatar user={user} size={28} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-fg">{user.name}</span>
          <span className="block truncate text-xs text-fg-muted">
            {user.role === "admin" ? (isSuper ? "Super admin" : "Instructor") : "Student"}
          </span>
        </span>
        <ChevronsUpDown size={14} className="text-fg-subtle" />
      </button>
      {open && (
        <div className="animate-pop absolute bottom-full left-0 z-50 mb-2 w-full min-w-[220px] overflow-hidden rounded-lg bg-surface py-1 shadow-pop">
          <div className="border-b border-line px-3 py-2">
            <div className="truncate text-[13px] text-fg-muted">{user.email}</div>
          </div>
          <Link to={settingsPath} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-fg hover:bg-subtle">
            <Settings size={15} className="text-fg-muted" /> Account settings
          </Link>
          <button onClick={toggleDark} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-fg hover:bg-subtle">
            {dark ? <Sun size={15} className="text-fg-muted" /> : <Moon size={15} className="text-fg-muted" />}
            {dark ? "Light theme" : "Dark theme"}
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="flex w-full items-center gap-2 border-t border-line px-3 py-2 text-sm text-fg hover:bg-subtle"
          >
            <LogOut size={15} className="text-fg-muted" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ sections, onNavigate, inDrawer = false }) => (
  <div className="flex h-full flex-col">
    <div className="flex h-14 items-center justify-between px-4">
      <Link to="/" onClick={onNavigate}>
        <BrandLogo />
      </Link>
      {!inDrawer && <NotificationBell align="left" />}
    </div>
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
      {sections.map((s) => (
        <div key={s.title || "main"}>
          {s.title && <div className="mb-1 px-2.5 text-xs font-medium text-fg-subtle">{s.title}</div>}
          <div className="space-y-0.5">
            {s.items.map((item) => (
              <NavItem key={item.to} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
    <div className="border-t border-line p-2">
      <UserMenu />
    </div>
  </div>
);

export default function AppShell({ sections }) {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawer(false);
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-surface lg:block">
        <Sidebar sections={sections} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="no-print sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-surface px-3 lg:hidden">
        <button onClick={() => setDrawer(true)} aria-label="Open menu" className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-subtle">
          <Menu size={18} />
        </button>
        <BrandLogo size={22} />
        <NotificationBell align="right" />
      </div>
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="animate-pop absolute inset-y-0 left-0 w-72 border-r border-line bg-surface">
            <button onClick={() => setDrawer(false)} aria-label="Close menu" className="absolute right-2 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-subtle lg:hidden">
              <X size={18} />
            </button>
            <Sidebar sections={sections} onNavigate={() => setDrawer(false)} inDrawer />
          </div>
        </div>
      )}

      <main className="lg:pl-60 print:p-0">
        <SiteBanner />
        <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8 print:max-w-none print:p-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
