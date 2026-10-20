import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FiArrowRight, FiCheck, FiLock, FiShoppingBag, FiTag, FiX } from "react-icons/fi"
import { useSelector } from "react-redux"

import usePlatformFee from "../../../hooks/usePlatformFee"
import { fetchOffers } from "../../../services/operations/couponAPI"
import { applyCoupon } from "../../../services/operations/studentFeaturesAPI"
import { formatAmount, formatPrice } from "../../../utils/formatPrice"
import Dialog from "../../common/Dialog"
import { primaryButtonClass, secondaryButtonClass } from "../../common/formUi"
import OfferExpiry from "./OfferExpiry"

export const describeOffer = ({ discountType, value }) =>
  discountType === "percent" ? `${value}% off` : `${formatAmount(value)} off`

function OfferRow({ offer, best, applied, busy, onApply, onRemove }) {

  return (
    <li
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
        applied ? "border-brand bg-selected" : "border-dashed border-line"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-sm font-semibold text-content">{offer.code}</span>
          <span className="text-sm text-accent">{describeOffer(offer)}</span>
          {best && <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-content">Best offer</span>}
        </p>
        <p className="mt-0.5 text-xs text-content-muted">
          Save {formatAmount(offer.discount)}
          {offer.expiresAt && (
            <>
              {" · "}
              <OfferExpiry expiresAt={offer.expiresAt} />
            </>
          )}
          {offer.usesLeft !== undefined && ` · ${offer.usesLeft} ${offer.usesLeft === 1 ? "use" : "uses"} left`}
        </p>
      </div>
      {applied ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          className="shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-content-muted transition hover:text-danger disabled:opacity-60"
        >
          Remove
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onApply(offer.code)}
          disabled={busy}
          className="shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-accent transition hover:bg-selected disabled:opacity-60"
        >
          Apply
        </button>
      )}
    </li>
  )
}

// Order summary shown before Razorpay opens: what's being bought, the offers that apply, a box for
// any other code, and the total. Every price shown here is calculated by the server.
// `onConfirm(code)` proceeds to payment; `onClose(code)` cancels. Both report the coupon left applied.
export default function CheckoutDialog({ courses, initialCode, processing, onConfirm, onClose }) {
  const { token } = useSelector((state) => state.auth)
  // Keyed on the ids so a new array with the same courses doesn't refetch.
  const courseKey = courses.map((course) => course._id).join(",")
  const courseIds = useMemo(() => courseKey.split(","), [courseKey])
  const [offers, setOffers] = useState(null)
  const [applied, setApplied] = useState(null) // { code, quote }
  const [applying, setApplying] = useState(null) // code being applied
  const [error, setError] = useState(null)
  const [codeInput, setCodeInput] = useState("")
  const requestId = useRef(0)

  useEffect(() => {
    let active = true
    fetchOffers(courseIds).then((list) => active && setOffers(list))
    return () => {
      active = false
    }
  }, [courseIds])

  const apply = useCallback(
    async (code) => {
      const id = ++requestId.current
      setApplying(code)
      setError(null)
      const { quote, error: reason } = await applyCoupon(token, courseIds, code)
      if (id !== requestId.current) return
      setApplying(null)
      if (quote) {
        setApplied({ code: quote.coupon?.code ?? code, quote })
        setCodeInput("")
      } else {
        setError(reason)
      }
    },
    [token, courseIds]
  )

  // A coupon already applied in the cart (or picked on the course page) is checked again here.
  useEffect(() => {
    if (initialCode) apply(initialCode)
  }, [initialCode, apply])

  const remove = () => {
    requestId.current++
    setApplying(null)
    setApplied(null)
    setError(null)
  }

  const submitCode = (event) => {
    event.preventDefault()
    const code = codeInput.trim()
    if (code) apply(code)
  }

  const subtotal = courses.reduce((sum, course) => sum + (Number(course.price) || 0), 0)
  const fallbackFee = usePlatformFee(subtotal)
  // With a coupon the server's quote has every figure; without one, the fee comes from the checkout config
  // (null if it couldn't load; the server adds it either way and Razorpay shows the final amount).
  const platformFee = applied ? applied.quote.platformFee ?? 0 : fallbackFee
  const total = applied ? applied.quote.total : platformFee === null ? null : subtotal + platformFee
  const appliedCode = applied?.code
  const busy = Boolean(applying) || processing
  const appliedIsListed = offers?.some((offer) => offer.code === appliedCode)
  const close = () => onClose(appliedCode)

  return (
    <Dialog
      id="checkout"
      Icon={FiShoppingBag}
      title="Order summary"
      busy={processing}
      onClose={close}
      actions={
        <>
          <button type="button" onClick={close} disabled={processing} className={`${secondaryButtonClass} text-sm`}>
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(appliedCode)} disabled={busy} className={`${primaryButtonClass} text-sm`}>
            {processing
              ? "Processing…"
              : total === 0 && applied
              ? "Enroll for free"
              : total === null
              ? "Continue to payment"
              : `Pay ${formatAmount(total)}`}
            {!processing && <FiArrowRight aria-hidden="true" />}
          </button>
        </>
      }
    >
      <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
        {courses.map((course) => {
          const discounted = applied?.quote.coupon?.eligibleCourseIds.includes(String(course._id))
          return (
            <li key={course._id} className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-content">
                <span className="line-clamp-2">{course.courseName}</span>
                {discounted && <span className="text-xs text-accent">{appliedCode} applied</span>}
              </span>
              <span className="shrink-0 text-content">{formatPrice(course.price)}</span>
            </li>
          )
        })}
      </ul>

      <div className="mt-5">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-content">
          <FiTag aria-hidden="true" className="text-accent" /> Offers
        </p>
        {offers === null ? (
          <div aria-hidden="true" className="mt-2 h-14 animate-pulse rounded-lg bg-line" />
        ) : offers.length === 0 ? (
          <p className="mt-1 text-sm text-content-muted">No offers right now.</p>
        ) : (
          <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
            {offers.map((offer, index) => (
              <OfferRow
                key={offer._id}
                offer={offer}
                best={index === 0 && offers.length > 1}
                applied={offer.code === appliedCode}
                busy={busy}
                onApply={apply}
                onRemove={remove}
              />
            ))}
          </ul>
        )}

        {applied && !appliedIsListed && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-brand bg-selected px-3 py-2.5 text-sm">
            <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-accent">
              <FiCheck aria-hidden="true" className="shrink-0" /> <span className="truncate font-mono">{appliedCode}</span> applied
            </span>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              aria-label={`Remove coupon ${appliedCode}`}
              className="shrink-0 rounded p-1 text-content-muted transition hover:text-danger"
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
        )}

        <form onSubmit={submitCode} className="mt-3 flex gap-2">
          <input
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
            placeholder="Have another code?"
            aria-label="Coupon code"
            maxLength={20}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-lg border border-line bg-field px-3 py-2 text-sm uppercase text-content outline-none transition placeholder:normal-case placeholder:text-content-subtle focus:border-brand focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            disabled={busy || !codeInput.trim()}
            className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-content transition hover:border-content-subtle disabled:cursor-not-allowed disabled:opacity-60"
          >
            {applying && applying === codeInput.trim() ? "Applying…" : "Apply"}
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </div>

      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-content-muted">Subtotal</dt>
          <dd className="text-content">{formatAmount(applied ? applied.quote.subtotal : subtotal)}</dd>
        </div>
        {applied && (
          <div className="flex justify-between gap-3">
            <dt className="text-content-muted">
              Discount <span className="font-mono">({appliedCode})</span>
            </dt>
            <dd className="font-medium text-accent">−{formatAmount(applied.quote.discount)}</dd>
          </div>
        )}
        {platformFee !== 0 && (
          <div className="flex justify-between gap-3">
            <dt className="text-content-muted">Platform fee</dt>
            <dd className="text-content">{platformFee === null ? "Added at payment" : formatAmount(platformFee)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3 pt-1">
          <dt className="font-semibold text-content">Total</dt>
          <dd className="text-2xl font-bold tracking-tight text-content">{total === null ? "—" : formatAmount(total)}</dd>
        </div>
      </dl>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-content-subtle">
        <FiLock aria-hidden="true" /> {total === 0 && applied ? "No payment needed" : "Secure payment via Razorpay"} · Lifetime access
      </p>
    </Dialog>
  )
}
