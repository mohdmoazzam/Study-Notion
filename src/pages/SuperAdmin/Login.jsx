import { useState } from "react"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { FiLock, FiMail, FiShield } from "react-icons/fi"
import { Navigate, useNavigate } from "react-router-dom"

import Logo from "../../components/common/Logo"
import { inputClass, primaryButtonClass } from "../../components/common/formUi"
import { superAdminLogin } from "../../services/operations/superAdminAPI"
import { getSuperAdminSession } from "../../utils/superAdminSession"

function SuperAdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (getSuperAdminSession()) return <Navigate to="/super-admin" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    const session = await superAdminLogin(email, password)
    setSubmitting(false)
    if (session) navigate("/super-admin", { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-md">
        <Logo className="mx-auto h-8 w-auto" />
        <div className="mt-8 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-selected text-xl text-accent">
            <FiShield aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-content">Super admin console</h1>
          <p className="mt-1 text-sm text-content-muted">Restricted access. Sign in to manage instructor payouts.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-content">Email</span>
              <div className="relative">
                <FiMail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" />
                <input
                  required
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`${inputClass()} pl-10`}
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-content">Password</span>
              <div className="relative">
                <FiLock aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass()} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((shown) => !shown)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-content-subtle hover:text-content"
                >
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </button>
              </div>
            </label>

            <button type="submit" disabled={submitting} className={`${primaryButtonClass} w-full`}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminLogin
