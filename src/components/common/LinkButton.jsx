import { Link } from "react-router-dom"

const VARIANTS = {
  primary: "bg-brand text-on-brand hover:bg-brand-hover",
  secondary: "border border-line bg-surface text-content hover:border-content-subtle",
}

function LinkButton({ to, variant = "primary", className = "", children }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}

export default LinkButton
