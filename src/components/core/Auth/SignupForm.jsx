import { useState } from "react"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { FaChalkboardTeacher, FaUserGraduate } from "react-icons/fa"
import { FiLock, FiMail, FiUser } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { sendOtp } from "../../../services/operations/authAPI"
import { setSignupData } from "../../../slices/authSlice"
import { ACCOUNT_TYPE } from "../../../utils/constants"
import GoogleAuthButton from "./GoogleAuthButton"

const ROLE_OPTIONS = [
  { type: ACCOUNT_TYPE.STUDENT, label: "Student", description: "I want to learn", Icon: FaUserGraduate },
  { type: ACCOUNT_TYPE.INSTRUCTOR, label: "Instructor", description: "I want to teach", Icon: FaChalkboardTeacher },
]

const inputBaseClass =
  "w-full rounded-lg border bg-field py-2.5 pl-10 text-content outline-none transition placeholder:text-content-subtle focus:ring-2"

const inputStateClass = (invalid) =>
  invalid
    ? "border-danger focus:border-danger focus:ring-danger/20"
    : "border-line focus:border-brand focus:ring-brand/30"

function Field({ label, Icon, error, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-content">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle" />
        {children}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  )
}

function PasswordInput({ invalid, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <input
        required
        type={visible ? "text" : "password"}
        aria-invalid={invalid}
        className={`${inputBaseClass} ${inputStateClass(invalid)} pr-11`}
        {...inputProps}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-content-subtle transition hover:text-content"
      >
        {visible ? <AiOutlineEyeInvisible fontSize={20} /> : <AiOutlineEye fontSize={20} />}
      </button>
    </>
  )
}

function SignupForm() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading } = useSelector((state) => state.auth)

  const [accountType, setAccountType] = useState(ACCOUNT_TYPE.STUDENT)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const { firstName, lastName, email, password, confirmPassword } = formData
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }))
  }

  const handleOnSubmit = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) return

    // Kept in state for the OTP verification step, which completes the signup.
    dispatch(setSignupData({ ...formData, accountType }))
    // On success this navigates to /verify-email; on failure the form keeps its values.
    dispatch(sendOtp(email, navigate))
  }

  return (
    <form onSubmit={handleOnSubmit} className="flex w-full flex-col gap-5">
      <div role="radiogroup" aria-label="Account type" className="grid grid-cols-2 gap-3">
        {ROLE_OPTIONS.map(({ type, label, description, Icon }) => {
          const selected = accountType === type
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setAccountType(type)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-brand bg-selected ring-1 ring-brand"
                  : "border-line bg-field hover:border-content-subtle"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                  selected ? "bg-brand text-on-brand" : "bg-page text-content-muted"
                }`}
              >
                <Icon />
              </span>
              <span>
                <span className="block text-sm font-semibold text-content">{label}</span>
                <span className="block text-xs text-content-muted">{description}</span>
              </span>
            </button>
          )
        })}
      </div>

      <GoogleAuthButton accountType={accountType} text="signup_with" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="First name" Icon={FiUser}>
          <input
            required
            type="text"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={handleOnChange}
            placeholder="John"
            className={`${inputBaseClass} ${inputStateClass(false)} pr-3`}
          />
        </Field>
        <Field label="Last name" Icon={FiUser}>
          <input
            required
            type="text"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={handleOnChange}
            placeholder="Doe"
            className={`${inputBaseClass} ${inputStateClass(false)} pr-3`}
          />
        </Field>
      </div>

      <Field label="Email address" Icon={FiMail}>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={handleOnChange}
          placeholder="you@example.com"
          className={`${inputBaseClass} ${inputStateClass(false)} pr-3`}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Password" Icon={FiLock}>
          <PasswordInput
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={handleOnChange}
            placeholder="Create password"
          />
        </Field>
        <Field
          label="Confirm password"
          Icon={FiLock}
          error={passwordsMismatch ? "Passwords don't match" : undefined}
        >
          <PasswordInput
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={handleOnChange}
            placeholder="Repeat password"
            invalid={passwordsMismatch}
          />
        </Field>
      </div>

      <button
        type="submit"
        disabled={loading || passwordsMismatch}
        className="mt-2 w-full rounded-lg bg-brand py-3 font-semibold text-on-brand transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending verification code..." : `Create ${accountType} account`}
      </button>

      <p className="text-center text-xs text-content-muted">
        We&apos;ll email you a 6-digit code to verify your account.
      </p>
    </form>
  )
}

export default SignupForm
