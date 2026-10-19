import { useCallback, useEffect, useMemo, useState } from "react"
import { FaStar } from "react-icons/fa"
import { FiAlertCircle, FiArrowLeft, FiStar } from "react-icons/fi"
import { useSelector } from "react-redux"
import { Link, Outlet, useParams } from "react-router-dom"

import LinkButton from "../components/common/LinkButton"
import { CourseReviewModal } from "../components/core/ViewCourse/CourseReviewModal"
import { flattenLectures } from "../components/core/ViewCourse/courseOutline"
import { VideoDetailsSidebar } from "../components/core/ViewCourse/VideoDetailsSidebar"
import { completeLecture, fetchCoursePlayer } from "../services/operations/coursePlayerAPI"

function PlayerSkeleton() {
  return (
    <div aria-hidden="true" className="flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4 p-4 sm:p-6">
        <div className="aspect-video w-full animate-pulse rounded-2xl bg-line" />
        <div className="h-7 w-2/3 animate-pulse rounded-lg bg-line" />
        <div className="h-20 animate-pulse rounded-xl bg-line" />
      </div>
      <div className="hidden space-y-3 border-l border-line p-4 lg:block">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-line" />
        ))}
      </div>
    </div>
  )
}

function LoadError({ courseId, error, status, onRetry }) {
  const notEnrolled = status === 403
  return (
    <div className="mx-auto mt-16 max-w-md px-4 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-2xl text-danger">
        <FiAlertCircle aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-content">
        {notEnrolled ? "You're not enrolled in this course" : status === 404 ? "Course not found" : "Couldn't load this course"}
      </h1>
      <p className="mt-2 text-content-muted">{notEnrolled ? "Enroll to start watching its lectures." : error}</p>
      <div className="mt-6 flex justify-center gap-3">
        {notEnrolled ? (
          <LinkButton to={`/courses/${courseId}`}>View course</LinkButton>
        ) : status === 404 ? (
          <LinkButton to="/dashboard/enrolled-courses">My courses</LinkButton>
        ) : (
          <button type="button" onClick={onRetry} className="text-sm font-semibold text-accent hover:underline">
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

// Layout for the course player: top bar, the current lecture (<Outlet />) and the course content panel.
export const ViewCourse = () => {
  const { courseId } = useParams()
  const { token } = useSelector((state) => state.auth)
  const { user } = useSelector((state) => state.profile)

  const [state, setState] = useState({ status: "loading" })
  const [completed, setCompleted] = useState(() => new Set())
  const [reloadKey, setReloadKey] = useState(0)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [postedRating, setPostedRating] = useState(null)

  useEffect(() => {
    let active = true
    setState({ status: "loading" })
    setPostedRating(null)
    fetchCoursePlayer(courseId, token).then((result) => {
      if (!active) return
      if (result.error) {
        setState({ status: "error", error: result.error, code: result.status })
        return
      }
      setCompleted(new Set(result.completedVideos))
      setState({ status: "ready", course: result.course })
    })
    return () => {
      active = false
    }
  }, [courseId, token, reloadKey])

  const course = state.course
  const lectures = useMemo(() => flattenLectures(course?.courseContent), [course])

  // The student's own review, if any, comes back with the course's reviews.
  const existingRating = useMemo(
    () => course?.ratingAndReviews?.find((review) => String(review.user?._id ?? review.user) === String(user?._id))?.rating,
    [course, user]
  )
  const myRating = postedRating ?? existingRating

  const markComplete = useCallback(
    async (lectureId) => {
      const id = String(lectureId)
      if (completed.has(id)) return true
      const saved = await completeLecture(token, courseId, id)
      if (saved) setCompleted((current) => new Set(current).add(id))
      return saved
    },
    [completed, token, courseId]
  )

  const openReview = useCallback(() => setReviewOpen(true), [])
  const closeReview = useCallback(() => setReviewOpen(false), [])

  const doneCount = lectures.filter(({ lecture }) => completed.has(String(lecture._id))).length
  const percent = lectures.length ? Math.round((doneCount / lectures.length) * 100) : 0

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-page lg:h-[calc(100vh-3.5rem)]">
      <header className="shrink-0 border-b border-line bg-surface">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/dashboard/enrolled-courses"
            aria-label="Back to my courses"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-content transition hover:border-content-subtle"
          >
            <FiArrowLeft aria-hidden="true" />
          </Link>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-content">{course?.courseName ?? (state.status === "loading" ? "Loading course…" : "Course")}</p>
            {state.status === "ready" && lectures.length > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <div
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Course progress"
                  className="h-1.5 w-24 overflow-hidden rounded-full bg-line sm:w-40"
                >
                  <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
                <span className="text-xs text-content-muted">
                  {doneCount}/{lectures.length} lectures · {percent}%
                </span>
              </div>
            )}
          </div>

          {state.status === "ready" &&
            (myRating ? (
              <span className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-selected px-3 py-2 text-sm font-medium text-accent sm:inline-flex">
                <FaStar aria-hidden="true" /> {typeof myRating === "number" ? `You rated ${myRating}/5` : "Reviewed"}
              </span>
            ) : (
              <button
                type="button"
                onClick={openReview}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-content transition hover:border-content-subtle"
              >
                <FiStar aria-hidden="true" /> <span className="hidden sm:inline">Leave a review</span>
                <span className="sm:hidden">Review</span>
              </button>
            ))}
        </div>
      </header>

      {state.status === "loading" ? (
        <PlayerSkeleton />
      ) : state.status === "error" ? (
        <LoadError courseId={courseId} error={state.error} status={state.code} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <div className="flex-1 lg:grid lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_380px]">
          <main className="lg:overflow-y-auto">
            <Outlet context={{ course, lectures, completed, markComplete, openReview, hasReviewed: Boolean(myRating) }} />
          </main>
          <aside aria-label="Course content" className="border-t border-line bg-surface lg:overflow-y-auto lg:border-l lg:border-t-0">
            <VideoDetailsSidebar course={course} completed={completed} />
          </aside>
        </div>
      )}

      {reviewOpen && course && (
        <CourseReviewModal
          course={course}
          onClose={closeReview}
          onReviewed={(rating) => {
            setPostedRating(rating)
            setReviewOpen(false)
          }}
        />
      )}
    </div>
  )
}
