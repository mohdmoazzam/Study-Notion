import { useEffect, useRef, useState } from "react"
import { FaStar } from "react-icons/fa"
import { FiMessageSquare, FiPlayCircle, FiUsers } from "react-icons/fi"

const plural = (count, word) => `${count.toLocaleString("en-IN")} ${word}${count === 1 ? "" : "s"}`

function Stat({ Icon, children }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-content-muted">
      {Icon}
      {children}
    </span>
  )
}

// Clean instructor card: identity, credibility stats, and a bio with "Read more".
function InstructorCard({ instructor, stats }) {
  const name = [instructor?.firstName, instructor?.lastName].filter(Boolean).join(" ") || "Instructor"
  const about = instructor?.additionalDetails?.about?.trim()
  const avatar =
    instructor?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(name)}`

  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const bioRef = useRef(null)

  // Only offer "Read more" when the bio actually overflows three lines.
  useEffect(() => {
    const element = bioRef.current
    if (element) setIsClamped(element.scrollHeight > element.clientHeight + 1)
  }, [about])

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <img src={avatar} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-line sm:h-20 sm:w-20" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-content-subtle">Instructor</p>
          <p className="mt-1 truncate text-xl font-bold text-content">{name}</p>
        </div>
      </div>

      {stats && (
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-y border-line py-4">
          {stats.reviews > 0 && (
            <Stat Icon={<FaStar aria-hidden="true" className="text-brand" />}>
              <span className="font-semibold text-content">{stats.rating.toFixed(1)}</span> instructor rating
            </Stat>
          )}
          {stats.reviews > 0 && (
            <Stat Icon={<FiMessageSquare aria-hidden="true" className="text-accent" />}>
              {plural(stats.reviews, "review")}
            </Stat>
          )}
          <Stat Icon={<FiUsers aria-hidden="true" className="text-accent" />}>{plural(stats.students, "student")}</Stat>
          <Stat Icon={<FiPlayCircle aria-hidden="true" className="text-accent" />}>{plural(stats.courses, "course")}</Stat>
        </div>
      )}

      <div className="mt-5">
        {about ? (
          <>
            <p
              ref={bioRef}
              className={`whitespace-pre-line leading-relaxed text-content ${
                expanded ? "" : "overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:3] [display:-webkit-box]"
              }`}
            >
              {about}
            </p>
            {(isClamped || expanded) && (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-2 text-sm font-semibold text-accent hover:underline"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </>
        ) : (
          <p className="text-content-muted">{name} hasn&apos;t added a bio yet.</p>
        )}
      </div>
    </div>
  )
}

export default InstructorCard
