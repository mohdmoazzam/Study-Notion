import { useEffect, useState } from "react"

import { formattedDate } from "../../../utils/dateFormatter"

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_TIMEOUT_MS = 2 ** 31 - 1
const pad = (value) => String(value).padStart(2, "0")

// "05:12:33"
const formatCountdown = (ms) => {
  const seconds = Math.floor(ms / 1000)
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`
}

// "Ends March 22, 2026", or a live "Ends in 05:12:33" countdown in the last 24 hours.
// Only ticks while the countdown is showing.
export default function OfferExpiry({ expiresAt }) {
  const end = new Date(expiresAt).getTime()
  const [now, setNow] = useState(Date.now)
  const remaining = end - now
  const counting = remaining > 0 && remaining < DAY_MS

  useEffect(() => {
    if (counting) {
      const timer = setInterval(() => setNow(Date.now()), 1000)
      return () => clearInterval(timer)
    }
    // Wake up when the last day starts, so the countdown appears without a reload
    // (skipped when that's further off than setTimeout can wait).
    const untilLastDay = end - DAY_MS - Date.now()
    if (untilLastDay <= 0 || untilLastDay > MAX_TIMEOUT_MS) return undefined
    const timer = setTimeout(() => setNow(Date.now()), untilLastDay + 50)
    return () => clearTimeout(timer)
  }, [end, counting])

  if (Number.isNaN(end)) return null
  if (remaining <= 0) return <span className="font-medium text-danger">Expired</span>
  if (!counting) return <span>Ends {formattedDate(expiresAt)}</span>
  return (
    <span className="font-medium text-danger">
      Ends in <span className="tabular-nums">{formatCountdown(remaining)}</span>
    </span>
  )
}
