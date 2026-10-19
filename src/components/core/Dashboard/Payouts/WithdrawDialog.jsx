import { useCallback, useEffect, useState } from "react"
import { FiCheckCircle, FiCreditCard } from "react-icons/fi"
import { useSelector } from "react-redux"

import { lookupIfsc } from "../../../../services/operations/payoutAPI"
import { formatAmount } from "../../../../utils/formatPrice"
import { Field, inputClass, primaryButtonClass, secondaryButtonClass } from "../../../common/formUi"
import Dialog from "../../../common/Dialog"

// Mirrors the server's checks so most mistakes are caught before submitting.
const UPI_ID = /^[a-z0-9._-]{2,256}@[a-z]{2,64}$/
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/
const ACCOUNT_NUMBER = /^\d{9,18}$/
const MAX_NOTE_LENGTH = 300
const IFSC_LOOKUP_DELAY_MS = 300

// The server verifies the IFSC again on submit; this lookup only gives early feedback.
const branchError = (branch) => {
  if (branch?.status === "notFound") return "No bank branch found for this IFSC code"
  if (branch?.status === "found" && !branch.details.canReceiveTransfers)
    return "This branch can't receive NEFT/IMPS transfers. Use another account"
  return undefined
}

const METHODS = [
  { key: "UPI", label: "UPI" },
  { key: "Bank", label: "Bank transfer" },
]

const validate = (form, { available, minAmount }) => {
  const errors = {}
  const amount = Number(form.amount)
  if (!form.amount || !Number.isInteger(amount)) errors.amount = "Enter an amount in whole rupees"
  else if (amount < minAmount) errors.amount = `The minimum withdrawal is ${formatAmount(minAmount)}`
  else if (amount > available) errors.amount = `You can withdraw up to ${formatAmount(available)}`

  if (form.method === "UPI") {
    if (!UPI_ID.test(form.upiId.trim().toLowerCase())) errors.upiId = "Enter a valid UPI ID, e.g. name@bank"
  } else {
    if (form.accountHolderName.trim().length < 2) errors.accountHolderName = "Enter the account holder's name"
    if (!ACCOUNT_NUMBER.test(form.accountNumber.replace(/\s+/g, ""))) errors.accountNumber = "Account number must be 9 to 18 digits"
    if (!IFSC.test(form.ifsc.trim().toUpperCase())) errors.ifsc = "Enter a valid IFSC code, e.g. HDFC0001234"
  }
  return errors
}

const toRequestBody = (form) => ({
  amount: Number(form.amount),
  method: form.method,
  note: form.note.trim() || undefined,
  ...(form.method === "UPI"
    ? { upiId: form.upiId.trim().toLowerCase() }
    : {
        bankAccount: {
          accountHolderName: form.accountHolderName.trim(),
          accountNumber: form.accountNumber.replace(/\s+/g, ""),
          ifsc: form.ifsc.trim().toUpperCase(),
        },
      }),
})

export default function WithdrawDialog({ summary, submitting, onSubmit, onClose }) {
  const [form, setForm] = useState({
    amount: String(Math.floor(summary.available)),
    method: "UPI",
    upiId: "",
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    note: "",
  })
  const [errors, setErrors] = useState({})
  // { status: "loading" | "found" | "notFound" | "error", details } for the IFSC currently typed
  const [branch, setBranch] = useState(null)
  const { token } = useSelector((state) => state.auth)

  const ifscCode = form.ifsc.trim().toUpperCase()
  useEffect(() => {
    if (form.method !== "Bank" || !IFSC.test(ifscCode)) {
      setBranch(null)
      return undefined
    }
    const controller = new AbortController()
    setBranch({ status: "loading" })
    const timer = setTimeout(() => {
      lookupIfsc(token, ifscCode, controller.signal).then((result) => {
        if (controller.signal.aborted) return
        if (result === null) setBranch({ status: "error" })
        else setBranch(result.notFound ? { status: "notFound" } : { status: "found", details: result.details })
      })
    }, IFSC_LOOKUP_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [form.method, ifscCode, token])

  const ifscError = errors.ifsc ?? branchError(branch)

  const setField = useCallback((name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    const found = validate(form, summary)
    if (form.method === "Bank" && !found.ifsc && branchError(branch)) found.ifsc = branchError(branch)
    setErrors(found)
    if (Object.keys(found).length === 0) onSubmit(toRequestBody(form))
  }

  const input = (name, props) => (
    <input
      id={`withdraw-${name}`}
      value={form[name]}
      onChange={(event) => setField(name, event.target.value)}
      aria-invalid={Boolean(errors[name])}
      className={inputClass(Boolean(errors[name]))}
      {...props}
    />
  )

  return (
    <Dialog
      id="withdraw"
      as="form"
      onSubmit={handleSubmit}
      Icon={FiCreditCard}
      title="Request a withdrawal"
      busy={submitting}
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </>
      }
    >
      <p className="text-sm text-content-muted">
        Available to withdraw: <span className="font-semibold text-content">{formatAmount(summary.available)}</span>.
        Requests are usually processed within 3–5 business days.
      </p>

      <div className="mt-5 space-y-4">
        <Field
          label="Amount (₹)"
          htmlFor="withdraw-amount"
          required
          error={errors.amount}
          hint={`Minimum ${formatAmount(summary.minAmount)}`}
        >
          <div className="flex gap-2">
            {input("amount", { type: "number", inputMode: "numeric", min: summary.minAmount, step: 1, autoFocus: true })}
            <button
              type="button"
              onClick={() => setField("amount", String(Math.floor(summary.available)))}
              className="shrink-0 rounded-lg px-3 text-sm font-semibold text-accent transition hover:bg-selected"
            >
              Max
            </button>
          </div>
        </Field>

        <div>
          <p className="text-sm font-medium text-content">Payout method</p>
          <div role="radiogroup" aria-label="Payout method" className="mt-1.5 flex rounded-xl border border-line bg-page p-1">
            {METHODS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={form.method === key}
                onClick={() => setField("method", key)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  form.method === key ? "bg-brand text-on-brand" : "text-content-muted hover:text-content"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {form.method === "UPI" ? (
          <Field label="UPI ID" htmlFor="withdraw-upiId" required error={errors.upiId}>
            {input("upiId", { placeholder: "name@bank", autoComplete: "off", maxLength: 320 })}
          </Field>
        ) : (
          <>
            <Field label="Account holder name" htmlFor="withdraw-accountHolderName" required error={errors.accountHolderName}>
              {input("accountHolderName", { autoComplete: "name", maxLength: 100 })}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Account number" htmlFor="withdraw-accountNumber" required error={errors.accountNumber}>
                {input("accountNumber", { inputMode: "numeric", autoComplete: "off", maxLength: 22 })}
              </Field>
              <Field label="IFSC code" htmlFor="withdraw-ifsc" required error={ifscError}>
                {input("ifsc", {
                  placeholder: "HDFC0001234",
                  autoComplete: "off",
                  maxLength: 11,
                  "aria-invalid": Boolean(ifscError),
                  "aria-describedby": "withdraw-branch",
                  className: `${inputClass(Boolean(ifscError))} uppercase`,
                })}
              </Field>
            </div>
            <p id="withdraw-branch" aria-live="polite" className="text-sm empty:hidden">
              {branch?.status === "loading" && <span className="text-content-muted">Checking IFSC…</span>}
              {branch?.status === "error" && (
                <span className="text-content-muted">Couldn&apos;t check this IFSC now; it will be verified when you submit.</span>
              )}
              {branch?.status === "found" && branch.details.canReceiveTransfers && (
                <span className="flex items-start gap-1.5 text-content">
                  <FiCheckCircle aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
                  <span>
                    <span className="font-semibold">{branch.details.bank}</span> · {branch.details.branch}, {branch.details.city}
                  </span>
                </span>
              )}
            </p>
          </>
        )}

        <Field label="Note" htmlFor="withdraw-note" hint="Optional, visible to our payouts team">
          <textarea
            id="withdraw-note"
            value={form.note}
            onChange={(event) => setField("note", event.target.value)}
            rows={2}
            maxLength={MAX_NOTE_LENGTH}
            className={`${inputClass()} resize-none`}
          />
        </Field>
      </div>
    </Dialog>
  )
}
