import { useCallback, useEffect, useRef, useState } from "react"
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiClock, FiInbox, FiSearch, FiXCircle } from "react-icons/fi"
import { useOutletContext, useSearchParams } from "react-router-dom"

import { inputClass } from "../../components/common/formUi"
import { StatCard } from "../../components/core/Dashboard/InstructorDashboard/Instructor"
import PayoutRequestCard from "../../components/core/SuperAdmin/PayoutRequestCard"
import ProcessPayoutDialog from "../../components/core/SuperAdmin/ProcessPayoutDialog"
import {
  SessionExpiredError,
  fetchAllPayouts,
  getReceiptUrl,
  processPayoutRequest,
} from "../../services/operations/superAdminAPI"
import { formatAmount } from "../../utils/formatPrice"

// Pending is the work queue, so it's the default tab. Filters live in the URL and are applied by the API.
const STATUS_TABS = [
  { key: "Pending", label: "Pending" },
  { key: "Paid", label: "Paid" },
  { key: "Rejected", label: "Rejected" },
  { key: "Cancelled", label: "Cancelled" },
  { key: "all", label: "All", count: "all" },
]
const SEARCH_DELAY_MS = 300

function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="space-y-4">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-56 animate-pulse rounded-2xl bg-line" />
      ))}
    </ul>
  )
}

// Payout requests section of the super admin console (rendered inside SuperAdminLayout).
function SuperAdminPayouts() {
  const { session, onSessionExpired: backToLogin } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = STATUS_TABS.some(({ key }) => key === searchParams.get("status")) ? searchParams.get("status") : "Pending"
  const search = searchParams.get("q") ?? ""
  const page = Math.max(1, Number.parseInt(searchParams.get("page"), 10) || 1)

  const [searchInput, setSearchInput] = useState(search)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [processing, setProcessing] = useState(null) // { payout, status }
  const [submitting, setSubmitting] = useState(false)
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
    fetchAllPayouts(session.token, { status: status === "all" ? undefined : status, search: search || undefined, page })
      .then((data) => {
        if (id !== requestId.current) return
        setFailed(data === null)
        if (data) setResult(data)
        setLoading(false)
      })
      .catch((error) => {
        if (error instanceof SessionExpiredError) backToLogin()
      })
  }, [session, status, search, page, reloadKey, backToLogin])

  // Processing the last request on a page can leave us past the final page.
  useEffect(() => {
    if (result && page > result.totalPages) updateParams({ page: result.totalPages > 1 ? String(result.totalPages) : "" })
  }, [result, page, updateParams])

  const submitDecision = async (formData) => {
    setSubmitting(true)
    try {
      const done = await processPayoutRequest(session.token, processing.payout._id, formData)
      if (done) {
        setProcessing(null)
        setReloadKey((key) => key + 1)
      }
    } catch (error) {
      if (error instanceof SessionExpiredError) backToLogin()
    } finally {
      setSubmitting(false)
    }
  }

  const openReceipt = async (payout) => {
    try {
      return await getReceiptUrl(session.token, payout._id)
    } catch (error) {
      if (error instanceof SessionExpiredError) backToLogin()
      return null
    }
  }

  const counts = result?.counts ?? {}
  const amounts = result?.amounts ?? {}
  const requests = result?.requests ?? []
  const totalPages = result?.totalPages ?? 1

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">Payout requests</h1>
          <p className="mt-1 text-content-muted">Pay instructors, then mark each request as paid with its receipt.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard Icon={FiClock} label="Awaiting payment" value={formatAmount(amounts.Pending)} hint={`${counts.Pending ?? 0} pending`} />
          <StatCard Icon={FiCheckCircle} label="Paid out" value={formatAmount(amounts.Paid)} hint={`${counts.Paid ?? 0} requests`} />
          <StatCard Icon={FiXCircle} label="Rejected" value={counts.Rejected ?? 0} hint={formatAmount(amounts.Rejected)} />
          <StatCard Icon={FiInbox} label="All requests" value={counts.all ?? 0} hint={`${counts.Cancelled ?? 0} cancelled by instructors`} />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div role="tablist" aria-label="Filter by status" className="flex shrink-0 overflow-x-auto rounded-xl border border-line bg-surface p-1">
            {STATUS_TABS.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={status === key}
                onClick={() => updateParams({ status: key === "Pending" ? "" : key, page: "" })}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  status === key ? "bg-brand text-on-brand" : "text-content-muted hover:text-content"
                }`}
              >
                {label}
                <span className={`text-xs ${status === key ? "opacity-80" : "text-content-subtle"}`}>{counts[count ?? key] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by instructor name or email"
              aria-label="Search by instructor name or email"
              maxLength={100}
              className={`${inputClass()} pl-9`}
            />
          </div>
        </div>

        {failed && (
          <p role="alert" className="rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger">
            Couldn&apos;t load requests.{" "}
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="underline">
              Try again
            </button>
          </p>
        )}

        {result === null ? (
          !failed && <ListSkeleton />
        ) : (
          <div aria-busy={loading} className={`transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
            {requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-selected text-xl text-accent">
                  <FiInbox aria-hidden="true" />
                </span>
                <p className="mt-3 font-semibold text-content">
                  {search
                    ? `No requests from instructors matching "${search}"`
                    : status === "Pending"
                    ? "All caught up — no pending requests"
                    : "No requests here yet"}
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {requests.map((payout) => (
                  <PayoutRequestCard
                    key={payout._id}
                    payout={payout}
                    onProcess={(target, decision) => setProcessing({ payout: target, status: decision })}
                    onOpenReceipt={openReceipt}
                  />
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
        )}
      </div>

      {processing && (
        <ProcessPayoutDialog
          payout={processing.payout}
          status={processing.status}
          submitting={submitting}
          onSubmit={submitDecision}
          onClose={() => !submitting && setProcessing(null)}
        />
      )}
    </>
  )
}

export default SuperAdminPayouts
