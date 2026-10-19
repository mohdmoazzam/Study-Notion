import { FiCheckCircle, FiClock, FiSlash, FiXCircle } from "react-icons/fi"
import { useSelector } from "react-redux"

import { getMyReceiptUrl } from "../../../../services/operations/payoutAPI"
import { formatDateTime, formattedDate } from "../../../../utils/dateFormatter"
import { formatAmount } from "../../../../utils/formatPrice"
import ReceiptButton from "./ReceiptButton"

const STATUS_STYLES = {
  Pending: { Icon: FiClock, label: "Pending", className: "bg-brand/15 text-content" },
  Paid: { Icon: FiCheckCircle, label: "Paid", className: "bg-selected text-accent" },
  Rejected: { Icon: FiXCircle, label: "Rejected", className: "bg-danger/10 text-danger" },
  Cancelled: { Icon: FiSlash, label: "Cancelled", className: "bg-page text-content-muted ring-1 ring-line" },
}

export function PayoutStatusBadge({ status }) {
  const { Icon, label, className } = STATUS_STYLES[status] ?? STATUS_STYLES.Pending
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      <Icon aria-hidden="true" /> {label}
    </span>
  )
}

const describeDestination = ({ method, upiId, bankAccount }) =>
  method === "UPI"
    ? `UPI · ${upiId}`
    : `${bankAccount?.bankName ?? "Bank"} · ${bankAccount?.accountNumber} · ${bankAccount?.ifsc}`

export default function PayoutRow({ payout, onCancel }) {
  const { token } = useSelector((state) => state.auth)
  const processed = payout.status === "Paid" || payout.status === "Rejected"

  return (
    <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-semibold text-content">{formatAmount(payout.amount)}</p>
          <PayoutStatusBadge status={payout.status} />
        </div>
        <p className="mt-1 break-words text-sm text-content-muted">{describeDestination(payout)}</p>
        <p className="mt-1 text-xs text-content-subtle">Requested {formatDateTime(payout.createdAt)}</p>

        {payout.note && <p className="mt-2 text-sm text-content-muted">Your note: {payout.note}</p>}

        {processed && (
          <div className="mt-3 space-y-1 rounded-lg bg-page px-3 py-2 text-sm">
            <p className="text-content-muted">
              {payout.status === "Paid" ? "Paid" : "Rejected"} on {formattedDate(payout.processedAt) ?? "—"}
            </p>
            {payout.reference && (
              <p className="text-content">
                Reference: <span className="font-mono font-medium">{payout.reference}</span>
              </p>
            )}
            {payout.adminNote && <p className="text-content-muted">Note from StudyNotion: {payout.adminNote}</p>}
            {payout.receipt && (
              <ReceiptButton format={payout.receipt.format} fetchUrl={() => getMyReceiptUrl(token, payout._id)} />
            )}
          </div>
        )}
      </div>

      {payout.status === "Pending" && (
        <button
          type="button"
          onClick={() => onCancel(payout)}
          className="self-start rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-content transition hover:border-danger hover:text-danger"
        >
          Cancel request
        </button>
      )}
    </li>
  )
}
