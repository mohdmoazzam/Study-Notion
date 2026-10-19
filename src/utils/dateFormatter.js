// Returns a valid Date, or null for missing/unparseable input (avoids rendering "Invalid Date").
const toValidDate = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

// Older documents have no createdAt; a MongoDB ObjectId begins with its creation time (seconds, hex).
export const getCreatedAt = (doc) => {
  const createdAt = toValidDate(doc?.createdAt)
  if (createdAt) return createdAt
  const id = String(doc?._id ?? "")
  return /^[0-9a-f]{24}$/i.test(id) ? new Date(parseInt(id.slice(0, 8), 16) * 1000) : null
}

// "March 22, 2024", or null when there is no valid date.
export const formattedDate = (value) =>
  toValidDate(value)?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) ?? null

// "March 22, 2024 | 4:52 PM", or null when there is no valid date.
export const formatDateTime = (value) => {
  const date = toValidDate(value)
  if (!date) return null
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${formattedDate(date)} | ${time}`
}
