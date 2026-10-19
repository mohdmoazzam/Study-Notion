// The super admin console keeps its own session, separate from the student/instructor login.
const STORAGE_KEY = "superAdminSession"

export const getSuperAdminSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!session?.token || new Date(session.expiresAt) <= new Date()) return null
    return session
  } catch {
    return null
  }
}

export const saveSuperAdminSession = ({ token, email, expiresAt }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, email, expiresAt }))
  } catch {
    // Storage unavailable (e.g. private mode): the session lasts until the page is closed.
  }
}

export const clearSuperAdminSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nothing to clear
  }
}
