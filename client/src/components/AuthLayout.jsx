import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";
import SiteBanner from "./SiteBanner.jsx";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <SiteBanner />
      <header className="px-6 py-5">
        <Link to="/" className="inline-block">
          <BrandLogo />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-[6vh]">
        <div className="w-full max-w-[380px]">
          <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-sm text-fg-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
