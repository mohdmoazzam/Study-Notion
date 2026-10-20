import { useEffect, useRef } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"

import { googleLogin } from "../../../services/operations/authAPI"

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID
const SCRIPT_SRC = "https://accounts.google.com/gsi/client"

let scriptPromise
function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = SCRIPT_SRC
      script.async = true
      script.onload = resolve
      script.onerror = () => {
        scriptPromise = undefined
        reject(new Error("Could not load Google sign-in"))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}

// Google's own "Sign in with Google" button. Renders nothing while REACT_APP_GOOGLE_CLIENT_ID is unset.
// `text` is "signin_with" or "signup_with".
function GoogleAuthButton({ accountType, text = "signin_with" }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const containerRef = useRef(null)

  // Google keeps the first callback it's given, so it reads the current role through a ref.
  const accountTypeRef = useRef(accountType)
  accountTypeRef.current = accountType

  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false

    loadGoogleScript()
      .then(() => {
        const container = containerRef.current
        if (cancelled || !container) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: ({ credential }) =>
            dispatch(googleLogin(credential, accountTypeRef.current, navigate)),
        })
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text,
          logo_alignment: "center",
          // Google caps the button at 400px.
          width: Math.min(400, container.offsetWidth),
        })
      })
      .catch((error) => console.log("GOOGLE SCRIPT ERROR............", error))

    return () => {
      cancelled = true
    }
  }, [dispatch, navigate, text])

  if (!CLIENT_ID) return null

  return (
    <>
      <div ref={containerRef} className="flex min-h-[44px] w-full justify-center" />
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-richblack-400">
        <span className="h-px flex-1 bg-richblack-700" />
        or continue with email
        <span className="h-px flex-1 bg-richblack-700" />
      </div>
    </>
  )
}

export default GoogleAuthButton
