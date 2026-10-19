import { useEffect } from "react"
import { useLocation } from "react-router-dom"

import ChangeProfilePicture from "./ChangeProfilePicture"
import DeleteAccount from "./DeleteAccount"
import EditProfile from "./EditProfile"
import UpdatePassword from "./UpdatePassword"

export default function Settings() {
  const location = useLocation()

  // Deep links from My Profile: "#personal-info" scrolls to a section, "?focus=about" also focuses a field.
  useEffect(() => {
    const sectionId = location.hash.slice(1)
    const fieldId = new URLSearchParams(location.search).get("focus")
    if (!sectionId && !fieldId) return undefined
    const timer = setTimeout(() => {
      const field = fieldId ? document.getElementById(fieldId) : null
      const target = field ?? (sectionId ? document.getElementById(sectionId) : null)
      target?.scrollIntoView({ behavior: "smooth", block: "center" })
      field?.focus({ preventScroll: true })
    }, 150)
    return () => clearTimeout(timer)
  }, [location])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-content">Settings</h1>
        <p className="mt-1 text-content-muted">Manage your profile, password and account.</p>
      </div>
      <ChangeProfilePicture />
      <EditProfile />
      <UpdatePassword />
      <DeleteAccount />
    </div>
  )
}
