import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import NotificationBell from "./NotificationBell.jsx";

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect width="28" height="28" rx="7" fill="#166534" />
    <path
      d="M6 20 L11 11 L14.5 16.5 L18 9 L22 20 Z"
      fill="white"
      opacity="0.9"
    />
    <path
      d="M6 20 L11 11 L14.5 16.5 L12 20 Z"
      fill="#22c55e"
    />
  </svg>
);

const AvatarButton = ({ user, onClick }) => {
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink dark:text-dark-ink-soft dark:hover:bg-dark-surface-raised dark:hover:text-dark-ink"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine text-xs font-semibold text-white dark:bg-pine-light">
        {initials}
      </span>
      <span className="hidden sm:block">{user.name.split(" ")[0]}</span>
      <ChevronDown size={13} className="text-ink-muted dark:text-dark-ink-muted" />
    </button>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-raised/95 backdrop-blur-md dark:border-dark-border dark:bg-dark-surface/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <Logo />
          <span className="font-semibold tracking-tight text-ink dark:text-dark-ink">
            Ridgeline
          </span>
          <span className="hidden rounded-full bg-pine-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pine sm:block dark:bg-pine-light/10 dark:text-pine-lighter">
            LMS
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleDark}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink dark:text-dark-ink-soft dark:hover:bg-dark-surface-raised dark:hover:text-dark-ink"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user ? (
            <>
              <NotificationBell />

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <AvatarButton user={user} onClick={() => setMenuOpen((v) => !v)} />

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-surface-raised py-1.5 shadow-lg dark:border-dark-border dark:bg-dark-surface-raised">
                    <div className="border-b border-border px-3 pb-2 pt-1 dark:border-dark-border">
                      <p className="text-sm font-semibold text-ink dark:text-dark-ink">{user.name}</p>
                      <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{user.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-pine-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pine dark:bg-pine-light/10 dark:text-pine-lighter">
                        {user.role}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink dark:text-dark-ink-soft dark:hover:bg-dark-surface-elevated dark:hover:text-dark-ink"
                      >
                        <User size={14} />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-clay transition-colors hover:bg-clay-bg dark:text-clay-light dark:hover:bg-clay/10"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink dark:text-dark-ink-soft dark:hover:text-dark-ink"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-pine px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-pine-light dark:bg-pine-light dark:hover:bg-pine-lighter"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
