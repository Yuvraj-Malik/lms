import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, LogOut, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import NotificationBell from "./NotificationBell.jsx";
import { BrandLogo } from "./BrandLogo.jsx";

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
      className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface-raised hover:text-text-primary"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
        {initials}
      </span>
      <span className="hidden sm:block text-text-primary font-medium">{user.name.split(" ")[0]}</span>
      <ChevronDown size={13} className="text-text-tertiary" />
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
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand with mountain ridge mark */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 focus:outline-none">
          <BrandLogo size={28} />
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleDark}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-[6px] text-text-secondary transition-colors hover:bg-bg-surface-raised hover:text-text-primary"
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
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-[10px] border border-border-subtle bg-bg-surface-raised py-1.5 shadow-raised animate-fade-up">
                    <div className="border-b border-border-subtle px-3.5 pb-2.5 pt-1.5">
                      <p className="type-h3 text-text-primary truncate">{user.name}</p>
                      <p className="text-xs text-text-secondary truncate">{user.email}</p>
                      <span className="mt-1.5 inline-block rounded-[4px] border border-primary-500/20 bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700 dark:bg-primary-600/15 dark:text-primary-400">
                        {user.role}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
                      >
                        <User size={14} />
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-danger transition-colors hover:bg-rose-500/10"
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
                className="rounded-[6px] px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary hover:bg-bg-surface-raised"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-[6px] bg-primary-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 shadow-sm"
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
