import { useCallback, useEffect, useRef, useState } from "react"
import { FiAward, FiCheck, FiCheckCircle, FiChevronLeft, FiChevronRight, FiRotateCcw, FiStar, FiVideoOff } from "react-icons/fi"
import { Link, Navigate, useNavigate, useOutletContext, useParams } from "react-router-dom"
import { BigPlayButton, ControlBar, PlaybackRateMenuButton, Player } from "video-react"
import "video-react/dist/video-react.css"

import LinkButton from "../../common/LinkButton"
import { lecturePath, resumeLecture } from "./courseOutline"

const AUTOPLAY_SECONDS = 5

const navButtonClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-content transition hover:border-content-subtle disabled:pointer-events-none disabled:opacity-40"

// Shown over the video when it ends: replay, or count down into the next lecture.
function EndOverlay({ next, onReplay, onNext, isLast, hasReviewed, onReview }) {
  const [secondsLeft, setSecondsLeft] = useState(next ? AUTOPLAY_SECONDS : null)

  useEffect(() => {
    if (secondsLeft === null) return undefined
    if (secondsLeft === 0) {
      onNext()
      return undefined
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft, onNext])

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/80 p-4 text-center text-white">
      {isLast ? (
        <>
          <FiAward aria-hidden="true" className="text-4xl text-yellow-50" />
          <div>
            <p className="text-lg font-semibold sm:text-xl">You&apos;ve reached the end of the course</p>
            <p className="mt-1 text-sm text-white/70">Nice work. Rewatch anything from the course content list.</p>
          </div>
          {!hasReviewed && (
            <button
              type="button"
              onClick={onReview}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-sm font-semibold text-richblack-900"
            >
              <FiStar aria-hidden="true" /> Rate this course
            </button>
          )}
        </>
      ) : (
        <>
          <FiCheckCircle aria-hidden="true" className="text-4xl text-yellow-50" />
          <div>
            <p className="text-sm text-white/70">Up next</p>
            <p className="max-w-md text-lg font-semibold sm:text-xl">{next.lecture.title}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-sm font-semibold text-richblack-900"
            >
              {secondsLeft === null ? "Play next" : `Playing in ${secondsLeft}s`} <FiChevronRight aria-hidden="true" />
            </button>
            {secondsLeft !== null && (
              <button
                type="button"
                onClick={() => setSecondsLeft(null)}
                className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>
        </>
      )}
      <button type="button" onClick={onReplay} className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
        <FiRotateCcw aria-hidden="true" /> Replay
      </button>
    </div>
  )
}

// The lecture being watched: video, title, completion and prev/next navigation.
export const VideoDetails = () => {
  const { courseId, subSectionId } = useParams()
  const navigate = useNavigate()
  const { lectures, completed, markComplete, openReview, hasReviewed } = useOutletContext()
  const playerRef = useRef(null)
  const [ended, setEnded] = useState(false)
  const [saving, setSaving] = useState(false)

  const index = lectures.findIndex(({ lecture }) => lecture._id === subSectionId)
  const current = lectures[index]
  const prev = lectures[index - 1]
  const next = lectures[index + 1]

  useEffect(() => {
    setEnded(false)
    window.scrollTo({ top: 0 })
  }, [subSectionId])

  const goTo = useCallback((target) => target && navigate(lecturePath(courseId, target)), [navigate, courseId])
  const goNext = useCallback(() => goTo(next), [goTo, next])

  if (lectures.length === 0) {
    return (
      <div className="mx-auto mt-16 max-w-md px-4 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-selected text-2xl text-accent">
          <FiVideoOff aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-content">No lectures yet</h1>
        <p className="mt-2 text-content-muted">The instructor hasn&apos;t added any lectures to this course yet. Check back soon.</p>
        <div className="mt-6">
          <LinkButton to="/dashboard/enrolled-courses" variant="secondary">
            Back to my courses
          </LinkButton>
        </div>
      </div>
    )
  }

  // /view-course/:courseId, or a link to a lecture that no longer exists: resume where the student left off.
  if (!current) {
    return <Navigate to={lecturePath(courseId, resumeLecture(lectures, completed))} replace />
  }

  const { lecture, section, sectionIndex } = current
  const isDone = completed.has(String(lecture._id))

  const handleEnded = () => {
    setEnded(true)
    if (!isDone) markComplete(lecture._id)
  }

  const handleMarkComplete = async () => {
    setSaving(true)
    await markComplete(lecture._id)
    setSaving(false)
  }

  const replay = () => {
    setEnded(false)
    playerRef.current?.seek(0)
    playerRef.current?.play()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-sm">
        {lecture.videoUrl ? (
          <Player key={lecture._id} ref={playerRef} aspectRatio="16:9" playsInline src={lecture.videoUrl} onEnded={handleEnded}>
            <BigPlayButton position="center" />
            <ControlBar>
              <PlaybackRateMenuButton rates={[2, 1.5, 1.25, 1, 0.75]} order={7.1} />
            </ControlBar>
          </Player>
        ) : (
          <div className="flex aspect-video items-center justify-center text-sm text-white/70">This lecture has no video.</div>
        )}
        {ended && (
          <EndOverlay
            next={next}
            isLast={!next}
            onNext={goNext}
            onReplay={replay}
            hasReviewed={hasReviewed}
            onReview={openReview}
          />
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-content-muted">
            Section {sectionIndex + 1} · {section.sectionName}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-content">{lecture.title}</h1>
          <p className="mt-1 text-xs text-content-subtle">
            Lecture {index + 1} of {lectures.length}
          </p>
        </div>

        {isDone ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-selected px-3 py-2 text-sm font-semibold text-accent">
            <FiCheckCircle aria-hidden="true" /> Completed
          </span>
        ) : (
          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={saving}
            className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60"
          >
            <FiCheck aria-hidden="true" /> {saving ? "Saving…" : "Mark as complete"}
          </button>
        )}
      </div>

      <nav aria-label="Lecture navigation" className="flex items-center justify-between gap-3 border-y border-line py-3">
        <button type="button" onClick={() => goTo(prev)} disabled={!prev} className={navButtonClass}>
          <FiChevronLeft aria-hidden="true" /> <span className="hidden sm:inline">Previous</span>
        </button>
        {next ? (
          <button type="button" onClick={goNext} className={`${navButtonClass} min-w-0`}>
            <span className="hidden truncate sm:inline">Next: {next.lecture.title}</span>
            <span className="sm:hidden">Next</span> <FiChevronRight aria-hidden="true" className="shrink-0" />
          </button>
        ) : (
          <Link to="/dashboard/enrolled-courses" className={navButtonClass}>
            Finish course <FiCheck aria-hidden="true" />
          </Link>
        )}
      </nav>

      {lecture.description && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-content-subtle">About this lecture</h2>
          <p className="mt-2 whitespace-pre-line leading-relaxed text-content-muted">{lecture.description}</p>
        </section>
      )}
    </div>
  )
}
