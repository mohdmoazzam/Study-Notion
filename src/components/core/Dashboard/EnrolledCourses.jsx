import { useEffect, useState } from "react"
import { FiBookOpen, FiCheckCircle, FiClock, FiPlayCircle } from "react-icons/fi"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"

import { getUserEnrolledCourses } from "../../../services/operations/profileAPI"
import LinkButton from "../../common/LinkButton"


function ListSkeleton() {
  return (
    <ul aria-hidden="true" className="space-y-4">
      {[0, 1, 2].map((i) => (
        <li key={i} className="h-32 animate-pulse rounded-2xl bg-line" />
      ))}
    </ul>
  )
}

function CourseCard({ course }) {
  const progress = Math.min(100, Math.max(0, course.progressPercentage ?? 0))
  const done = progress >= 100

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
      <img src={course.thumbnail} alt="" className="aspect-video w-full shrink-0 rounded-xl bg-page object-cover sm:w-44" />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-content">{course.courseName}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-content-muted">{course.courseDescription}</p>
        <div className="mt-3 flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${course.courseName} progress`}
            className="h-2 flex-1 overflow-hidden rounded-full bg-line"
          >
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right text-sm font-semibold text-content">{Math.round(progress)}%</span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-content-subtle">
          <FiClock aria-hidden="true" /> {course.totalDuration || "—"}
        </p>
      </div>
      {/* The player resumes at the first unfinished lecture. */}
      <Link
        to={`/view-course/${course._id}`}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-hover"
      >
        {done ? <FiCheckCircle aria-hidden="true" /> : <FiPlayCircle aria-hidden="true" />}
        {done ? "Review" : progress > 0 ? "Continue" : "Start"}
      </Link>
    </li>
  )
}

const EnrolledCourses = () => {
  const { token } = useSelector((state) => state.auth)
  // null while loading; afterwards an array, or "error" when the request failed
  const [courses, setCourses] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setCourses(null)
    getUserEnrolledCourses(token).then((result) => {
      if (active) setCourses(result ?? "error")
    })
    return () => {
      active = false
    }
  }, [token, reloadKey])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-content">Enrolled courses</h1>
        <p className="mt-1 text-content-muted">Pick up where you left off.</p>
      </div>

      {courses === null ? (
        <ListSkeleton />
      ) : courses === "error" ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <p className="font-semibold text-content">Couldn&apos;t load your courses</p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-3 text-sm font-semibold text-accent hover:underline"
          >
            Try again
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-selected text-2xl text-accent">
            <FiBookOpen aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-content">No courses yet</h2>
          <p className="mx-auto mt-2 max-w-md text-content-muted">Courses you buy will show up here.</p>
          <div className="mt-6">
            <LinkButton to="/">Browse courses</LinkButton>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {courses.map((course) => (
            <CourseCard key={course._id} course={course} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default EnrolledCourses
