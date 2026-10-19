import { useEffect, useState } from "react"
import { FiArrowLeft, FiKey, FiMail } from "react-icons/fi"
import { Link, useSearchParams } from "react-router-dom"

import { inputClass, primaryButtonClass } from "../components/common/formUi"
import { requestPasswordReset } from "../services/operations/authAPI"

const RESEND_COOLDOWN_SECONDS = 30
// Matches RESET_TOKEN_TTL_MS on the server.
const LINK_VALID_MINUTES = 5
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function BackToLogin() {
  return (
    <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-content-muted transition hover:text-content">
      <FiArrowLeft aria-hidden="true" /> Back to log in
    </Link>
  )
}

export const ForgotPassword = () => {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [sentTo, setSentTo] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null) // { message, notFound }
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const send = async (address) => {
    setSending(true)
    setError(null)
    const result = await requestPasswordReset(address)
    setSending(false)
    if (result.ok) {
      setSentTo(address)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } else {
      setError({ message: result.error, notFound: result.notFound })
    }
    return result.ok
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const address = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(address)) {
      setError({ message: "Enter a valid email address" })
      return
    }
    send(address)
  }

  const useDifferentEmail = () => {
    setSentTo(null)
    setError(null)
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        {sentTo ? (
          <div aria-live="polite">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-selected text-2xl text-accent">
              <FiMail aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-content">Check your inbox</h1>
            <p className="mt-2 text-content-muted">
              We sent a password reset link to <span className="font-semibold text-content">{sentTo}</span>. The link works for{" "}
              {LINK_VALID_MINUTES} minutes.
            </p>
            <p className="mt-4 rounded-lg bg-page px-3 py-2 text-sm text-content-muted">
              Can&apos;t find it? Check your spam or promotions folder.
            </p>

            {error && (
              <p role="alert" className="mt-4 text-sm font-medium text-danger">
                {error.message}
              </p>
            )}

            <button
              type="button"
              onClick={() => send(sentTo)}
              disabled={sending || cooldown > 0}
              className={`${primaryButtonClass} mt-6 w-full`}
            >
              {sending ? "Sending…" : cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend email"}
            </button>
            <button
              type="button"
              onClick={useDifferentEmail}
              className="mt-3 w-full text-center text-sm font-semibold text-accent hover:underline"
            >
              Use a different email
            </button>
            <div className="text-center">
              <BackToLogin />
            </div>
          </div>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-selected text-2xl text-accent">
              <FiKey aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-content">Forgot your password?</h1>
            <p className="mt-2 text-content-muted">Enter the email you signed up with and we&apos;ll send you a link to reset it.</p>

            <form onSubmit={handleSubmit} noValidate className="mt-6">
              <label htmlFor="forgot-email" className="text-sm font-medium text-content">
                Email address
              </label>
              <div className="relative mt-1.5">
                <FiMail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="you@example.com"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "forgot-email-error" : undefined}
                  className={`${inputClass(Boolean(error))} pl-10`}
                />
              </div>
              {error && (
                <p id="forgot-email-error" role="alert" className="mt-1.5 text-sm text-danger">
                  {error.notFound ? (
                    <>
                      No account uses this email. Check the spelling or{" "}
                      <Link to="/signup" className="font-semibold underline">
                        create an account
                      </Link>
                      .
                    </>
                  ) : (
                    error.message
                  )}
                </p>
              )}

              <button type="submit" disabled={sending} className={`${primaryButtonClass} mt-6 w-full`}>
                {sending ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <div className="text-center">
              <BackToLogin />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
