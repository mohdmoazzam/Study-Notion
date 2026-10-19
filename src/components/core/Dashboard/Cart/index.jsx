import { useEffect, useMemo, useState } from "react"
import { toast } from "react-hot-toast"
import { FiArrowRight, FiInfo, FiShoppingCart, FiX } from "react-icons/fi"
import { useDispatch, useSelector, useStore } from "react-redux"
import { useNavigate } from "react-router-dom"

import { refreshCartCourses } from "../../../../services/operations/cartAPI"
import { buyCourse } from "../../../../services/operations/studentFeaturesAPI"
import { removeFromCart, restoreToCart, syncCart } from "../../../../slices/cartSlice"
import { formatAmount } from "../../../../utils/formatPrice"
import LinkButton from "../../../common/LinkButton"
import RenderCartCourses from "./RenderCartCourses"
import RenderTotalAmount from "./RenderTotalAmount"

const UNDO_MS = 5000

const Cart = () => {
  const dispatch = useDispatch()
  const store = useStore()
  const navigate = useNavigate()
  const { cart, total } = useSelector((state) => state.cart)
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)
  const { paymentLoading } = useSelector((state) => state.course)
  const [starting, setStarting] = useState(false)
  const [notice, setNotice] = useState(null)

  // Courses the student already owns would make the whole order fail, so they're flagged up front.
  const ownedIds = useMemo(() => new Set((user?.courses ?? []).map((course) => String(course?._id ?? course))), [user])
  const ownedInCart = cart.filter((course) => ownedIds.has(String(course._id)))

  // The cart holds copies saved when each course was added; refresh them once so prices are current.
  useEffect(() => {
    const snapshot = store.getState().cart.cart
    if (snapshot.length === 0) return undefined
    let active = true
    refreshCartCourses(snapshot).then(({ courses, removed }) => {
      if (!active) return
      // Merge into the cart as it is now, in case something was removed while we were checking.
      const fresh = new Map(courses.map((course) => [String(course._id), course]))
      const gone = new Set(snapshot.filter((item) => !fresh.has(String(item._id))).map((item) => String(item._id)))
      const current = store.getState().cart.cart
      const next = current.filter((item) => !gone.has(String(item._id))).map((item) => fresh.get(String(item._id)) ?? item)
      const before = current.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
      const after = next.reduce((sum, item) => sum + (Number(item.price) || 0), 0)
      dispatch(syncCart(next))

      const messages = []
      if (removed.length) {
        messages.push(`${removed.join(", ")} ${removed.length === 1 ? "is" : "are"} no longer available and ${removed.length === 1 ? "was" : "were"} removed.`)
      }
      if (before !== after && next.length) messages.push(`Prices changed since you added these courses; the total is now ${formatAmount(after)}.`)
      if (messages.length) setNotice(messages.join(" "))
    })
    return () => {
      active = false
    }
  }, [store, dispatch])

  const handleRemove = (course) => {
    const index = cart.findIndex((item) => item._id === course._id)
    dispatch(removeFromCart(course._id))
    toast(
      (t) => (
        <span className="flex items-center gap-3 text-sm">
          <span>
            Removed <span className="font-semibold">{course.courseName}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              dispatch(restoreToCart({ course, index }))
              toast.dismiss(t.id)
            }}
            className="shrink-0 font-semibold text-accent hover:underline"
          >
            Undo
          </button>
        </span>
      ),
      { duration: UNDO_MS }
    )
  }

  const handleCheckout = async () => {
    setStarting(true)
    try {
      await buyCourse(token, cart.map((course) => course._id), user, navigate, dispatch)
    } finally {
      setStarting(false)
    }
  }

  const processing = starting || paymentLoading
  const blockedReason = ownedInCart.length
    ? `Remove ${ownedInCart.length === 1 ? "the course" : "the courses"} you already own to check out.`
    : null

  if (cart.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-content">Your cart</h1>
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-selected text-2xl text-accent">
            <FiShoppingCart aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-content">Your cart is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-content-muted">Add courses you&apos;re interested in and buy them together in one checkout.</p>
          <div className="mt-6">
            <LinkButton to="/">Browse courses</LinkButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-24 lg:pb-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-content">Your cart</h1>
        <p className="mt-1 text-content-muted">
          {cart.length} {cart.length === 1 ? "course" : "courses"} ready for checkout
        </p>
      </div>

      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-xl bg-selected px-4 py-3 text-sm text-content">
          <FiInfo aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
          <p className="flex-1">{notice}</p>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="shrink-0 text-content-muted hover:text-content">
            <FiX aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <RenderCartCourses courses={cart} ownedIds={ownedIds} onRemove={handleRemove} />
        <div className="lg:sticky lg:top-0">
          <RenderTotalAmount
            courses={cart}
            total={total}
            onCheckout={handleCheckout}
            processing={processing}
            blockedReason={blockedReason}
          />
        </div>
      </div>

      {/* Phones and tablets: keep the total and checkout in reach while scrolling. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <p className="text-xs text-content-muted">Total</p>
            <p className="text-lg font-bold text-content">{formatAmount(total)}</p>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={processing || Boolean(blockedReason)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 font-semibold text-on-brand transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {processing ? "Processing…" : "Checkout"} {!processing && <FiArrowRight aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart
