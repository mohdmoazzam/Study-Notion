import copy from "copy-to-clipboard"
import { toast } from "react-hot-toast"
import { FiCheck, FiCopy, FiX } from "react-icons/fi"

import { formatDateTime } from "../../../utils/dateFormatter"
import { formatAmount } from "../../../utils/formatPrice"
import { PayoutStatusBadge } from "../Dashboard/Payouts/PayoutRow"
import ReceiptButton from "../Dashboard/Payouts/ReceiptButton"

function CopyableDetail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="text-sm text-content-muted">{label}</dt>
      <dd className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-mono text-sm font-medium text-content">{value}</span>
        <button
          type="button"
          onClick={() => {
            copy(String(value))
            toast.success(`${label} copied`)
          }}
          aria-label={`Copy ${label}`}
          className="shrink-0 rounded p-1 text-content-subtle transition hover:bg-selected hover:text-accent"
        >
          <FiCopy aria-hidden="true" />
        </button>
      </dd>
    </div>
  )
}

function Destination({ payout }) {
  if (payout.method === "UPI") {
    return (
      <dl className="divide-y divide-line">
        <CopyableDetail label="UPI ID" value={payout.upiId} />
      </dl>
    )
  }
  const bank = payout.bankAccount ?? {}
  return (
    <>
      <p className="text-sm font-semibold text-content">
        {bank.bankName} <span className="font-normal text-content-muted">· {bank.branch}</span>
      </p>
      <dl className="mt-1 divide-y divide-line">
        <CopyableDetail label="Account holder" value={bank.accountHolderName} />
        <CopyableDetail label="Account number" value={bank.accountNumber} />
        <CopyableDetail label="IFSC" value={bank.ifsc} />
      </dl>
    </>
  )
}

export default function PayoutRequestCard({ payout, onProcess, onOpenReceipt }) {
  const instructor = payout.instructor
  const processed = payout.status === "Paid" || payout.status === "Rejected"

  return (
    <li className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {instructor?.image && <img src={instructor.image} alt="" className="h-10 w-10 shrink-0 rounded-full bg-page object-cover" />}
          <div className="min-w-0">
            <p className="truncate font-semibold text-content">
              {instructor ? `${instructor.firstName} ${instructor.lastName}` : "Deleted instructor"}
            </p>
            {instructor?.email && <p className="truncate text-sm text-content-muted">{instructor.email}</p>}
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-2xl font-bold tracking-tight text-content">{formatAmount(payout.amount)}</p>
          <div className="mt-1 flex items-center gap-2 sm:justify-end">
            <PayoutStatusBadge status={payout.status} />
            <span className="text-xs text-content-subtle">{formatDateTime(payout.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-page p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-content-subtle">
            Pay to · {payout.method === "UPI" ? "UPI" : "Bank transfer"}
          </p>
          <div className="mt-2">
            <Destination payout={payout} />
          </div>
        </div>

        <div className="space-y-3 text-sm">
          {payout.note && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-content-subtle">Instructor&apos;s note</p>
              <p className="mt-1 text-content">{payout.note}</p>
            </div>
          )}

          {processed && (
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-content-subtle">
                {payout.status} on {formatDateTime(payout.processedAt) ?? "—"}
              </p>
              {payout.reference && (
                <p className="text-content">
                  Reference: <span className="font-mono font-medium">{payout.reference}</span>
                </p>
              )}
              {payout.adminNote && <p className="text-content-muted">Note: {payout.adminNote}</p>}
              {payout.receipt && <ReceiptButton format={payout.receipt.format} fetchUrl={() => onOpenReceipt(payout)} />}
            </div>
          )}

          {payout.status === "Pending" && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => onProcess(payout, "Paid")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 font-semibold text-on-brand transition hover:bg-brand-hover"
              >
                <FiCheck aria-hidden="true" /> Mark as paid
              </button>
              <button
                type="button"
                onClick={() => onProcess(payout, "Rejected")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 font-semibold text-content transition hover:border-danger hover:text-danger"
              >
                <FiX aria-hidden="true" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
