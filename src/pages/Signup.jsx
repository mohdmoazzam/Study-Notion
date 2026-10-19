import { Link } from "react-router-dom"
import SignupForm from "../components/core/Auth/SignupForm"

function Signup() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-content">Create your account</h1>
          <p className="mt-2 text-content-muted">
            Join StudyNotion and start learning or teaching today.
          </p>
        </div>

        <SignupForm />

        <p className="mt-8 text-center text-sm text-content-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-link hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
