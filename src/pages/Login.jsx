import { Link } from "react-router-dom"
import LoginForm from "../components/core/Auth/LoginForm"

function Login() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-richblack-700 bg-richblack-800 p-6 shadow-2xl sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-richblack-5">Welcome back</h1>
          <p className="mt-2 text-richblack-300">
            Log in to continue your journey on StudyNotion.
          </p>
        </div>

        <LoginForm />

        <p className="mt-8 text-center text-sm text-richblack-300">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
