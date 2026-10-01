import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth, homePathFor } from "../context/AuthContext.jsx";
import BrandLogo from "./BrandLogo.jsx";
import { Button, cx } from "./ui.jsx";
import SiteBanner from "./SiteBanner.jsx";
import { usePlatform } from "../context/PlatformContext.jsx";

const link = ({ isActive }) => cx("text-sm transition-colors", isActive ? "text-fg" : "text-fg-muted hover:text-fg");

export default function PublicLayout() {
  const { user } = useAuth();
  const { platform } = usePlatform();
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteBanner />
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link to="/">
              <BrandLogo />
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              <NavLink to="/courses" className={link}>
                Courses
              </NavLink>
              <NavLink to="/verify" className={link}>
                Verify a certificate
              </NavLink>
            </nav>
          </div>
          {user ? (
            <Button to={homePathFor(user)} variant="primary" size="sm">
              Open dashboard
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button to="/login" variant="ghost" size="sm">
                Sign in
              </Button>
              {platform.registrationOpen && (
                <Button to="/register" variant="primary" size="sm">
                  Create account
                </Button>
              )}
            </div>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 px-4 py-6 text-[13px] text-fg-muted sm:flex-row sm:justify-between sm:px-6">
          <span>{platform.platformName} · Full stack major project</span>
          <span className="flex gap-4">
            <Link to="/courses" className="hover:text-fg">Courses</Link>
            <Link to="/verify" className="hover:text-fg">Verify certificate</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
