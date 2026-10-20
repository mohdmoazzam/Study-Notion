import { useCallback, useEffect, useId, useRef, useState } from "react"
import { toast } from "react-hot-toast"
import { FiBell } from "react-icons/fi"
import { useSelector } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"

import useNotificationStream from "../../hooks/useNotificationStream"
import useOnClickOutside from "../../hooks/useOnClickOutside"
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/operations/notificationAPI"

const relativeTime = (value) => {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return "Just now"
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

export default function NotificationBell() {
  const { token } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const panelId = useId()
  const containerRef = useRef(null)

  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  // null until the list is first loaded, which happens the first time the panel opens.
  const [items, setItems] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useOnClickOutside(containerRef, useCallback(() => setOpen(false), []))
  useEffect(() => setOpen(false), [pathname])

  useNotificationStream(token, ({ event, data }) => {
    if (event === "unread") {
      setUnreadCount(data.count)
    } else if (event === "notification") {
      setUnreadCount((count) => count + 1)
      setItems((current) => (current ? [data, ...current.filter((item) => item._id !== data._id)] : current))
      toast(data.title)
    }
  })

  const loadPage = useCallback(
    async (pageToLoad) => {
      setLoading(true)
      setError(false)
      try {
        const result = await fetchNotifications(token, { page: pageToLoad })
        setItems((current) => (pageToLoad === 1 || !current ? result.data : [...current, ...result.data]))
        setPage(result.page)
        setTotalPages(result.totalPages)
        setUnreadCount(result.unreadCount)
      } catch (err) {
        console.log("NOTIFICATIONS API ERROR............", err)
        setError(true)
      }
      setLoading(false)
    },
    [token]
  )

  useEffect(() => {
    if (open && items === null) loadPage(1)
  }, [open, items, loadPage])

  const handleItemClick = async (notification) => {
    if (!notification.readAt) {
      setItems((current) =>
        current.map((item) => (item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item))
      )
      setUnreadCount((count) => Math.max(0, count - 1))
      markNotificationRead(token, notification._id)
        .then(setUnreadCount)
        .catch((err) => console.log("MARK READ ERROR............", err))
    }
    setOpen(false)
    if (notification.link) navigate(notification.link)
  }

  const handleMarkAllRead = async () => {
    const readAt = new Date().toISOString()
    setItems((current) => current?.map((item) => ({ ...item, readAt: item.readAt ?? readAt })))
    setUnreadCount(0)
    try {
      setUnreadCount(await markAllNotificationsRead(token))
    } catch (err) {
      console.log("MARK ALL READ ERROR............", err)
      toast.error("Could not mark notifications as read")
    }
  }

  if (!token) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className="relative grid h-9 w-9 place-items-center rounded-full text-richblack-100 outline-none ring-brand transition hover:bg-selected focus-visible:ring-2"
      >
        <FiBell aria-hidden="true" className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-on-brand">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        id={panelId}
        role="dialog"
        aria-label="Notifications"
        onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
        className={`fixed inset-x-4 top-16 z-[1000] flex max-h-[70vh] origin-top-right flex-col rounded-2xl border border-line bg-surface shadow-xl transition duration-150 ease-out sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 ${
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-semibold text-content">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-link hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {items === null && loading && <p className="px-3 py-6 text-center text-sm text-content-muted">Loading...</p>}
          {error && (
            <div className="px-3 py-6 text-center text-sm text-content-muted">
              Couldn&apos;t load notifications.{" "}
              <button type="button" onClick={() => loadPage(items ? page + 1 : 1)} className="font-medium text-link hover:underline">
                Try again
              </button>
            </div>
          )}
          {items?.length === 0 && !error && (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
              <FiBell aria-hidden="true" className="text-2xl text-content-subtle" />
              <p className="text-sm text-content-muted">You&apos;re all caught up.</p>
            </div>
          )}
          {items?.map((notification) => (
            <button
              key={notification._id}
              type="button"
              onClick={() => handleItemClick(notification)}
              className={`flex w-full gap-3 rounded-lg px-3 py-2.5 text-left outline-none transition hover:bg-page focus-visible:bg-page ${
                notification.readAt ? "" : "bg-selected"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-transparent" : "bg-brand"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-content">
                  {notification.title}
                  {!notification.readAt && <span className="sr-only"> (unread)</span>}
                </span>
                <span className="block text-sm text-content-muted">{notification.body}</span>
                <span className="mt-1 block text-xs text-content-subtle">{relativeTime(notification.createdAt)}</span>
              </span>
            </button>
          ))}
          {items && page < totalPages && !error && (
            <button
              type="button"
              disabled={loading}
              onClick={() => loadPage(page + 1)}
              className="mt-1 w-full rounded-lg py-2 text-sm font-medium text-link hover:bg-page disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
