import { FiBookOpen } from "react-icons/fi"

// Stat tiles + "On this page" navigation (navigation is desktop-only).
function CourseGlance({ stats, navItems, activeId, onNavigate }) {
  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-content">
          <FiBookOpen aria-hidden="true" className="text-accent" /> Course at a glance
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
          {stats.map(({ Icon, label, value }) => (
            <div key={label} className="flex flex-col rounded-xl bg-page p-3">
              <Icon aria-hidden="true" className="text-lg text-accent" />
              <dt className="order-2 text-xs text-content-muted">{label}</dt>
              <dd className="order-1 mt-2 truncate font-bold text-content" title={String(value)}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <nav aria-label="On this page" className="hidden rounded-2xl border border-line bg-surface p-5 shadow-sm lg:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-content-subtle">On this page</p>
        <ul className="mt-3 space-y-1">
          {navItems.map(({ id, label }) => {
            const active = id === activeId
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => onNavigate(id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                    active ? "bg-selected font-semibold text-accent" : "text-content-muted hover:bg-page hover:text-content"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full ${active ? "bg-brand" : "bg-line"}`}
                  />
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export default CourseGlance
