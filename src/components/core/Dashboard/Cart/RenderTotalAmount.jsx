import { FiArrowRight, FiLock } from "react-icons/fi"
import { Link } from "react-router-dom"

import { formatAmount, formatPrice } from "../../../../utils/formatPrice"

// Order summary with the checkout button. `blockedReason` disables checkout and says why.
export default function RenderTotalAmount({ courses, total, onCheckout, processing, blockedReason }) {
  return (
    <section aria-labelledby="order-summary" className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 id="order-summary" className="font-semibold text-content">
        Order summary
      </h2>

      <ul className="mt-4 space-y-2 text-sm">
        {courses.map((course) => (
          <li key={course._id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate text-content-muted">{course.courseName}</span>
            <span className="shrink-0 text-content">{formatPrice(course.price)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-medium text-content">
          Total{" "}
          <span className="text-sm font-normal text-content-muted">
            ({courses.length} {courses.length === 1 ? "course" : "courses"})
          </span>
        </span>
        <span className="text-2xl font-bold tracking-tight text-content">{formatAmount(total)}</span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={processing || Boolean(blockedReason)}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 font-semibold text-on-brand transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing ? "Processing…" : "Checkout"} {!processing && <FiArrowRight aria-hidden="true" />}
      </button>
      {blockedReason && <p className="mt-2 text-center text-xs font-medium text-danger">{blockedReason}</p>}

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-content-subtle">
        <FiLock aria-hidden="true" /> Secure payment via Razorpay · Lifetime access
      </p>

      <Link to="/" className="mt-4 block text-center text-sm font-semibold text-accent hover:underline">
        Continue browsing
      </Link>
    </section>
  )
}
