import { Link, NavLink, useNavigate } from "react-router-dom";
import { Moon, Sun, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

const RidgeMark = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <path d="M2 20 L9 8 L13 14 L17 6 L24 20 Z" fill="var(--color-amber)" />
    <path d="M2 20 L9 8 L13 14 L10.5 18.5 L2 20 Z" fill="var(--color-pine)" />
  </svg>
);

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "text-pine dark:text-amber-light"
      : "text-ink-soft hover:text-ink dark:text-dark-ink-soft dark:hover:text-dark-ink"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const dashboardPath = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur dark:border-dark-border dark:bg-dark-surface/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <RidgeMark />
          <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-dark-ink">
            Ridgeline
          </span>
        </Link>

        <nav className="hidden items-center md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/courses" className={navLinkClass}>
            Courses
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          {user && (
            <NavLink to={dashboardPath} className={navLinkClass}>
              Dashboard
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="rounded-full p-2 text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink dark:text-dark-ink-soft dark:hover:bg-dark-surface-sunken dark:hover:text-dark-ink"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="text-sm font-medium text-ink-soft hover:text-ink dark:text-dark-ink-soft dark:hover:text-dark-ink"
              >
                {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-clay hover:text-clay dark:border-dark-border dark:text-dark-ink-soft dark:hover:border-clay"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm font-medium text-ink-soft hover:text-ink dark:text-dark-ink-soft dark:hover:text-dark-ink"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-pine px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pine-light"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        <button
          className="p-2 text-ink md:hidden dark:text-dark-ink"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border px-4 pb-4 md:hidden dark:border-dark-border">
          <div className="flex flex-col gap-1 pt-2">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/courses" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Courses
            </NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              About
            </NavLink>
            {user && (
              <NavLink to={dashboardPath} className={navLinkClass} onClick={() => setMobileOpen(false)}>
                Dashboard
              </NavLink>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3 dark:border-dark-border">
              <button onClick={toggleDark} className="flex items-center gap-2 text-sm text-ink-soft dark:text-dark-ink-soft">
                {dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? "Light mode" : "Dark mode"}
              </button>
              {user ? (
                <button onClick={handleLogout} className="text-sm font-medium text-clay">
                  Log out
                </button>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="text-sm font-medium text-ink-soft dark:text-dark-ink-soft">
                    Log in
                  </Link>
                  <Link to="/register" className="text-sm font-medium text-pine dark:text-amber-light">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
