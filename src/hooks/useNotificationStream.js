import { useEffect, useRef } from "react"

import { notificationEndpoints } from "../services/apis"

const MIN_RETRY_MS = 1000
const MAX_RETRY_MS = 30000

// Parses one "event: x\ndata: y" block; comment lines (heartbeats) are skipped.
function parseEvent(block) {
  let event = "message"
  const data = []
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim()
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart())
  }
  if (!data.length) return null
  try {
    return { event, data: JSON.parse(data.join("\n")) }
  } catch {
    return null
  }
}

// Server-Sent Events over fetch: EventSource can't send the Authorization header.
// Reconnects with backoff while the user is logged in; `onEvent` gets { event, data }.
export default function useNotificationStream(token, onEvent) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    if (!token) return undefined
    const controller = new AbortController()
    let retryMs = MIN_RETRY_MS
    let retryTimer

    const connect = async () => {
      try {
        const response = await fetch(notificationEndpoints.NOTIFICATION_STREAM_API, {
          headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
          signal: controller.signal,
        })
        // An expired session won't recover by retrying; the next login starts a new stream.
        if (response.status === 401) return
        if (!response.ok || !response.body) throw new Error(`Stream failed (${response.status})`)

        retryMs = MIN_RETRY_MS
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n")
          const blocks = buffer.split("\n\n")
          buffer = blocks.pop()
          blocks.map(parseEvent).filter(Boolean).forEach((event) => onEventRef.current(event))
        }
      } catch (error) {
        if (controller.signal.aborted) return
        console.log("NOTIFICATION STREAM ERROR............", error)
      }
      if (controller.signal.aborted) return
      // The server closed the stream (deploy, sleep) or the network dropped: try again.
      retryTimer = setTimeout(connect, retryMs)
      retryMs = Math.min(retryMs * 2, MAX_RETRY_MS)
    }

    connect()
    return () => {
      controller.abort()
      clearTimeout(retryTimer)
    }
  }, [token])
}
