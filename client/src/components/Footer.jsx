const Footer = () => (
  <footer className="mt-auto border-t border-border bg-surface-raised dark:border-dark-border dark:bg-dark-surface">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="7" fill="#166534" />
          <path d="M6 20 L11 11 L14.5 16.5 L18 9 L22 20 Z" fill="white" opacity="0.9" />
          <path d="M6 20 L11 11 L14.5 16.5 L12 20 Z" fill="#22c55e" />
        </svg>
        <span className="text-xs font-semibold text-ink dark:text-dark-ink">Ridgeline LMS</span>
        <span className="text-xs text-ink-muted dark:text-dark-ink-muted">— Quillance Infotech</span>
      </div>
      <p className="text-xs text-ink-muted dark:text-dark-ink-muted">
        © {new Date().getFullYear()} Ridgeline LMS. All rights reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
