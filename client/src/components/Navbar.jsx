import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

const RidgeMark = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <path d="M2 20 L9 8 L13 14 L17 6 L24 20 Z" fill="var(--color-amber)" />
    <path d="M2 20 L9 8 L13 14 L10.5 18.5 L2 20 Z" fill="var(--color-pine)" />
  </svg>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur dark:border-dark-border dark:bg-dark-surface/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <RidgeMark />
          <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-dark-ink">
            Ridgeline
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className="rounded-full p-2 text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink dark:text-dark-ink-soft dark:hover:bg-dark-surface-sunken dark:hover:text-dark-ink"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                to="/profile"
                className="hidden text-sm font-medium text-ink-soft hover:text-ink dark:text-dark-ink-soft dark:hover:text-dark-ink sm:inline"
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
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
