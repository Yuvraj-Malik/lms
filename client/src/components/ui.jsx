export const Card = ({ className = "", children, ...rest }) => (
  <div
    className={`rounded-2xl border border-border bg-surface-raised p-5 dark:border-dark-border dark:bg-dark-surface-raised ${className}`}
    {...rest}
  >
    {children}
  </div>
);

export const Button = ({ variant = "primary", className = "", children, ...rest }) => {
  const variants = {
    primary: "bg-pine text-white hover:bg-pine-light disabled:opacity-50",
    secondary:
      "border border-border text-ink hover:bg-surface-sunken dark:border-dark-border dark:text-dark-ink dark:hover:bg-dark-surface-sunken",
    danger: "bg-clay text-white hover:opacity-90 disabled:opacity-50",
    ghost: "text-pine hover:bg-pine/10 dark:text-amber-light dark:hover:bg-amber-light/10",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, error, className = "", ...rest }) => (
  <label className="block">
    {label && (
      <span className="mb-1.5 block text-sm font-medium text-ink dark:text-dark-ink">{label}</span>
    )}
    <input
      className={`w-full rounded-lg border bg-surface-raised px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-pine dark:bg-dark-surface-raised dark:text-dark-ink ${
        error ? "border-clay" : "border-border dark:border-dark-border"
      } ${className}`}
      {...rest}
    />
    {error && <span className="mt-1 block text-xs text-clay">{error}</span>}
  </label>
);

export const Textarea = ({ label, error, className = "", ...rest }) => (
  <label className="block">
    {label && (
      <span className="mb-1.5 block text-sm font-medium text-ink dark:text-dark-ink">{label}</span>
    )}
    <textarea
      className={`w-full rounded-lg border bg-surface-raised px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-pine dark:bg-dark-surface-raised dark:text-dark-ink ${
        error ? "border-clay" : "border-border dark:border-dark-border"
      } ${className}`}
      {...rest}
    />
    {error && <span className="mt-1 block text-xs text-clay">{error}</span>}
  </label>
);

export const Select = ({ label, className = "", children, ...rest }) => (
  <label className="block">
    {label && (
      <span className="mb-1.5 block text-sm font-medium text-ink dark:text-dark-ink">{label}</span>
    )}
    <select
      className={`w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-pine dark:border-dark-border dark:bg-dark-surface-raised dark:text-dark-ink ${className}`}
      {...rest}
    >
      {children}
    </select>
  </label>
);

export const Badge = ({ tone = "neutral", children }) => {
  const tones = {
    neutral: "bg-surface-sunken text-ink-soft dark:bg-dark-surface-sunken dark:text-dark-ink-soft",
    pine: "bg-pine/10 text-pine dark:bg-pine-light/15 dark:text-pine-light",
    amber: "bg-amber/15 text-amber-dark dark:bg-amber/20 dark:text-amber-light",
    clay: "bg-clay/10 text-clay",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const Spinner = ({ size = 24 }) => (
  <div
    className="animate-spin rounded-full border-2 border-pine border-t-transparent"
    style={{ width: size, height: size }}
  />
);

export const EmptyState = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center dark:border-dark-border">
    <p className="font-display text-lg font-semibold text-ink dark:text-dark-ink">{title}</p>
    {description && <p className="mt-1.5 max-w-sm text-sm text-ink-soft dark:text-dark-ink-soft">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const Alert = ({ tone = "clay", children }) => {
  const tones = {
    clay: "border-clay/30 bg-clay/5 text-clay",
    pine: "border-pine/30 bg-pine/5 text-pine dark:text-pine-light",
    amber: "border-amber/40 bg-amber/10 text-amber-dark dark:text-amber-light",
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
};
