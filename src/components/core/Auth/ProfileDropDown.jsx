import { useCallback, useEffect, useId, useRef, useState } from "react"
import { FiChevronDown, FiLogOut, FiSettings } from "react-icons/fi"
import * as VscIcons from "react-icons/vsc"
import { useDispatch, useSelector } from "react-redux"
import { Link, matchPath, useLocation, useNavigate } from "react-router-dom"

import { sidebarLinks } from "../../../data/dashboard-links"
import useOnClickOutside from "../../../hooks/useOnClickOutside"
import { logout } from "../../../services/operations/authAPI"
import { ACCOUNT_TYPE } from "../../../utils/constants"

// Shows the photo, or the person's initials when there is none or it fails to load.
function Avatar({ user, size }) {
  const [failed, setFailed] = useState(false)
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?"
  useEffect(() => setFailed(false), [user.image])

  return user.image && !failed ? (
    <img
      src={user.image}
      alt=""
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full bg-page object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-on-brand"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  )
}

const itemClass = (active) =>
  `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none transition focus-visible:bg-page ${
    active ? "bg-selected font-semibold text-accent" : "text-content hover:bg-page"
  }`

export const ProfileDropDown = () => {
  const { user } = useSelector((state) => state.profile)
  const { totalItems } = useSelector((state) => state.cart)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()

  const close = useCallback(({ restoreFocus = false } = {}) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }, [])

  useOnClickOutside(containerRef, useCallback(() => setOpen(false), []))

  // Navigating anywhere (including through the menu) closes it.
  useEffect(() => setOpen(false), [pathname])

  // Move focus into the menu when it opens, like a native menu.
  useEffect(() => {
    if (open) menuRef.current?.querySelector("[role=menuitem]")?.focus()
  }, [open])

  if (!user) return null

  const isStudent = user.accountType === ACCOUNT_TYPE.STUDENT
  const links = sidebarLinks.filter((link) => !link.type || link.type === user.accountType)
  const roleLabel = user.accountType === ACCOUNT_TYPE.INSTRUCTOR ? "Instructor" : isStudent ? "Student" : user.accountType

  const handleMenuKeyDown = (event) => {
    const items = [...menuRef.current.querySelectorAll("[role=menuitem]")]
    const index = items.indexOf(document.activeElement)
    const focusAt = (i) => items[(i + items.length) % items.length]?.focus()

    if (event.key === "ArrowDown") focusAt(index + 1)
    else if (event.key === "ArrowUp") focusAt(index - 1)
    else if (event.key === "Home") focusAt(0)
    else if (event.key === "End") focusAt(items.length - 1)
    else if (event.key === "Escape") close({ restoreFocus: true })
    else if (event.key === "Tab") return close()
    else return undefined
    event.preventDefault()
    return undefined
  }

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" && !open) {
      event.preventDefault()
      setOpen(true)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${user.firstName} ${user.lastName}`}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 outline-none ring-brand transition hover:bg-selected focus-visible:ring-2"
      >
        <Avatar user={user} size={32} />
        <FiChevronDown aria-hidden="true" className={`text-richblack-100 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
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
          <Avatar user={user} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-content">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-content-muted">{user.email}</p>
          </div>
          <span className="shrink-0 rounded-full bg-selected px-2 py-0.5 text-[11px] font-semibold text-accent">{roleLabel}</span>
        </div>

        <div className="border-t border-line pt-2">
          {links.map((link) => {
            const Icon = VscIcons[link.icon]
            const active = Boolean(matchPath({ path: link.path }, pathname))
            const showCount = link.path === "/dashboard/cart" && totalItems > 0
            return (
              <Link
                key={link.id}
                to={link.path}
                role="menuitem"
                tabIndex={-1}
                aria-current={active ? "page" : undefined}
                className={itemClass(active)}
              >
                {Icon && <Icon aria-hidden="true" className="text-base text-content-muted" />}
                <span className="flex-1">{link.name}</span>
                {showCount && (
                  <span className="rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-bold leading-none text-on-brand">
                    {totalItems}
                    <span className="sr-only"> items</span>
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        <div className="mt-2 border-t border-line pt-2">
          <Link
            to="/dashboard/settings"
            role="menuitem"
            tabIndex={-1}
            aria-current={pathname === "/dashboard/settings" ? "page" : undefined}
            className={itemClass(pathname === "/dashboard/settings")}
          >
            <FiSettings aria-hidden="true" className="text-base text-content-muted" /> Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              setOpen(false)
              dispatch(logout(navigate))
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
