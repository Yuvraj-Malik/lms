import { createContext, forwardRef, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { X, Loader2, Search, ChevronLeft } from "lucide-react";
import { initials } from "../lib/format.js";

const cx = (...c) => c.filter(Boolean).join(" ");
export { cx };

/* ── Buttons ─────────────────────────────────────────────────────────── */

const BTN_VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent-hover dark:text-[#0c1a15] border border-transparent",
  secondary: "bg-surface text-fg border border-line-strong hover:bg-subtle",
  ghost: "text-fg-muted hover:text-fg hover:bg-subtle border border-transparent",
  danger: "bg-danger text-white hover:opacity-90 border border-transparent dark:text-[#1a0d0b]",
  "danger-ghost": "text-danger hover:bg-danger-soft border border-transparent",
};
const BTN_SIZES = {
  sm: "h-8 px-2.5 text-[13px] gap-1.5",
  md: "h-9 px-3.5 text-sm gap-2",
  lg: "h-10 px-4 text-sm gap-2",
};

export const Button = forwardRef(function Button(
  { variant = "secondary", size = "md", loading = false, icon: Icon, to, href, className, children, disabled, type = "button", ...rest },
  ref
) {
  const classes = cx(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50",
    BTN_VARIANTS[variant],
    BTN_SIZES[size],
    className
  );
  const content = (
    <>
      {loading ? <Loader2 size={15} className="animate-spin" /> : Icon ? <Icon size={15} strokeWidth={2} /> : null}
      {children}
    </>
  );
  if (to) return <Link ref={ref} to={to} className={classes} {...rest}>{content}</Link>;
  if (href) return <a ref={ref} href={href} className={classes} {...rest}>{content}</a>;
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={classes} {...rest}>
      {content}
    </button>
  );
});

export const IconButton = ({ icon: Icon, label, className, size = 16, ...rest }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cx(
      "inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-subtle hover:text-fg disabled:opacity-40",
      className
    )}
    {...rest}
  >
    <Icon size={size} />
  </button>
);

/* ── Form controls ───────────────────────────────────────────────────── */

const controlBase =
  "w-full rounded-md border border-line-strong bg-surface text-sm text-fg placeholder:text-fg-subtle outline-none transition-[border-color,box-shadow] focus:border-accent focus:ring-[3px] focus:ring-accent/15 disabled:bg-subtle disabled:text-fg-muted";

export const Field = ({ label, hint, error, children, htmlFor, required, className, aside }) => (
  <div className={cx("flex flex-col gap-1.5", className)}>
    {label && (
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg">
          {label}
          {required && <span className="ml-0.5 text-fg-subtle">*</span>}
        </label>
        {aside}
      </div>
    )}
    {children}
    {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-fg-muted">{hint}</p> : null}
  </div>
);

export const Input = forwardRef(function Input({ label, hint, error, className, inputClassName, required, aside, ...rest }, ref) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} required={required} className={className} aside={aside}>
      <input
        id={id}
        ref={ref}
        required={required}
        aria-invalid={!!error}
        className={cx(controlBase, "h-9 px-3", error && "border-danger", inputClassName)}
        {...rest}
      />
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, hint, error, className, rows = 4, required, ...rest }, ref) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} required={required} className={className}>
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        required={required}
        className={cx(controlBase, "resize-y px-3 py-2 leading-relaxed", error && "border-danger")}
        {...rest}
      />
    </Field>
  );
});

export const Select = forwardRef(function Select({ label, hint, error, className, children, required, selectClassName, ...rest }, ref) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} required={required} className={className}>
      <select
        id={id}
        ref={ref}
        required={required}
        className={cx(
          controlBase.replace("w-full", /(^|\s)w-/.test(selectClassName || "") ? "" : "w-full"),
          /(^|\s)h-\d/.test(selectClassName || "") ? "" : "h-9",
          "px-2.5 pr-8",
          selectClassName
        )}
        {...rest}
      >
        {children}
      </select>
    </Field>
  );
});

export const SearchInput = ({ value, onChange, placeholder = "Search", className }) => (
  <div className={cx("relative", className)}>
    <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cx(controlBase, "h-9 pl-8 pr-3")}
    />
  </div>
);

export const Switch = ({ checked, onChange, label, description, disabled }) => {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && <span className="mt-0.5 block text-[13px] text-fg-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-accent" : "bg-line-strong"
        )}
      >
        <span className={cx("inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
      </button>
    </div>
  );
};

/* ── Layout primitives ───────────────────────────────────────────────── */

export const Panel = ({ title, description, actions, children, className, bodyClassName, flush = false, footer }) => (
  <section className={cx("flex flex-col rounded-lg border border-line bg-surface", className)}>
    {(title || actions) && (
      <header className="flex min-h-[52px] items-center justify-between gap-4 border-b border-line px-5 py-2.5">
        <div className="min-w-0">
          {title && <h2 className="text-[15px] font-semibold text-fg">{title}</h2>}
          {description && <p className="mt-0.5 text-[13px] text-fg-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={cx("flex-1", !flush && "p-5", bodyClassName)}>{children}</div>
    {footer && <footer className="border-t border-line px-5 py-3">{footer}</footer>}
  </section>
);

export const PageHeader = ({ title, description, actions, back, eyebrow, children }) => (
  <div className="mb-6">
    {back && (
      <Link to={back.to} className="mb-3 inline-flex items-center gap-1 text-[13px] text-fg-muted hover:text-fg">
        <ChevronLeft size={15} /> {back.label}
      </Link>
    )}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-[13px] text-fg-muted">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

export const Tabs = ({ tabs, value, onChange, className }) => (
  <div className={cx("flex gap-1 overflow-x-auto border-b border-line", className)} role="tablist">
    {tabs.map((t) => {
      const active = t.value === value;
      return (
        <button
          key={t.value}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(t.value)}
          className={cx(
            "relative -mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-sm transition-colors",
            active ? "border-fg font-medium text-fg" : "border-transparent text-fg-muted hover:text-fg"
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cx("tabular rounded px-1.5 text-xs", active ? "bg-muted text-fg" : "bg-subtle text-fg-muted")}>{t.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

export const Segmented = ({ options, value, onChange }) => (
  <div className="inline-flex rounded-md border border-line-strong bg-surface p-0.5">
    {options.map((o) => (
      <button
        key={o.value}
        onClick={() => onChange(o.value)}
        className={cx(
          "rounded-[5px] px-2.5 py-1 text-[13px] transition-colors",
          value === o.value ? "bg-muted font-medium text-fg" : "text-fg-muted hover:text-fg"
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/* ── Tables ──────────────────────────────────────────────────────────── */

export const Table = ({ children, className }) => (
  <div className={cx("overflow-x-auto", className)}>
    <table className="w-full border-collapse text-sm">{children}</table>
  </div>
);
export const Th = ({ children, className, align = "left" }) => (
  <th
    className={cx(
      "whitespace-nowrap border-b border-line bg-subtle/60 px-4 py-2 text-xs font-medium text-fg-muted",
      align === "right" ? "text-right" : "text-left",
      className
    )}
  >
    {children}
  </th>
);
export const Td = ({ children, className, align = "left", ...rest }) => (
  <td className={cx("border-b border-line px-4 py-3 align-middle", align === "right" && "text-right", className)} {...rest}>
    {children}
  </td>
);

/* ── Display ─────────────────────────────────────────────────────────── */

const TONES = {
  neutral: "bg-subtle text-fg-muted border-line",
  accent: "bg-accent-soft text-accent-fg border-transparent",
  ok: "bg-ok-soft text-ok border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  info: "bg-info-soft text-info border-transparent",
};

export const Badge = ({ tone = "neutral", children, className, dot }) => (
  <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-1.5 py-px text-xs font-medium", TONES[tone], className)}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

// One place that maps every status the API returns to a label + colour
const STATUS = {
  todo: ["To do", "neutral"],
  overdue: ["Overdue", "danger"],
  submitted: ["Submitted", "info"],
  late: ["Submitted late", "warn"],
  graded: ["Graded", "ok"],
  active: ["In progress", "info"],
  completed: ["Completed", "ok"],
  "not-started": ["Not started", "neutral"],
  published: ["Published", "ok"],
  draft: ["Draft", "neutral"],
  deactivated: ["Deactivated", "danger"],
  enabled: ["Active", "ok"],
};
export const StatusBadge = ({ status, label }) => {
  const [text, tone] = STATUS[status] || [status, "neutral"];
  return (
    <Badge tone={tone} dot>
      {label || text}
    </Badge>
  );
};

export const ProgressBar = ({ value = 0, className, size = "md", tone = "accent" }) => {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx("w-full overflow-hidden rounded-full bg-muted", size === "sm" ? "h-1" : "h-1.5", className)}
    >
      <div className={cx("h-full rounded-full transition-[width] duration-500", tone === "ok" ? "bg-ok" : "bg-accent")} style={{ width: `${v}%` }} />
    </div>
  );
};

export const Stat = ({ label, value, hint, to }) => {
  const body = (
    <>
      <div className="text-[13px] text-fg-muted">{label}</div>
      <div className="tabular mt-1 text-2xl font-semibold tracking-tight text-fg">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-fg-subtle">{hint}</div>}
    </>
  );
  return to ? (
    <Link to={to} className="block rounded-lg border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong">
      {body}
    </Link>
  ) : (
    <div className="rounded-lg border border-line bg-surface px-4 py-3.5">{body}</div>
  );
};

export const Avatar = ({ user, size = 32, className }) => {
  const src = user?.avatar;
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  if (src && !broken) {
    return <img src={src} alt="" style={style} onError={() => setBroken(true)} className={cx("shrink-0 rounded-full object-cover", className)} />;
  }
  return (
    <span style={style} className={cx("inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-fg-muted", className)}>
      {initials(user?.name)}
    </span>
  );
};

export const Spinner = ({ className }) => <Loader2 size={18} className={cx("animate-spin text-fg-subtle", className)} />;

export const PageLoader = () => (
  <div className="space-y-4" aria-busy="true">
    <div className="skeleton h-7 w-56" />
    <div className="skeleton h-4 w-80" />
    <div className="grid gap-3 pt-2 sm:grid-cols-2 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-[78px]" />
      ))}
    </div>
    <div className="skeleton h-64" />
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cx("flex flex-col items-center px-6 py-12 text-center", className)}>
    {Icon && <Icon size={22} className="mb-3 text-fg-subtle" strokeWidth={1.6} />}
    <p className="text-sm font-medium text-fg">{title}</p>
    {description && <p className="mt-1 max-w-sm text-[13px] text-fg-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Notice = ({ tone = "info", title, children, className, action }) => (
  <div className={cx("flex items-start justify-between gap-4 rounded-md border px-3.5 py-2.5 text-[13px]", TONES[tone], className)}>
    <div>
      {title && <div className="font-medium">{title}</div>}
      {children && <div className={cx(title && "mt-0.5", "text-fg-muted")}>{children}</div>}
    </div>
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="rounded-lg border border-line bg-surface">
    <EmptyState
      title="This page couldn't load"
      description={message}
      action={onRetry && <Button onClick={() => onRetry()}>Try again</Button>}
    />
  </div>
);

export const KeyValue = ({ items }) => (
  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
    {items.filter(Boolean).map(([k, v]) => (
      <div key={k} className="contents">
        <dt className="text-fg-muted">{k}</dt>
        <dd className="m-0 text-fg">{v}</dd>
      </div>
    ))}
  </dl>
);

/* ── Dialog ──────────────────────────────────────────────────────────── */

export const Dialog = ({ open, onClose, title, description, children, footer, width = 480 }) => {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => panel.current?.querySelector("input,textarea,select,button[data-autofocus]")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[10vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }} className="animate-pop w-full rounded-lg bg-surface shadow-pop">
        <div className="flex items-start justify-between gap-4 px-5 pb-1 pt-4">
          <div>
            <h2 className="text-base font-semibold text-fg">{title}</h2>
            {description && <p className="mt-1 text-[13px] text-fg-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2 -mt-1" />
        </div>
        {children ? <div className="px-5 py-4">{children}</div> : <div className="h-3" />}
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

/* ── Toasts + confirm dialog (app-wide) ─────────────────────────────── */

const FeedbackContext = createContext(null);

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const toast = useCallback((message, tone = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "danger" ? 6000 : 3500);
  }, []);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setConfirmState({ ...opts, resolve });
      }),
    []
  );

  const close = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="animate-pop pointer-events-auto flex items-start gap-2.5 rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm text-fg shadow-pop">
              <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", t.tone === "danger" ? "bg-danger" : t.tone === "warn" ? "bg-warn" : "bg-ok")} />
              <span className="min-w-0 flex-1">{t.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
      <Dialog
        open={!!confirmState}
        onClose={() => close(false)}
        title={confirmState?.title}
        description={confirmState?.description}
        width={420}
        footer={
          <>
            <Button onClick={() => close(false)}>Cancel</Button>
            <Button data-autofocus variant={confirmState?.danger ? "danger" : "primary"} onClick={() => close(true)}>
              {confirmState?.confirmLabel || "Confirm"}
            </Button>
          </>
        }
      >
        {confirmState?.body || null}
      </Dialog>
    </FeedbackContext.Provider>
  );
};

export const useFeedback = () => useContext(FeedbackContext);
