import { FiClock, FiEdit2, FiExternalLink, FiPlayCircle, FiTag, FiTrash2, FiUsers } from "react-icons/fi"
import { Link } from "react-router-dom"

import { formattedDate, getCreatedAt } from "../../../../utils/dateFormatter"
import { formatPrice } from "../../../../utils/formatPrice"

const plural = (count, word) => `${count} ${count === 1 ? word : `${word}s`}`

function StatusBadge({ published }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        published ? "bg-selected text-accent" : "bg-page text-content-muted ring-1 ring-line"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-brand" : "bg-content-subtle"}`} />
      {published ? "Published" : "Draft"}
    </span>
  )
}

export default function CourseRow({ course, onDelete }) {
  const published = course.status === "Published"
  const created = formattedDate(getCreatedAt(course))
  const lectures = course.lectureCount ?? 0

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:p-5">
      <Link
        to={`/dashboard/edit-course/${course._id}`}
        className="aspect-video w-full shrink-0 overflow-hidden rounded-xl border border-line bg-page sm:w-48"
        tabIndex={-1}
        aria-hidden="true"
      >
        {course.thumbnail && <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge published={published} />
          {course.category && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-content-muted">
              <FiTag aria-hidden="true" /> {course.category}
            </span>
          )}
        </div>

        <h3 className="mt-2 text-lg font-semibold leading-snug text-content">{course.courseName}</h3>
        {course.courseDescription && (
          <p className="mt-1 overflow-hidden text-sm text-content-muted [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
            {course.courseDescription}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-content-muted">
          <span className="inline-flex items-center gap-1.5">
            <FiPlayCircle aria-hidden="true" /> {plural(lectures, "lecture")}
          </span>
          {lectures > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <FiClock aria-hidden="true" /> {course.totalDuration}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <FiUsers aria-hidden="true" /> {plural(course.totalStudentsEnrolled ?? 0, "student")}
          </span>
          <span className="font-semibold text-content">{formatPrice(course.price)}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 sm:mt-auto">
          <p className="text-xs text-content-subtle">
            {created ? `Created ${created}` : ""}
            {!published && lectures === 0 && <span className="text-content-muted"> · Add lectures before publishing</span>}
          </p>
          <div className="flex items-center gap-1.5">
            <Link
              to={`/dashboard/edit-course/${course._id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-content transition hover:border-content-subtle"
            >
              <FiEdit2 aria-hidden="true" /> {published ? "Edit" : "Continue editing"}
            </Link>
            {published && (
              <Link
                to={`/courses/${course._id}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-accent transition hover:bg-selected"
              >
                <FiExternalLink aria-hidden="true" /> View
              </Link>
            )}
            <button
              type="button"
              onClick={() => onDelete(course)}
              aria-label={`Delete ${course.courseName}`}
              title="Delete course"
              className="rounded-lg p-2 text-content-muted transition hover:bg-danger/10 hover:text-danger"
            >
              <FiTrash2 aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
