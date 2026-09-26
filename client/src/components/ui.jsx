import { CheckCircle2, Clock, AlertTriangle, CircleDot, Disc } from "lucide-react";

/* ─── Card ──────────────────────────────────────────────────────── */
export const Card = ({ className = "", children, ...rest }) => (
  <div
    className={`rounded-[10px] border border-border-subtle bg-bg-surface p-6 shadow-card transition-colors duration-150 ${className}`}
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
      "bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50",
    secondary:
      "border border-border-default bg-bg-surface-raised text-text-primary shadow-sm hover:bg-bg-surface active:scale-[0.98] disabled:opacity-50",
    ghost:
      "text-text-secondary hover:bg-bg-surface-raised hover:text-text-primary active:scale-[0.98]",
    danger:
      "bg-danger text-white shadow-sm hover:bg-danger/90 active:scale-[0.98] disabled:opacity-50",
    outline:
      "border border-border-default text-text-primary hover:border-primary-500 active:scale-[0.98] disabled:opacity-50",
  };

  const sizes = {
    xs: "h-7 px-2.5 text-xs rounded-[6px] gap-1",
    sm: "h-8 px-3 text-xs rounded-[6px] gap-1.5",
    md: "h-9 px-4 text-sm rounded-[6px] gap-2",
    lg: "h-10 px-5 text-sm rounded-[10px] gap-2",
    xl: "h-11 px-6 text-base rounded-[10px] gap-2",
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
      <label className="text-sm font-medium text-text-primary">
        {label}
      </label>
    )}
    <input
      className={`h-9 w-full rounded-[6px] border border-border-default bg-bg-surface-raised px-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors
        focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15
        ${error ? "border-danger focus:border-danger focus:ring-danger/15" : ""}
        ${className}`}
      {...rest}
    />
    {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
);

/* ─── Textarea ───────────────────────────────────────────────────── */
export const Textarea = ({ label, error, hint, className = "", ...rest }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-text-primary">
        {label}
      </label>
    )}
    <textarea
      className={`min-h-[88px] w-full rounded-[6px] border border-border-default bg-bg-surface-raised px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors resize-y
        focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15
        ${error ? "border-danger focus:border-danger" : ""}
        ${className}`}
      {...rest}
    />
    {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
);

/* ─── Select ─────────────────────────────────────────────────────── */
export const Select = ({ label, error, className = "", children, ...rest }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-sm font-medium text-text-primary">
        {label}
      </label>
    )}
    <select
      className={`h-9 w-full rounded-[6px] border border-border-default bg-bg-surface-raised px-3 text-sm text-text-primary outline-none transition-colors
        focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15
        ${className}`}
      {...rest}
    >
      {children}
    </select>
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
);

/* ─── Generic Badge ──────────────────────────────────────────────── */
export const Badge = ({ tone = "neutral", size = "sm", className = "", children }) => {
  const tones = {
    neutral:
      "bg-bg-surface-raised text-text-secondary border border-border-subtle",
    brand:
      "bg-primary-50 text-primary-700 border border-primary-500/20 dark:bg-primary-600/15 dark:text-primary-400",
    success:
      "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 dark:text-emerald-400",
    warning:
      "bg-amber-500/10 text-amber-700 border border-amber-500/25 dark:text-amber-400",
    danger:
      "bg-rose-500/10 text-rose-700 border border-rose-500/25 dark:text-rose-400",
    info:
      "bg-blue-500/10 text-blue-700 border border-blue-500/25 dark:text-blue-400",
    // Compatibility aliases
    pine: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-700 border border-amber-500/25 dark:text-amber-400",
    clay: "bg-rose-500/10 text-rose-700 border border-rose-500/25 dark:text-rose-400",
    sky: "bg-blue-500/10 text-blue-700 border border-blue-500/25 dark:text-blue-400",
  };

  const sizes = {
    xs: "px-2 py-0.5 text-[10px] tracking-wider uppercase font-semibold",
    sm: "px-2.5 py-0.5 text-xs font-medium",
    md: "px-3 py-1 text-xs font-medium",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] ${sizes[size]} ${tones[tone] || tones.neutral} ${className}`}
    >
      {children}
    </span>
  );
};

/* ─── Differentiated Status Badge (Icon + Shape + Semantic Color) ─── */
export const StatusBadge = ({
  status = "neutral",
  label,
  size = "sm",
  className = "",
}) => {
  const normalized = String(status).toLowerCase().trim();

  // Completed
  if (
    normalized === "completed" ||
    normalized === "graded" ||
    normalized === "passed" ||
    normalized === "verified"
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 ${className}`}
      >
        <CheckCircle2 size={12} className="shrink-0 fill-emerald-500 text-white dark:text-bg-surface" />
        <span>{label || (normalized === "graded" ? "Graded" : "Completed")}</span>
      </span>
    );
  }

  // In Progress / Active
  if (
    normalized === "in progress" ||
    normalized === "in-progress" ||
    normalized === "active"
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 ${className}`}
      >
        <CircleDot size={12} className="shrink-0 text-blue-600 dark:text-blue-400" />
        <span>{label || "In Progress"}</span>
      </span>
    );
  }

  // Upcoming
  if (
    normalized === "upcoming" ||
    normalized === "unsubmitted" ||
    normalized === "not started" ||
    normalized === "not-started"
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-border-default bg-bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-secondary ${className}`}
      >
        <Clock size={12} className="shrink-0 text-text-tertiary" />
        <span>{label || "Upcoming"}</span>
      </span>
    );
  }

  // Overdue / Failed / Late
  if (
    normalized === "overdue" ||
    normalized === "late" ||
    normalized === "failed" ||
    normalized === "deactivated"
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-rose-500/25 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400 ${className}`}
      >
        <AlertTriangle size={12} className="shrink-0 text-rose-600 dark:text-rose-400" />
        <span>{label || (normalized === "late" ? "Late" : "Overdue")}</span>
      </span>
    );
  }

  // Pending Review / Submitted
  if (
    normalized === "pending" ||
    normalized === "pending review" ||
    normalized === "submitted" ||
    normalized === "in review"
  ) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 ${className}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <span>{label || (normalized === "submitted" ? "Submitted · Pending" : "Pending Review")}</span>
      </span>
    );
  }

  // Default neutral badge
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border border-border-subtle bg-bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-secondary ${className}`}
    >
      <Disc size={11} className="shrink-0 text-text-tertiary" />
      <span>{label || status}</span>
    </span>
  );
};

/* ─── Spinner ────────────────────────────────────────────────────── */
export const Spinner = ({ size = 24, className = "" }) => (
  <div
    className={`animate-spin rounded-full border-2 border-border-default border-t-primary-600 ${className}`}
    style={{ width: size, height: size }}
  />
);

/* ─── EmptyState ─────────────────────────────────────────────────── */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border-subtle bg-bg-surface/50 py-16 text-center">
    {Icon && (
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[10px] bg-bg-surface-raised border border-border-subtle text-text-secondary">
        <Icon size={20} />
      </div>
    )}
    <p className="type-h3 text-text-primary">{title}</p>
    {description && (
      <p className="mt-1.5 max-w-sm type-body-sm text-text-secondary">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/* ─── Alert ──────────────────────────────────────────────────────── */
export const Alert = ({ tone = "danger", children, className = "" }) => {
  const tones = {
    danger: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    info: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    // Compatibility
    clay: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    pine: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    sky: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  };
  return (
    <div className={`rounded-[6px] border px-3.5 py-3 text-sm leading-relaxed ${tones[tone] || tones.info} ${className}`}>
      {children}
    </div>
  );
};

/* ─── SectionHeader ──────────────────────────────────────────────── */
export const SectionHeader = ({ title, subtitle, action, className = "" }) => (
  <div className={`flex items-start justify-between gap-4 ${className}`}>
    <div>
      <h1 className="type-h2 text-text-primary">{title}</h1>
      {subtitle && (
        <p className="mt-1 type-body text-text-secondary">{subtitle}</p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* ─── Divider ────────────────────────────────────────────────────── */
export const Divider = ({ label, className = "" }) =>
  label ? (
    <div className={`relative flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-border-subtle" />
      <span className="type-caption text-text-tertiary">
        {label}
      </span>
      <div className="h-px flex-1 bg-border-subtle" />
    </div>
  ) : (
    <div className={`h-px bg-border-subtle ${className}`} />
  );
