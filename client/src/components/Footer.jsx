import { RidgelineMark } from "./BrandLogo.jsx";

const Footer = () => (
  <footer className="mt-auto border-t border-border-subtle bg-bg-surface">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
      <div className="flex items-center gap-2.5">
        <RidgelineMark size={20} />
        <span className="type-h3 text-text-primary">Ridgeline LMS</span>
        <span className="type-body-sm text-text-tertiary">— Academic Platform</span>
      </div>
      <p className="type-body-sm text-text-tertiary">
        © {new Date().getFullYear()} Ridgeline LMS. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
