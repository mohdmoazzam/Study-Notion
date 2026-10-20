import { apiConnector } from "../apiconnector"
import { notificationEndpoints } from "../apis"

const { NOTIFICATIONS_API, MARK_ALL_READ_API, markReadApi } = notificationEndpoints

const authHeader = (token) => ({ Authorization: `Bearer ${token}` })

// Resolves to { data, page, totalPages, unreadCount }; throws on failure.
export async function fetchNotifications(token, { page = 1, unreadOnly = false } = {}) {
  const response = await apiConnector("GET", NOTIFICATIONS_API, null, authHeader(token), {
    page,
    ...(unreadOnly && { unread: true }),
  })
  return response.data
}

// Both resolve to the new unread count.
export async function markNotificationRead(token, id) {
  const response = await apiConnector("PATCH", markReadApi(id), null, authHeader(token))
  return response.data.unreadCount
}

export async function markAllNotificationsRead(token) {
  const response = await apiConnector("PATCH", MARK_ALL_READ_API, null, authHeader(token))
  return response.data.unreadCount
}
