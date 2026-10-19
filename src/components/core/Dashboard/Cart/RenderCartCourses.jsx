import { FaStar } from "react-icons/fa"
import { FiAlertCircle, FiBookOpen, FiClock, FiTrash2 } from "react-icons/fi"
import { Link } from "react-router-dom"

import GetAvgRating from "../../../../utils/avgRating"
import { formatPrice } from "../../../../utils/formatPrice"
import { formatLength, sectionSeconds } from "../../ViewCourse/courseOutline"

const courseStats = (course) => {
  const sections = course.courseContent ?? []
  const lectures = sections.reduce((sum, section) => sum + (section.subSection?.length ?? 0), 0)
  const seconds = sections.reduce((sum, section) => sum + sectionSeconds(section), 0)
  return { lectures, length: seconds ? formatLength(seconds) : null }
}

function CartItem({ course, owned, onRemove }) {
  // Older saved carts may hold bare review ids; those only count once the cart refreshes.
  const reviews = (course.ratingAndReviews ?? []).filter((review) => typeof review?.rating === "number")
  const rating = reviews.length ? GetAvgRating(reviews) : 0
  const { lectures, length } = courseStats(course)
  const instructor = course.instructor && typeof course.instructor === "object" ? course.instructor : null

  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <Link to={`/courses/${course._id}`} className="shrink-0">
        <img src={course.thumbnail} alt="" className="aspect-video w-24 rounded-lg bg-page object-cover sm:w-40" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <Link to={`/courses/${course._id}`} className="line-clamp-2 font-semibold text-content hover:text-accent">
              {course.courseName}
            </Link>
            {instructor && (
              <p className="mt-0.5 truncate text-sm text-content-muted">
                By {instructor.firstName} {instructor.lastName}
              </p>
            )}
          </div>
          <p className="shrink-0 text-lg font-bold text-content sm:text-right">{formatPrice(course.price)}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-content-muted">
          {reviews.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <FaStar aria-hidden="true" className="text-brand" />
              <span className="font-semibold text-content">{rating.toFixed(1)}</span> ({reviews.length})
            </span>
          ) : (
            <span>No ratings yet</span>
          )}
          {lectures > 0 && (
            <span className="inline-flex items-center gap-1">
              <FiBookOpen aria-hidden="true" /> {lectures} {lectures === 1 ? "lecture" : "lectures"}
            </span>
          )}
          {length && (
            <span className="inline-flex items-center gap-1">
              <FiClock aria-hidden="true" /> {length}
            </span>
          )}
          {course.category?.name && <span className="rounded-full bg-page px-2 py-0.5 ring-1 ring-line">{course.category.name}</span>}
        </div>

        {owned && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-danger">
            <FiAlertCircle aria-hidden="true" /> You already own this course. Remove it to check out.
          </p>
        )}

        <button
          type="button"
          onClick={() => onRemove(course)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-content-muted transition hover:text-danger"
        >
          <FiTrash2 aria-hidden="true" /> Remove
        </button>
      </div>
    </li>
  )
}

export default function RenderCartCourses({ courses, ownedIds, onRemove }) {
  return (
    <ul className="divide-y divide-line rounded-2xl border border-line bg-surface shadow-sm">
      {courses.map((course) => (
        <CartItem key={course._id} course={course} owned={ownedIds.has(String(course._id))} onRemove={onRemove} />
      ))}
    </ul>
  )
}
