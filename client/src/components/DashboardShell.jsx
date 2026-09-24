import { NavLink, Outlet } from "react-router-dom";

const DashboardShell = ({ title, links }) => (
  <div className="mx-auto flex max-w-7xl gap-0 px-4 py-6 sm:px-6 lg:gap-8">
    {/* Sidebar */}
    <aside className="hidden w-52 shrink-0 lg:block">
      <div className="sticky top-20">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-widest text-ink-muted dark:text-dark-ink-muted">
          {title}
        </p>
        <nav className="flex flex-col gap-0.5">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-pine/8 text-pine dark:bg-pine-lighter/10 dark:text-pine-lighter"
                    : "text-ink-soft hover:bg-surface-sunken hover:text-ink dark:text-dark-ink-soft dark:hover:bg-dark-surface-raised dark:hover:text-dark-ink"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <l.icon
                    size={15}
                    className={`shrink-0 transition-colors ${
                      isActive ? "text-pine dark:text-pine-lighter" : "text-ink-muted group-hover:text-ink-soft dark:text-dark-ink-muted"
                    }`}
                  />
                  {l.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>

    {/* Main content */}
    <div className="min-w-0 flex-1">
      {/* Mobile pill tabs */}
      <nav className="mb-6 flex gap-1.5 overflow-x-auto pb-0.5 lg:hidden">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-pine/30 bg-pine-bg text-pine dark:border-pine-lighter/30 dark:bg-pine-lighter/10 dark:text-pine-lighter"
                  : "border-border text-ink-soft hover:border-border-strong hover:text-ink dark:border-dark-border dark:text-dark-ink-soft dark:hover:text-dark-ink"
              }`
            }
          >
            <l.icon size={12} />
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="animate-fade-up">
        <Outlet />
      </div>
    </div>
  </div>
);

export default DashboardShell;
