import { useEffect } from "react"

// Modal shell (icon, title, body, actions) shared by the app's dialogs. Closes on Escape or backdrop click unless an action is in progress.
export default function Dialog({ id, Icon, tone = "accent", title, busy, onClose, children, actions, as = "div", onSubmit }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [busy, onClose])

  const Container = as

  return (
    <div
      className="fixed inset-0 z-[1000] !mt-0 grid place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}
    >
      <Container
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onSubmit={onSubmit}
        noValidate={as === "form" ? true : undefined}
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-xl"
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${
            tone === "danger" ? "bg-danger/10 text-danger" : "bg-selected text-accent"
          }`}
        >
          <Icon aria-hidden="true" />
        </span>
        <h2 id={`${id}-title`} className="mt-4 text-lg font-semibold text-content">
          {title}
        </h2>
        <div className="mt-2">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{actions}</div>
      </Container>
    </div>
  )
}
