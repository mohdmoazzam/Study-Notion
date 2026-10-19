// Shared look for the add/edit course steps (theme tokens, so dark mode works later).

export const inputClass = (invalid = false) =>
  `w-full rounded-lg border bg-field px-3.5 py-2.5 text-content outline-none transition placeholder:text-content-subtle focus:ring-2 ${
    invalid
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-line focus:border-brand focus:ring-brand/30"
  }`

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-2.5 font-semibold text-on-brand transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 py-2.5 font-semibold text-content transition hover:border-content-subtle disabled:cursor-not-allowed disabled:opacity-60"

export const cardClass = "rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8"

export function FormCard({ id, title, description, children }) {
  return (
    <section id={id} className={`${cardClass} scroll-mt-6`}>
      <h2 className="text-lg font-semibold text-content">{title}</h2>
      {description && <p className="mt-1 text-sm text-content-muted">{description}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  )
}

export function Field({ label, htmlFor, required = false, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-content">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : (
        hint && <span className="text-xs text-content-muted">{hint}</span>
      )}
    </div>
  )
}
