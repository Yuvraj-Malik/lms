import { NavLink, Outlet } from "react-router-dom";

const DashboardShell = ({ title, links }) => (
  <div className="mx-auto flex max-w-7xl gap-0 px-4 py-8 sm:px-6 lg:gap-8">
    {/* Sidebar */}
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-20 space-y-6">
        <p className="px-4 type-caption text-text-tertiary">
          {title}
        </p>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-[8px] px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-600/15 dark:text-primary-400 font-semibold"
                    : "text-text-secondary hover:bg-bg-surface-raised hover:text-text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <l.icon
                    size={16}
                    className={`shrink-0 transition-colors ${
                      isActive
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-text-tertiary group-hover:text-text-secondary"
                    }`}
                  />
                  <span>{l.label}</span>
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
      <nav className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `inline-flex shrink-0 items-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-primary-500/30 bg-primary-50 text-primary-700 dark:bg-primary-600/15 dark:text-primary-400"
                  : "border-border-subtle bg-bg-surface text-text-secondary hover:border-border-default hover:text-text-primary"
              }`
            }
          >
            <l.icon size={13} />
            <span>{l.label}</span>
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
