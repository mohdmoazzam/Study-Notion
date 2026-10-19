import copy from "copy-to-clipboard"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { FiBookOpen, FiCheckCircle, FiChevronLeft, FiChevronRight, FiCopy, FiCreditCard, FiPlayCircle, FiSearch, FiShoppingBag, FiX } from "react-icons/fi"
import { useSelector } from "react-redux"
import { Link, useSearchParams } from "react-router-dom"

import { fetchPurchaseHistory } from "../../../services/operations/studentFeaturesAPI"
import { formatDateTime } from "../../../utils/dateFormatter"
import { formatAmount, formatPrice } from "../../../utils/formatPrice"
import { inputClass } from "../../common/formUi"
import LinkButton from "../../common/LinkButton"
import { StatCard } from "./InstructorDashboard/Instructor"

const SEARCH_DELAY_MS = 300

function CopyId({ label, value }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="text-content-subtle">{label}</span>
      <span className="truncate font-mono text-content">{value}</span>
      <button
        type="button"
        onClick={() => {
          copy(value)
          toast.success(`${label} copied`)
        }}
        aria-label={`Copy ${label}`}
        className="shrink-0 rounded p-1 text-content-subtle transition hover:bg-selected hover:text-accent"
      >
        <FiCopy aria-hidden="true" />
      </button>
    </span>
  )
}

function OrderCard({ payment }) {
  return (
    <li className="rounded-2xl border border-line bg-surface shadow-sm">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-content">{formatDateTime(payment.createdAt)}</p>
          <p className="mt-0.5 text-sm text-content-muted">
            {payment.courses.length} {payment.courses.length === 1 ? "course" : "courses"}
          </p>
        </div>
        <div className="flex items-center gap-3 sm:flex-row-reverse">
          <p className="text-xl font-bold tracking-tight text-content">{formatAmount(payment.amount)}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-selected px-2.5 py-0.5 text-xs font-semibold text-accent">
            <FiCheckCircle aria-hidden="true" /> Paid
          </span>
        </div>
      </div>

      <ul className="divide-y divide-line">
        {payment.courses.map((item) => (
          <li key={String(item.course)} className="flex items-center gap-4 px-5 py-3">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt="" className="aspect-video w-20 shrink-0 rounded-lg bg-page object-cover" />
            ) : (
              <span className="flex aspect-video w-20 shrink-0 items-center justify-center rounded-lg bg-page text-content-subtle">
                <FiBookOpen aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-content">{item.courseName}</p>
              <p className="mt-0.5 text-xs text-content-muted">{formatPrice(item.price)}</p>
            </div>
            <Link
              to={`/view-course/${item.course}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-accent transition hover:bg-selected"
            >
              <FiPlayCircle aria-hidden="true" /> <span className="hidden sm:inline">Go to course</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1 rounded-b-2xl bg-page px-5 py-3 text-xs sm:flex-row sm:flex-wrap sm:gap-x-6">
        <CopyId label="Order ID" value={payment.razorpayOrderId} />
        <CopyId label="Payment ID" value={payment.razorpayPaymentId} />
      </div>
    </li>
  )
}

const PurchaseHistory = () => {
  const { token } = useSelector((state) => state.auth)
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get("q") ?? ""
  const page = Math.max(1, Number.parseInt(searchParams.get("page"), 10) || 1)

  const [searchInput, setSearchInput] = useState(search)
  // null until the first response; afterwards the last successful result stays visible while refetching
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const requestId = useRef(0)

  const updateParams = useCallback(
    (changes) =>
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
          return next
        },
        { replace: true }
      ),
    [setSearchParams]
  )

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === search) return undefined
    const timer = setTimeout(() => updateParams({ q: trimmed, page: "" }), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [searchInput, search, updateParams])

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    fetchPurchaseHistory(token, { search: search || undefined, page }).then((data) => {
      if (id !== requestId.current) return
      setFailed(data === null)
      if (data) setResult(data)
      setLoading(false)
    })
  }, [token, search, page, reloadKey])

  const summary = result?.summary
  const payments = result?.payments ?? []
  const totalPages = result?.totalPages ?? 1
  const hasNoPurchases = summary?.orders === 0

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-content">Purchase history</h1>
        <p className="mt-1 text-content-muted">Your orders and payment details.</p>
      </div>

      {result === null ? (
        failed ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
            <p className="font-semibold text-content">Couldn&apos;t load your purchases</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 text-sm font-semibold text-accent hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <div aria-hidden="true" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-line" />
              ))}
            </div>
            <div className="h-56 animate-pulse rounded-2xl bg-line" />
          </div>
        )
      ) : hasNoPurchases ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-selected text-2xl text-accent">
            <FiShoppingBag aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-content">No purchases yet</h2>
          <p className="mx-auto mt-2 max-w-md text-content-muted">When you buy a course, its receipt details will show up here.</p>
          <div className="mt-6">
            <LinkButton to="/">Browse courses</LinkButton>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <StatCard Icon={FiCreditCard} label="Total spent" value={formatAmount(summary.totalSpent)} hint="Across all orders" />
            <StatCard Icon={FiShoppingBag} label="Orders" value={summary.orders} />
            <StatCard Icon={FiBookOpen} label="Courses bought" value={summary.courses} />
          </div>

          <div className="relative">
            <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by course name"
              aria-label="Search purchases by course name"
              maxLength={100}
              className={`${inputClass()} pl-9`}
            />
          </div>

          {failed && (
            <p role="alert" className="rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger">
              Couldn&apos;t update the list.{" "}
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="underline">
                Try again
              </button>
            </p>
          )}

          <div aria-busy={loading} className={`transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
            {payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
                <p className="font-semibold text-content">No orders with a course matching &quot;{search}&quot;</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("")
                    updateParams({ q: "", page: "" })
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  <FiX aria-hidden="true" /> Clear search
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {payments.map((payment) => (
                  <OrderCard key={payment._id} payment={payment} />
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => updateParams({ page: page - 1 > 1 ? String(page - 1) : "" })}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-content disabled:opacity-40"
                >
                  <FiChevronLeft aria-hidden="true" /> Previous
                </button>
                <span className="text-sm text-content-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => updateParams({ page: String(page + 1) })}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-content disabled:opacity-40"
                >
                  Next <FiChevronRight aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default PurchaseHistory
