import { useState } from "react"
import { FiCheckCircle, FiUploadCloud, FiXCircle } from "react-icons/fi"

import { formatAmount } from "../../../utils/formatPrice"
import { Field, inputClass, primaryButtonClass, secondaryButtonClass } from "../../common/formUi"
import Dialog from "../../common/Dialog"

const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024
const MAX_NOTE_LENGTH = 300

const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

// `status` is "Paid" (reference + receipt required) or "Rejected" (reason required).
export default function ProcessPayoutDialog({ payout, status, submitting, onSubmit, onClose }) {
  const paid = status === "Paid"
  const [reference, setReference] = useState("")
  const [receipt, setReceipt] = useState(null)
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState({})

  const name = payout.instructor ? `${payout.instructor.firstName} ${payout.instructor.lastName}` : "this instructor"

  const chooseReceipt = (file) => {
    if (!file) return
    if (!RECEIPT_TYPES.includes(file.type)) {
      setErrors((current) => ({ ...current, receipt: "Upload a JPG, PNG, WebP or PDF file" }))
      return
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setErrors((current) => ({ ...current, receipt: "Receipt must be 5 MB or smaller" }))
      return
    }
    setReceipt(file)
    setErrors((current) => ({ ...current, receipt: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const found = {}
    if (paid && !reference.trim()) found.reference = "Enter the transaction reference (UTR / UPI ref no.)"
    if (paid && !receipt) found.receipt = "Upload the payment receipt"
    if (!paid && !note.trim()) found.note = "Give a reason; the instructor will see it"
    setErrors(found)
    if (Object.keys(found).length) return

    const formData = new FormData()
    formData.append("status", status)
    if (paid) {
      formData.append("reference", reference.trim())
      formData.append("receipt", receipt)
    }
    if (note.trim()) formData.append("adminNote", note.trim())
    onSubmit(formData)
  }

  return (
    <Dialog
      id="process-payout"
      as="form"
      onSubmit={handleSubmit}
      Icon={paid ? FiCheckCircle : FiXCircle}
      tone={paid ? "accent" : "danger"}
      title={paid ? "Mark as paid" : "Reject request"}
      busy={submitting}
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass}>
            Cancel
          </button>
          {paid ? (
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? "Uploading…" : "Confirm payment"}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Rejecting…" : "Reject request"}
            </button>
          )}
        </>
      }
    >
      <p className="text-sm text-content-muted">
        {paid ? (
          <>
            Confirm you&apos;ve sent <span className="font-semibold text-content">{formatAmount(payout.amount)}</span> to {name}.
            They&apos;ll be emailed the reference and receipt.
          </>
        ) : (
          <>
            The <span className="font-semibold text-content">{formatAmount(payout.amount)}</span> goes back to {name}&apos;s
            available balance, and they&apos;ll be emailed your reason.
          </>
        )}
      </p>

      <div className="mt-5 space-y-4">
        {paid && (
          <>
            <Field label="Transaction reference" htmlFor="process-reference" required error={errors.reference} hint="UTR, IMPS or UPI reference number">
              <input
                id="process-reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                maxLength={100}
                autoFocus
                autoComplete="off"
                className={inputClass(Boolean(errors.reference))}
              />
            </Field>

            <Field label="Receipt / proof of payment" htmlFor="process-receipt" required error={errors.receipt} hint="JPG, PNG, WebP or PDF, up to 5 MB">
              <label
                htmlFor="process-receipt"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  chooseReceipt(event.dataTransfer.files?.[0])
                }}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center transition hover:border-brand ${
                  errors.receipt ? "border-danger" : "border-line"
                }`}
              >
                <FiUploadCloud aria-hidden="true" className="text-2xl text-accent" />
                {receipt ? (
                  <span className="max-w-full truncate text-sm font-medium text-content">
                    {receipt.name} <span className="text-content-muted">({formatSize(receipt.size)})</span>
                  </span>
                ) : (
                  <span className="text-sm text-content-muted">
                    <span className="font-semibold text-accent">Choose a file</span> or drag it here
                  </span>
                )}
              </label>
              <input
                id="process-receipt"
                type="file"
                accept={RECEIPT_TYPES.join(",")}
                onChange={(event) => chooseReceipt(event.target.files?.[0])}
                className="sr-only"
              />
            </Field>
          </>
        )}

        <Field
          label={paid ? "Note" : "Reason for rejection"}
          htmlFor="process-note"
          required={!paid}
          error={errors.note}
          hint={paid ? "Optional, shown to the instructor" : "Shown to the instructor"}
        >
          <textarea
            id="process-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            autoFocus={!paid}
            className={`${inputClass(Boolean(errors.note))} resize-none`}
          />
        </Field>
      </div>
    </Dialog>
  )
}
