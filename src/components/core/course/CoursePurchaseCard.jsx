import { FiArrowRight, FiPlayCircle, FiShare2, FiShoppingCart } from "react-icons/fi"

import { formatPrice } from "../../../utils/formatPrice"

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-on-brand shadow-md shadow-brand/30 transition hover:-translate-y-0.5 hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 font-semibold text-content transition hover:border-content-subtle"

// Vertical purchase card for the hero's right-hand column.
function CoursePurchaseCard({ course, isEnrolled, paymentLoading, onBuy, onAddToCart, onGoToCourse, onShare }) {
  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand/40 via-transparent to-blue-100/40 blur-2xl"
      />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <img src={course.thumbnail} alt="" className="aspect-video w-full object-cover" />

        <div className="p-6">
          {isEnrolled ? (
            <>
              <p className="text-lg font-bold text-content">You&apos;re enrolled 🎉</p>
              <p className="text-sm text-content-muted">Pick up right where you left off.</p>
            </>
          ) : (
            <>
              <p className="text-4xl font-extrabold tracking-tight text-content">{formatPrice(course.price)}</p>
              <p className="mt-1 text-sm text-content-muted">One-time payment &middot; Lifetime access</p>
            </>
          )}

          <div className="mt-5 flex flex-col gap-3">
            {isEnrolled ? (
              <button type="button" onClick={onGoToCourse} className={`${primaryButton} w-full`}>
                <FiPlayCircle aria-hidden="true" /> Go to course
              </button>
            ) : (
              <>
                <button type="button" onClick={onBuy} disabled={paymentLoading} className={`${primaryButton} w-full`}>
                  {paymentLoading ? "Processing..." : "Buy now"}
                  {!paymentLoading && <FiArrowRight aria-hidden="true" />}
                </button>
                <button type="button" onClick={onAddToCart} className={`${secondaryButton} w-full`}>
                  <FiShoppingCart aria-hidden="true" /> Add to cart
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onShare}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-content-muted transition hover:text-content"
          >
            <FiShare2 aria-hidden="true" /> Share this course
          </button>
        </div>
      </div>
    </div>
  )
}

export default CoursePurchaseCard
