/* ─── Card ──────────────────────────────────────────────────────── */
export const Card = ({ className = "", children, ...rest }) => (
  <div
    className={`rounded-xl border border-border bg-surface-raised shadow-sm dark:border-dark-border dark:bg-dark-surface-raised ${className}`}
    {...rest}
  >
    {children}
  </div>
);

/* ─── Button ─────────────────────────────────────────────────────── */
export const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) => {
  const variants = {
    primary:
      "bg-pine text-white shadow-sm hover:bg-pine-light active:scale-[0.98] disabled:opacity-50 dark:bg-pine-light dark:hover:bg-pine-lighter",
    secondary:
      "border border-border bg-surface-raised text-ink shadow-sm hover:bg-surface-sunken active:scale-[0.98] disabled:opacity-50 dark:border-dark-border dark:bg-dark-surface-raised dark:text-dark-ink dark:hover:bg-dark-surface-elevated",
    ghost:
      "text-ink-soft hover:bg-surface-sunken hover:text-ink active:scale-[0.98] dark:text-dark-ink-soft dark:hover:bg-dark-surface-raised dark:hover:text-dark-ink",
    danger:
      "bg-clay text-white shadow-sm hover:bg-clay-light active:scale-[0.98] disabled:opacity-50",
    outline:
      "border border-border text-ink hover:border-border-strong active:scale-[0.98] disabled:opacity-50 dark:border-dark-border dark:text-dark-ink dark:hover:border-dark-border-strong",
  };
  const sizes = {
    xs: "h-7 px-2.5 text-xs rounded-lg gap-1",
    sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
    md: "h-9 px-4 text-sm rounded-lg gap-2",
    lg: "h-10 px-5 text-sm rounded-xl gap-2",
    xl: "h-11 px-6 text-base rounded-xl gap-2",
  };
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

/* ─── Input ──────────────────────────────────────────────────────── */
export const Input = ({ label, error, hint, className = "", ...rest }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-ink dark:text-dark-ink">
        {label}
      </label>
    )}
    <input
      className={`h-9 w-full rounded-lg border bg-surface-raised px-3 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors
        focus:border-pine-light focus:ring-2 focus:ring-pine-light/15
        dark:bg-dark-surface-raised dark:text-dark-ink dark:placeholder:text-dark-ink-muted
        dark:focus:border-pine-lighter dark:focus:ring-pine-lighter/10
        ${error ? "border-clay focus:border-clay focus:ring-clay/15" : "border-border dark:border-dark-border"}
        ${className}`}
      {...rest}
    />
    {hint && !error && <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{hint}</p>}
    {error && <p className="text-xs text-clay">{error}</p>}
  </div>
);

/* ─── Textarea ───────────────────────────────────────────────────── */
export const Textarea = ({ label, error, hint, className = "", ...rest }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-ink dark:text-dark-ink">
        {label}
      </label>
    )}
    <textarea
      className={`min-h-[80px] w-full rounded-lg border bg-surface-raised px-3 py-2 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors resize-y
        focus:border-pine-light focus:ring-2 focus:ring-pine-light/15
        dark:bg-dark-surface-raised dark:text-dark-ink dark:placeholder:text-dark-ink-muted
        dark:focus:border-pine-lighter dark:focus:ring-pine-lighter/10
        ${error ? "border-clay" : "border-border dark:border-dark-border"}
        ${className}`}
      {...rest}
    />
    {hint && !error && <p className="text-xs text-ink-soft dark:text-dark-ink-soft">{hint}</p>}
    {error && <p className="text-xs text-clay">{error}</p>}
  </div>
);

/* ─── Select ─────────────────────────────────────────────────────── */
export const Select = ({ label, error, className = "", children, ...rest }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-ink dark:text-dark-ink">
        {label}
      </label>
    )}
    <select
      className={`h-9 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-ink outline-none transition-colors
        focus:border-pine-light focus:ring-2 focus:ring-pine-light/15
        dark:border-dark-border dark:bg-dark-surface-raised dark:text-dark-ink
        dark:focus:border-pine-lighter ${className}`}
      {...rest}
    >
      {children}
    </select>
    {error && <p className="text-xs text-clay">{error}</p>}
  </div>
);

/* ─── Badge ──────────────────────────────────────────────────────── */
export const Badge = ({ tone = "neutral", size = "sm", className = "", children }) => {
  const tones = {
    neutral: "bg-surface-sunken text-ink-soft border border-border dark:bg-dark-surface dark:text-dark-ink-soft dark:border-dark-border",
    pine: "bg-pine-bg text-pine border border-pine/20 dark:bg-pine-light/10 dark:text-pine-lighter dark:border-pine-lighter/20",
    amber: "bg-amber-bg text-amber-dark border border-amber/20 dark:bg-amber/10 dark:text-amber-lighter dark:border-amber-lighter/20",
    clay: "bg-clay-bg text-clay border border-clay/20 dark:bg-clay/10 dark:text-clay-light dark:border-clay-light/20",
    sky: "bg-sky-bg text-sky border border-sky/20 dark:bg-sky/10 dark:text-sky dark:border-sky/20",
  };
  const sizes = {
    xs: "px-1.5 py-0 text-[10px]",
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizes[size]} ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

/* ─── Spinner ────────────────────────────────────────────────────── */
export const Spinner = ({ size = 24, className = "" }) => (
  <div
    className={`animate-spin rounded-full border-2 border-border border-t-pine dark:border-dark-border dark:border-t-pine-lighter ${className}`}
    style={{ width: size, height: size }}
  />
);

/* ─── EmptyState ─────────────────────────────────────────────────── */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center dark:border-dark-border">
    {Icon && (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken dark:bg-dark-surface-raised">
        <Icon size={22} className="text-ink-muted dark:text-dark-ink-muted" />
      </div>
    )}
    <p className="text-sm font-semibold text-ink dark:text-dark-ink">{title}</p>
    {description && (
      <p className="mt-1 max-w-xs text-xs text-ink-soft dark:text-dark-ink-soft">{description}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* ─── Alert ──────────────────────────────────────────────────────── */
export const Alert = ({ tone = "clay", children }) => {
  const tones = {
    clay: "border-clay/25 bg-clay-bg text-clay dark:border-clay-light/20 dark:bg-clay/8 dark:text-clay-light",
    pine: "border-pine/25 bg-pine-bg text-pine dark:border-pine-lighter/20 dark:bg-pine-light/8 dark:text-pine-lighter",
    amber: "border-amber/30 bg-amber-bg text-amber-dark dark:border-amber-lighter/20 dark:bg-amber/8 dark:text-amber-lighter",
    sky: "border-sky/25 bg-sky-bg text-sky dark:border-sky/20 dark:bg-sky/8 dark:text-sky",
  };
  return (
    <div className={`rounded-lg border px-3.5 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
};

/* ─── SectionHeader ──────────────────────────────────────────────── */
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-ink dark:text-dark-ink">{title}</h1>
      {subtitle && (
        <p className="mt-0.5 text-sm text-ink-soft dark:text-dark-ink-soft">{subtitle}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* ─── Divider ────────────────────────────────────────────────────── */
export const Divider = ({ label, className = "" }) =>
  label ? (
    <div className={`relative flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-border dark:bg-dark-border" />
      <span className="text-xs font-medium uppercase tracking-widest text-ink-muted dark:text-dark-ink-muted">
        {label}
      </span>
      <div className="h-px flex-1 bg-border dark:bg-dark-border" />
    </div>
  ) : (
    <div className={`h-px bg-border dark:bg-dark-border ${className}`} />
  );
