import { useState } from "react"
import { FiExternalLink } from "react-icons/fi"

// Receipts are private: `fetchUrl` asks the API for a short-lived signed link when clicked.
// The tab is opened right away (inside the click) so popup blockers allow it, then pointed at the link.
export default function ReceiptButton({ fetchUrl, format }) {
  const [opening, setOpening] = useState(false)

  const open = async () => {
    const tab = window.open("", "_blank")
    setOpening(true)
    const url = await fetchUrl().catch(() => null)
    setOpening(false)
    if (!tab) {
      if (url) window.location.assign(url)
      return
    }
    if (url) {
      tab.opener = null
      tab.location.replace(url)
    } else {
      tab.close()
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={opening}
      className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline disabled:opacity-60"
    >
      <FiExternalLink aria-hidden="true" /> {opening ? "Opening…" : `View receipt${format ? ` (${format.toUpperCase()})` : ""}`}
    </button>
  )
}
