import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-pine/10 text-pine dark:bg-pine-light/15 dark:text-pine-light"
      : "text-ink-soft hover:bg-surface-sunken hover:text-ink dark:text-dark-ink-soft dark:hover:bg-dark-surface-sunken dark:hover:text-dark-ink"
  }`;

const DashboardShell = ({ title, links }) => (
  <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 sm:px-6">
    <aside className="hidden w-56 shrink-0 md:block">
      <p className="mb-4 px-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-soft dark:text-dark-ink-soft">
        {title}
      </p>
      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
            <l.icon size={16} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>

    <div className="min-w-0 flex-1">
      {/* Mobile link row */}
      <nav className="mb-5 flex gap-1 overflow-x-auto pb-1 md:hidden">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                isActive
                  ? "border-pine bg-pine/10 text-pine dark:text-pine-light"
                  : "border-border text-ink-soft dark:border-dark-border dark:text-dark-ink-soft"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  </div>
);

export default DashboardShell;
