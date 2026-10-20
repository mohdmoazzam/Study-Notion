// Loading indicator for buttons and small areas. `label` is announced to screen readers.
// h-6 matches a line of button text, so a button keeps its size while it shows the spinner.
export default function Spinner({ label = "Loading" }) {
  return (
    <span className="flex h-6 items-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 animate-spin">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-25" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}
