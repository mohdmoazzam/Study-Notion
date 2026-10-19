import { useEffect, useRef, useState } from "react"
import { FiCheckCircle, FiChevronDown, FiCircle, FiPlayCircle } from "react-icons/fi"
import { Link, useParams } from "react-router-dom"

import { formatClock, formatLength, sectionSeconds } from "./courseOutline"

// Course content panel: collapsible sections with each lecture's status and length.
export const VideoDetailsSidebar = ({ course, completed }) => {
  const { sectionId, subSectionId } = useParams()
  const sections = course.courseContent ?? []
  const [open, setOpen] = useState(() => new Set(sectionId ? [sectionId] : sections[0] ? [sections[0]._id] : []))
  const currentRef = useRef(null)

  // Keep the section of the lecture being played expanded and its row in view.
  useEffect(() => {
    if (sectionId) setOpen((current) => (current.has(sectionId) ? current : new Set(current).add(sectionId)))
  }, [sectionId])
  // Only on desktop, where the panel scrolls on its own; on phones it sits below the video.
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) currentRef.current?.scrollIntoView({ block: "nearest" })
  }, [subSectionId])

  const toggle = (id) =>
    setOpen((current) => {
      const next = new Set(current)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const lectureCount = sections.reduce((sum, section) => sum + (section.subSection?.length ?? 0), 0)
  const totalSeconds = sections.reduce((sum, section) => sum + sectionSeconds(section), 0)

  return (
    <div>
      <div className="border-b border-line px-4 py-4 sm:px-5">
        <h2 className="font-semibold text-content">Course content</h2>
        <p className="mt-0.5 text-xs text-content-muted">
          {sections.length} {sections.length === 1 ? "section" : "sections"} · {lectureCount}{" "}
          {lectureCount === 1 ? "lecture" : "lectures"} · {formatLength(totalSeconds)}
        </p>
      </div>

      <ul>
        {sections.map((section, index) => {
          const lectures = section.subSection ?? []
          const done = lectures.filter((lecture) => completed.has(String(lecture._id))).length
          const expanded = open.has(section._id)
          const panelId = `section-panel-${section._id}`

          return (
            <li key={section._id} className="border-b border-line">
              <button
                type="button"
                onClick={() => toggle(section._id)}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-page sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-content-subtle">Section {index + 1}</p>
                  <p className="font-semibold text-content">{section.sectionName}</p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {done}/{lectures.length} done · {formatLength(sectionSeconds(section))}
                  </p>
                </div>
                <FiChevronDown
                  aria-hidden="true"
                  className={`mt-1 shrink-0 text-content-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                />
              </button>

              {expanded && (
                <ul id={panelId} className="pb-2">
                  {lectures.length === 0 && <li className="px-5 py-2 text-sm text-content-subtle">No lectures yet</li>}
                  {lectures.map((lecture, lectureIndex) => {
                    const current = lecture._id === subSectionId
                    const isDone = completed.has(String(lecture._id))
                    const Icon = isDone ? FiCheckCircle : current ? FiPlayCircle : FiCircle
                    return (
                      <li key={lecture._id}>
                        <Link
                          ref={current ? currentRef : undefined}
                          to={`/view-course/${course._id}/section/${section._id}/sub-section/${lecture._id}`}
                          aria-current={current ? "page" : undefined}
                          className={`mx-2 flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                            current ? "bg-selected" : "hover:bg-page"
                          }`}
                        >
                          <Icon
                            aria-label={isDone ? "Completed" : undefined}
                            className={`mt-0.5 shrink-0 ${isDone || current ? "text-accent" : "text-content-subtle"}`}
                          />
                          <span className={`min-w-0 flex-1 ${current ? "font-semibold text-content" : "text-content-muted"}`}>
                            {lectureIndex + 1}. {lecture.title}
                          </span>
                          {Number(lecture.timeDuration) > 0 && (
                            <span className="shrink-0 text-xs tabular-nums text-content-subtle">{formatClock(lecture.timeDuration)}</span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
