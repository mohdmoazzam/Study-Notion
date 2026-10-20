import { useState } from "react"
import { FiArrowLeft, FiCheck, FiCheckCircle, FiClock, FiEye, FiEyeOff, FiLock } from "react-icons/fi"
import { Link, useParams } from "react-router-dom"

import { inputClass, primaryButtonClass } from "../components/common/formUi"
import LinkButton from "../components/common/LinkButton"
import Spinner from "../components/common/Spinner"
import { resetPassword } from "../services/operations/authAPI"

const MIN_LENGTH = 8

// The first rule is required; the others raise the strength score.
const RULES = [
  { label: `At least ${MIN_LENGTH} characters`, test: (value) => value.length >= MIN_LENGTH, required: true },
  { label: "Upper and lower case letters", test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: "A number", test: (value) => /\d/.test(value) },
  { label: "A symbol (e.g. ! @ # $)", test: (value) => /[^A-Za-z0-9]/.test(value) },
]

const STRENGTH = [
  { label: "Too short", bar: "bg-danger", text: "text-danger" },
  { label: "Weak", bar: "bg-danger", text: "text-danger" },
  { label: "Fair", bar: "bg-brand", text: "text-content-muted" },
  { label: "Good", bar: "bg-accent", text: "text-accent" },
  { label: "Strong", bar: "bg-accent", text: "text-accent" },
]

// 0 when too short, then 1–4 by how many rules pass.
const scorePassword = (value) => (value.length < MIN_LENGTH ? 0 : RULES.filter((rule) => rule.test(value)).length)

function Card({ children }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">{children}</div>
    </div>
  )
}

function PasswordField({ id, label, value, onChange, show, onToggle, invalid, describedBy, autoFocus }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-content">
        {label}
      </label>
      <div className="relative mt-1.5">
        <FiLock aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" />
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          autoFocus={autoFocus}
          value={value}
          onChange={onChange}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={`${inputClass(invalid)} pl-10 pr-11`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={show}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-content-subtle transition hover:text-content"
        >
          {show ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

const UpdatePassword = () => {
  const { id: token } = useParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState("form") // "form" | "done" | "expired"

  const score = scorePassword(password)
  const strength = STRENGTH[score]
  const longEnough = RULES[0].test(password)
  const matches = confirmPassword.length > 0 && confirmPassword === password
  const showMismatch = confirmPassword.length > 0 && !matches && (submitted || confirmPassword.length >= password.length)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitted(true)
    setError(null)
    if (!longEnough || !matches) return

    setSaving(true)
    const result = await resetPassword(password, confirmPassword, token)
    setSaving(false)
    if (result.ok) setStatus("done")
    else if (result.expired) setStatus("expired")
    else setError(result.error)
  }

  if (status === "done") {
    return (
      <Card>
        <div aria-live="polite">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-selected text-2xl text-accent">
            <FiCheckCircle aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-content">Password updated</h1>
          <p className="mt-2 text-content-muted">Your password has been changed. Log in with your new password to continue.</p>
          <LinkButton to="/login" className="mt-6 w-full">
            Log in
          </LinkButton>
        </div>
      </Card>
    )
  }

  if (status === "expired") {
    return (
      <Card>
        <div aria-live="polite">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger/10 text-2xl text-danger">
            <FiClock aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-content">This link has expired</h1>
          <p className="mt-2 text-content-muted">
            Password reset links work for 5 minutes and can only be used once. Request a new one and use it right away.
          </p>
          <LinkButton to="/forgot-password" className="mt-6 w-full">
            Request a new link
          </LinkButton>
          <div className="text-center">
            <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-content-muted transition hover:text-content">
              <FiArrowLeft aria-hidden="true" /> Back to log in
            </Link>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-selected text-2xl text-accent">
        <FiLock aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-content">Choose a new password</h1>
      <p className="mt-2 text-content-muted">Almost done. Pick a password you haven&apos;t used before.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <PasswordField
            id="new-password"
            label="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            show={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
            invalid={submitted && !longEnough}
            describedBy="password-strength password-rules"
            autoFocus
          />

          {password && (
            <div id="password-strength" className="mt-2 flex items-center gap-3" aria-live="polite">
              <div className="flex flex-1 gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <span key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${score >= step ? strength.bar : "bg-line"}`} />
                ))}
              </div>
              <span className={`w-16 shrink-0 text-right text-xs font-semibold ${strength.text}`}>{strength.label}</span>
            </div>
          )}

          <ul id="password-rules" className="mt-3 space-y-1">
            {RULES.map((rule) => {
              const passed = rule.test(password)
              const failedRequired = rule.required && submitted && !passed
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-2 text-xs ${
                    passed ? "text-accent" : failedRequired ? "text-danger" : "text-content-muted"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      passed ? "bg-selected" : "ring-1 ring-line"
                    }`}
                  >
                    {passed && <FiCheck className="text-[10px]" />}
                  </span>
                  {rule.label}
                  {rule.required ? "" : " (recommended)"}
                  <span className="sr-only">{passed ? " — done" : " — not yet"}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <PasswordField
            id="confirm-password"
            label="Confirm password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            show={showConfirm}
            onToggle={() => setShowConfirm((value) => !value)}
            invalid={showMismatch || (submitted && !confirmPassword)}
            describedBy="confirm-feedback"
          />
          <p id="confirm-feedback" aria-live="polite" className="mt-1.5 min-h-[1.25rem] text-sm">
            {matches ? (
              <span className="inline-flex items-center gap-1 text-accent">
                <FiCheck aria-hidden="true" /> Passwords match
              </span>
            ) : showMismatch ? (
              <span className="text-danger">Passwords don&apos;t match</span>
            ) : submitted && !confirmPassword ? (
              <span className="text-danger">Re-enter your new password</span>
            ) : null}
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving} aria-busy={saving} className={`${primaryButtonClass} w-full`}>
          {saving ? <Spinner label="Saving" /> : "Update password"}
        </button>
      </form>

      <div className="text-center">
        <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-content-muted transition hover:text-content">
          <FiArrowLeft aria-hidden="true" /> Back to log in
        </Link>
      </div>
    </Card>
  )
}

export default UpdatePassword
