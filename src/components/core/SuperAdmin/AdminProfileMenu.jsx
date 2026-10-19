import { useCallback, useEffect, useId, useRef, useState } from "react"
import { FiChevronDown, FiClock, FiLogOut } from "react-icons/fi"
import { useLocation } from "react-router-dom"

import avatar from "../../../assets/Images/super-admin-avatar.svg"
import useOnClickOutside from "../../../hooks/useOnClickOutside"

const sessionEndsAt = (expiresAt) => {
  const date = new Date(expiresAt)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

// Account menu in the super admin top bar: who is signed in, when the session ends, and log out.
export default function AdminProfileMenu({ session, onLogOut }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()

  useOnClickOutside(containerRef, useCallback(() => setOpen(false), []))
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (open) menuRef.current?.querySelector("[role=menuitem]")?.focus()
  }, [open])

  const handleMenuKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (event.key === "Tab") {
      setOpen(false)
    }
  }

  const endsAt = sessionEndsAt(session.expiresAt)

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault()
            setOpen(true)
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Super admin account menu"
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 outline-none ring-brand transition hover:bg-selected focus-visible:ring-2"
      >
        <img src={avatar} alt="" className="h-8 w-8 rounded-full" />
        <span className="hidden text-sm font-medium text-content sm:inline">Super admin</span>
        <FiChevronDown aria-hidden="true" className={`text-content-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        id={menuId}
        ref={menuRef}
        role="menu"
        aria-label="Account"
        onKeyDown={handleMenuKeyDown}
        className={`fixed inset-x-4 top-16 z-[1000] origin-top-right rounded-2xl border border-line bg-surface p-2 shadow-xl transition duration-150 ease-out sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-72 ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 px-3 pb-3 pt-2">
          <img src={avatar} alt="" className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-content">Super admin</p>
            <p className="truncate text-xs text-content-muted">{session.email}</p>
          </div>
        </div>

        {endsAt && (
          <p className="mx-3 mb-2 flex items-center gap-1.5 rounded-lg bg-page px-2.5 py-1.5 text-xs text-content-muted">
            <FiClock aria-hidden="true" /> Session ends at {endsAt}
          </p>
        )}

        <div className="border-t border-line pt-2">
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              setOpen(false)
              onLogOut()
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-danger outline-none transition hover:bg-danger/10 focus-visible:bg-danger/10"
          >
            <FiLogOut aria-hidden="true" className="text-base" /> Log out
          </button>
        </div>
      </div>
    </div>
  )
}
