import { useState } from "react"
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai"
import { FaChalkboardTeacher, FaUserGraduate } from "react-icons/fa"
import { FiLock, FiMail } from "react-icons/fi"
import { useDispatch, useSelector } from "react-redux"
import { Link, useNavigate } from "react-router-dom"

import { login } from "../../../services/operations/authAPI"
import { ACCOUNT_TYPE } from "../../../utils/constants"

const ROLE_OPTIONS = [
  { type: ACCOUNT_TYPE.STUDENT, label: "Student", Icon: FaUserGraduate },
  { type: ACCOUNT_TYPE.INSTRUCTOR, label: "Instructor", Icon: FaChalkboardTeacher },
]

const inputClass =
  "w-full rounded-lg border border-richblack-700 bg-richblack-900 py-3 pl-10 text-richblack-5 outline-none transition placeholder:text-richblack-400 focus:border-yellow-50 focus:ring-2 focus:ring-yellow-50/20"

function LoginForm() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { loading } = useSelector((state) => state.auth)

  const [accountType, setAccountType] = useState(ACCOUNT_TYPE.STUDENT)
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)

  const { email, password } = formData

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }))
  }

  const handleOnSubmit = (e) => {
    e.preventDefault()
    dispatch(login(email, password, accountType, navigate))
  }

  return (
    <form onSubmit={handleOnSubmit} className="flex w-full flex-col gap-5">
      <div
        role="radiogroup"
        aria-label="Log in as"
        className="grid grid-cols-2 gap-1 rounded-xl border border-richblack-700 bg-richblack-900 p-1"
      >
        {ROLE_OPTIONS.map(({ type, label, Icon }) => {
          const selected = accountType === type
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setAccountType(type)}
              className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                selected
                  ? "bg-yellow-50 text-on-brand shadow-md"
                  : "text-richblack-300 hover:text-richblack-5"
              }`}
            >
              <Icon className="text-base" />
              {label}
            </button>
          )
        })}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-richblack-50">Email address</span>
        <div className="relative">
          <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-richblack-400" />
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={handleOnChange}
            placeholder="you@example.com"
            className={`${inputClass} pr-4`}
          />
        </div>
      </label>

      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-richblack-50">Password</span>
          <Link
            to={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
            className="text-xs font-medium text-blue-100 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-richblack-400" />
          <input
            required
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={handleOnChange}
            placeholder="Enter your password"
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-richblack-300 hover:text-richblack-5"
          >
            {showPassword ? <AiOutlineEyeInvisible fontSize={20} /> : <AiOutlineEye fontSize={20} />}
          </button>
        </div>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-lg bg-yellow-50 py-3 font-semibold text-on-brand transition-all duration-200 hover:scale-[0.98] hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Logging in..." : `Log in as ${accountType}`}
      </button>
    </form>
  )
}

export default LoginForm
