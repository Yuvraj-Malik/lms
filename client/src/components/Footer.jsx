const Footer = () => (
  <footer className="border-t border-border bg-surface-raised dark:border-dark-border dark:bg-dark-surface-raised">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:px-6 dark:text-dark-ink-soft">
      <p>Ridgeline LMS — built as a Quillance Infotech full-stack major project.</p>
      <p>© {new Date().getFullYear()} Ridgeline LMS. All rights reserved.</p>
    </div>
  </footer>
);

export default Footer;
