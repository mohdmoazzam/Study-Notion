import { useCallback, useEffect, useRef, useState } from "react"
import { FiAlertTriangle, FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiInbox, FiX } from "react-icons/fi"
import { useSelector } from "react-redux"
import { useSearchParams } from "react-router-dom"

import { cancelPayout, fetchPayouts, requestPayout } from "../../../../services/operations/payoutAPI"
import { formatAmount } from "../../../../utils/formatPrice"
import { primaryButtonClass, secondaryButtonClass } from "../../../common/formUi"
import { StatCard } from "../InstructorDashboard/Instructor"
import Dialog from "../../../common/Dialog"
import PayoutRow from "./PayoutRow"
import WithdrawDialog from "./WithdrawDialog"

// The status filter is applied by the API and lives in the URL so reloads and back/forward keep it.
const STATUS_TABS = [
  { key: "", label: "All", count: "all" },
  { key: "Pending", label: "Pending", count: "Pending" },
  { key: "Paid", label: "Paid", count: "Paid" },
  { key: "Rejected", label: "Rejected", count: "Rejected" },
  { key: "Cancelled", label: "Cancelled", count: "Cancelled" },
]

function PageSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-line" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-line" />
    </div>
  )
}

// Why the withdraw button is disabled, or null when the instructor can withdraw.
const blockedReason = (summary) => {
  if (summary.hasPendingRequest) return "You can raise a new request once your pending one is processed."
  if (summary.available < summary.minAmount)
    return `You need at least ${formatAmount(summary.minAmount)} available to request a withdrawal.`
  return null
}

const Payouts = () => {
  const { token } = useSelector((state) => state.auth)
  const [searchParams, setSearchParams] = useSearchParams()
  const status = STATUS_TABS.some(({ key }) => key && key === searchParams.get("status")) ? searchParams.get("status") : ""

  // null until the first response; afterwards the last successful result stays visible while refetching
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [withdrawing, setWithdrawing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pendingCancel, setPendingCancel] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    const id = ++requestId.current
    setLoading(true)
    fetchPayouts(token, { status: status || undefined }).then((data) => {
      if (id !== requestId.current) return // a newer request superseded this one
      setFailed(data === null)
      if (data) setResult(data)
      setLoading(false)
    })
  }, [token, status, reloadKey])

  const reload = () => setReloadKey((key) => key + 1)
  const setStatus = (key) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        key ? next.set("status", key) : next.delete("status")
        return next
      },
      { replace: true }
    )

  const closeWithdraw = useCallback(() => setWithdrawing(false), [])
  const closeCancel = useCallback(() => setPendingCancel(null), [])

  const submitWithdrawal = async (body) => {
    setSubmitting(true)
    const created = await requestPayout(token, body)
    setSubmitting(false)
    if (created) {
      setWithdrawing(false)
      reload() // refresh the balance, counts and list
    }
  }

  const confirmCancel = async () => {
    setCancelling(true)
    const cancelled = await cancelPayout(token, pendingCancel._id)
    setCancelling(false)
    if (cancelled) {
      setPendingCancel(null)
      reload()
    }
  }

  const summary = result?.summary
  const counts = result?.counts ?? {}
  const requests = result?.requests ?? []
  const reason = summary ? blockedReason(summary) : null

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content">Payouts</h1>
          <p className="mt-1 text-content-muted">Withdraw your earnings and track your requests.</p>
        </div>
        {summary && (
          <button
            type="button"
            onClick={() => setWithdrawing(true)}
            disabled={Boolean(reason)}
            title={reason ?? undefined}
            className={`${primaryButtonClass} self-start text-sm sm:self-auto`}
          >
            <FiCreditCard aria-hidden="true" /> Request withdrawal
          </button>
        )}
      </div>

      {result === null ? (
        failed ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
            <p className="font-semibold text-content">Couldn&apos;t load your payouts</p>
            <button type="button" onClick={reload} className="mt-3 text-sm font-semibold text-accent hover:underline">
              Try again
            </button>
          </div>
        ) : (
          <PageSkeleton />
        )
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard Icon={FiCreditCard} label="Available balance" value={formatAmount(summary.available)} hint="Ready to withdraw" />
            <StatCard Icon={FiClock} label="Pending" value={formatAmount(summary.pending)} hint="Awaiting processing" />
            <StatCard Icon={FiCheckCircle} label="Withdrawn" value={formatAmount(summary.withdrawn)} hint="Paid out to you" />
            <StatCard Icon={FiDollarSign} label="Total earnings" value={formatAmount(summary.totalEarnings)} hint="From all enrollments" />
          </div>

          {reason && (
            <p className="flex items-start gap-2 rounded-lg bg-selected px-4 py-3 text-sm text-content">
              <FiClock aria-hidden="true" className="mt-0.5 shrink-0 text-accent" /> {reason}
            </p>
          )}

          <section className="rounded-2xl border border-line bg-surface shadow-sm">
            <div className="flex flex-col gap-3 border-b border-line px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="text-lg font-semibold text-content">Withdrawal requests</h2>
              <div role="tablist" aria-label="Filter by status" className="flex overflow-x-auto rounded-xl border border-line bg-page p-1">
                {STATUS_TABS.map(({ key, label, count }) => (
                  <button
                    key={label}
                    type="button"
                    role="tab"
                    aria-selected={status === key}
                    onClick={() => setStatus(key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      status === key ? "bg-brand text-on-brand" : "text-content-muted hover:text-content"
                    }`}
                  >
                    {label}
                    <span className={`text-xs ${status === key ? "opacity-80" : "text-content-subtle"}`}>{counts[count] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {failed && (
              <p role="alert" className="mx-6 mt-4 rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger">
                Couldn&apos;t update the list.{" "}
                <button type="button" onClick={reload} className="underline">
                  Try again
                </button>
              </p>
            )}

            <div aria-busy={loading} className={`transition-opacity ${loading ? "pointer-events-none opacity-60" : ""}`}>
              {requests.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-selected text-xl text-accent">
                    <FiInbox aria-hidden="true" />
                  </span>
                  <p className="mt-3 font-semibold text-content">
                    {status ? `No ${status.toLowerCase()} requests` : "No withdrawal requests yet"}
                  </p>
                  {status ? (
                    <button
                      type="button"
                      onClick={() => setStatus("")}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                    >
                      <FiX aria-hidden="true" /> Clear filter
                    </button>
                  ) : (
                    <p className="mt-1 text-sm text-content-muted">Your requests and their status will show up here.</p>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {requests.map((payout) => (
                    <PayoutRow key={payout._id} payout={payout} onCancel={setPendingCancel} />
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}

      {withdrawing && summary && (
        <WithdrawDialog summary={summary} submitting={submitting} onSubmit={submitWithdrawal} onClose={closeWithdraw} />
      )}

      {pendingCancel && (
        <Dialog
          id="cancel-payout"
          Icon={FiAlertTriangle}
          tone="danger"
          title="Cancel this request?"
          busy={cancelling}
          onClose={closeCancel}
          actions={
            <>
              <button type="button" onClick={closeCancel} disabled={cancelling} className={secondaryButtonClass} autoFocus>
                Keep request
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={cancelling}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? "Cancelling…" : "Cancel request"}
              </button>
            </>
          }
        >
          <p className="text-sm text-content-muted">
            Your request for <span className="font-semibold text-content">{formatAmount(pendingCancel.amount)}</span> will be
            withdrawn and the amount returns to your available balance.
          </p>
        </Dialog>
      )}
    </div>
  )
}

export default Payouts
