import { useCallback, useEffect, useState } from "react"
import { FiMenu, FiX } from "react-icons/fi"
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom"

import Logo from "../../components/common/Logo"
import AdminProfileMenu from "../../components/core/SuperAdmin/AdminProfileMenu"
import { superAdminNav } from "../../data/superAdminLinks"
import { checkSuperAdminSession } from "../../services/operations/superAdminAPI"
import { clearSuperAdminSession, getSuperAdminSession } from "../../utils/superAdminSession"

function SidebarNav({ onNavigate }) {
  return (
    <nav aria-label="Super admin" className="space-y-6">
      {superAdminNav.map(({ group, links }) => (
        <div key={group}>
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-content-subtle">{group}</p>
          <ul className="mt-2 space-y-1">
            {links.map(({ name, path, Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive ? "bg-selected text-accent" : "text-content-muted hover:bg-page hover:text-content"
                    }`
                  }
                >
                  <Icon aria-hidden="true" className="text-base" /> {name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

// Shell of the super admin console: session guard, top bar and sidebar around each section (<Outlet />).
export default function SuperAdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [session] = useState(getSuperAdminSession)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const backToLogin = useCallback(() => navigate("/super-admin/login", { replace: true }), [navigate])

  // A stored token may have been revoked by rotating the credentials.
  useEffect(() => {
    if (!session) return
    checkSuperAdminSession(session.token).then((valid) => !valid && backToLogin())
  }, [session, backToLogin])

  useEffect(() => setDrawerOpen(false), [pathname])

  useEffect(() => {
    if (!drawerOpen) return undefined
    const onKeyDown = (event) => event.key === "Escape" && setDrawerOpen(false)
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [drawerOpen])

  if (!session) return <Navigate to="/super-admin/login" replace />

  const logOut = () => {
    clearSuperAdminSession()
    backToLogin()
  }

  return (
    <div className="flex h-screen flex-col bg-page">
      <header className="z-30 shrink-0 border-b border-line bg-surface">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="super-admin-drawer"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-content lg:hidden"
            >
              <FiMenu aria-hidden="true" />
            </button>
            <Logo className="h-7 w-auto" />
            <span className="whitespace-nowrap rounded-full bg-selected px-2.5 py-0.5 text-xs font-semibold text-accent">Super admin</span>
          </div>
          <AdminProfileMenu session={session} onLogOut={logOut} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Desktop: sidebar beside the content; each scrolls on its own. */}
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-line bg-surface px-3 py-6 lg:block">
          <SidebarNav />
        </aside>

        {/* Phones and tablets: the same sidebar as a drawer. */}
        <div
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
        <aside
          id="super-admin-drawer"
          aria-label="Menu"
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto border-r border-line bg-surface px-3 py-4 shadow-xl transition-transform duration-200 lg:hidden ${
            drawerOpen ? "translate-x-0" : "invisible -translate-x-full"
          }`}
        >
          <div className="mb-6 flex items-center justify-between px-3">
            <Logo className="h-6 w-auto" />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-content-muted hover:bg-page"
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
          <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          <p className="mt-8 truncate px-3 text-xs text-content-subtle">{session.email}</p>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet context={{ session, onSessionExpired: backToLogin }} />
        </main>
      </div>
    </div>
  )
}
