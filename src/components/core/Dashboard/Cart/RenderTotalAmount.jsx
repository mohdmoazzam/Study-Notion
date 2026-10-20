import { useState } from "react"
import { FiArrowRight, FiLock, FiTag, FiX } from "react-icons/fi"
import { Link } from "react-router-dom"

import { formatAmount, formatPrice } from "../../../../utils/formatPrice"

// "Apply coupon" box, or the applied code with a way to remove it.
function CouponField({ coupon, courseCount, applying, error, onApply, onRemove }) {
  const [code, setCode] = useState("")

  if (coupon) {
    const eligible = coupon.quote.coupon?.eligibleCourseIds.length ?? courseCount
    return (
      <div className="mt-4 rounded-lg bg-selected px-3 py-2.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-accent">
            <FiTag aria-hidden="true" className="shrink-0" /> <span className="truncate">{coupon.code}</span> applied
          </span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove coupon ${coupon.code}`}
            className="shrink-0 rounded p-1 text-content-muted transition hover:text-danger"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        {eligible < courseCount && (
          <p className="mt-1 text-xs text-content-muted">
            Applies to {eligible} of the {courseCount} courses in your cart.
          </p>
        )}
      </div>
    )
  }

  const submit = (event) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (trimmed) onApply(trimmed)
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <label htmlFor="coupon-code" className="text-sm font-medium text-content">
        Coupon code
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="coupon-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Enter code"
          maxLength={20}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "coupon-error" : undefined}
          className={`min-w-0 flex-1 rounded-lg border bg-field px-3 py-2 text-sm uppercase text-content outline-none transition placeholder:normal-case placeholder:text-content-subtle focus:ring-2 ${
            error ? "border-danger focus:ring-danger/20" : "border-line focus:border-brand focus:ring-brand/30"
          }`}
        />
        <button
          type="submit"
          disabled={applying || !code.trim()}
          className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-content transition hover:border-content-subtle disabled:cursor-not-allowed disabled:opacity-60"
        >
          {applying ? "Applying…" : "Apply"}
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </form>
  )
}

// Order summary with the checkout button. `blockedReason` disables checkout and says why.
// With a coupon applied, the subtotal, discount, fee and total come from the server's quote.
// `platformFee` is null while unknown (the server adds it either way).
export default function RenderTotalAmount({
  courses,
  subtotal,
  platformFee,
  total,
  onCheckout,
  processing,
  blockedReason,
  coupon,
  applyingCoupon,
  couponError,
  onApplyCoupon,
  onRemoveCoupon,
}) {
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

      <CouponField
        coupon={coupon}
        courseCount={courses.length}
        applying={applyingCoupon}
        error={couponError}
        onApply={onApplyCoupon}
        onRemove={onRemoveCoupon}
      />

      {(coupon || platformFee > 0) && (
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-content-muted">Subtotal</dt>
            <dd className="text-content">{formatAmount(subtotal)}</dd>
          </div>
          {coupon && (
            <div className="flex justify-between gap-3">
              <dt className="text-content-muted">Discount</dt>
              <dd className="font-medium text-accent">−{formatAmount(coupon.quote.discount)}</dd>
            </div>
          )}
          {platformFee > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-content-muted">Platform fee</dt>
              <dd className="text-content">{formatAmount(platformFee)}</dd>
            </div>
          )}
        </dl>
      )}

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
        {processing ? "Processing…" : total === 0 && coupon ? "Enroll for free" : "Checkout"}{" "}
        {!processing && <FiArrowRight aria-hidden="true" />}
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
