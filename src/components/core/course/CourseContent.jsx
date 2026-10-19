import { useState } from "react"
import { FiChevronDown, FiClock, FiLayers, FiLock, FiPlayCircle } from "react-icons/fi"

const toSeconds = (value) => Math.round(parseFloat(value) || 0)

// Lecture length: 754 -> "12:34".
const formatLectureLength = (seconds) => {
  const total = toSeconds(seconds)
  if (!total) return ""
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

// Section length: 3720 -> "1h 2m", 754 -> "12 min", 29 -> "29s".
const formatSectionLength = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours) return `${hours}h ${minutes}m`
  if (minutes) return `${minutes} min`
  return seconds ? `${seconds}s` : ""
}

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`

function SummaryPill({ Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-medium text-content-muted ring-1 ring-line">
      <Icon aria-hidden="true" className="text-accent" />
      {children}
    </span>
  )
}

function CourseContent({ sections = [], totalDuration, isEnrolled = false }) {
  // First section starts open so the curriculum is visible at a glance.
  const [openIds, setOpenIds] = useState(() => new Set(sections[0] ? [sections[0]._id] : []))
  const lectureCount = sections.reduce((count, section) => count + (section.subSection?.length ?? 0), 0)
  const allOpen = sections.length > 0 && openIds.size === sections.length

  const toggle = (id) =>
    setOpenIds((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-content-muted">
        The curriculum for this course is coming soon.
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <SummaryPill Icon={FiLayers}>{plural(sections.length, "section")}</SummaryPill>
          <SummaryPill Icon={FiPlayCircle}>{plural(lectureCount, "lecture")}</SummaryPill>
          {totalDuration && <SummaryPill Icon={FiClock}>{totalDuration} total</SummaryPill>}
        </div>
        <button
          type="button"
          onClick={() => setOpenIds(allOpen ? new Set() : new Set(sections.map((section) => section._id)))}
          className="text-sm font-semibold text-accent hover:underline"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {!isEnrolled && (
        <p className="mt-3 flex items-center gap-2 text-sm text-content-muted">
          <FiLock aria-hidden="true" className="text-accent" /> Enroll to unlock all lectures.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {sections.map((section, sectionIndex) => {
          const open = openIds.has(section._id)
          const lectures = section.subSection ?? []
          const sectionSeconds = lectures.reduce((sum, lecture) => sum + toSeconds(lecture.timeDuration), 0)
          const sectionLength = formatSectionLength(sectionSeconds)

          return (
            <div
              key={section._id}
              className={`overflow-hidden rounded-2xl border bg-surface transition ${
                open ? "border-brand/60 shadow-md" : "border-line hover:border-content-subtle"
              }`}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(section._id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-selected text-sm font-bold text-accent">
                  {String(sectionIndex + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-content">{section.sectionName}</span>
                  <span className="block text-xs text-content-muted">
                    {plural(lectures.length, "lecture")}
                    {sectionLength && <> &middot; {sectionLength}</>}
                  </span>
                </span>
                <FiChevronDown
                  aria-hidden="true"
                  className={`shrink-0 text-content-subtle transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>

              {/* Height animation: 0fr -> 1fr row track */}
              <div className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <ol className="divide-y divide-line border-t border-line">
                    {lectures.length === 0 && <li className="px-5 py-3 text-sm text-content-muted">No lectures yet</li>}
                    {lectures.map((lecture, lectureIndex) => (
                      <li key={lecture._id} className="flex items-start justify-between gap-4 px-5 py-3">
                        <span className="flex min-w-0 items-start gap-3">
                          {isEnrolled ? (
                            <FiPlayCircle aria-label="Lecture" className="mt-0.5 shrink-0 text-accent" />
                          ) : (
                            <FiLock aria-label="Locked lecture" className="mt-0.5 shrink-0 text-content-subtle" />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-content">
                              <span className="mr-1.5 tabular-nums text-content-subtle">
                                {sectionIndex + 1}.{lectureIndex + 1}
                              </span>
                              {lecture.title}
                            </span>
                            {lecture.description && (
                              <span className="mt-0.5 block truncate text-xs text-content-muted">
                                {lecture.description}
                              </span>
                            )}
                          </span>
                        </span>
                        {formatLectureLength(lecture.timeDuration) && (
                          <span className="shrink-0 rounded-md bg-page px-2 py-0.5 tabular-nums text-xs text-content-muted">
                            {formatLectureLength(lecture.timeDuration)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CourseContent
