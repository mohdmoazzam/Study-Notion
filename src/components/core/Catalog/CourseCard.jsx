import { Link } from "react-router-dom"

import GetAvgRating from "../../../utils/avgRating"
import { formatPrice } from "../../../utils/formatPrice"
import RatingStars from "../../common/RatingStars"

function CourseCard({ course }) {
  const reviews = course.ratingAndReviews ?? []
  const averageRating = reviews.length ? GetAvgRating(reviews) : 0
  const instructor = [course.instructor?.firstName, course.instructor?.lastName].filter(Boolean).join(" ")

  return (
    <Link
      to={`/courses/${course._id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-video overflow-hidden bg-page">
        <img
          src={course.thumbnail}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="overflow-hidden font-semibold leading-snug text-content [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
          {course.courseName}
        </h3>
        {instructor && <p className="text-sm text-content-muted">By {instructor}</p>}

        <div className="flex items-center gap-2 text-sm">
          {reviews.length > 0 ? (
            <>
              <span className="font-semibold text-accent">{averageRating.toFixed(1)}</span>
              <RatingStars Review_Count={averageRating} Star_Size={16} />
              <span className="text-content-subtle">({reviews.length})</span>
            </>
          ) : (
            <span className="text-content-subtle">No ratings yet</span>
          )}
        </div>

        <p className="mt-auto pt-2 text-lg font-bold text-content">{formatPrice(course.price)}</p>
      </div>
    </Link>
  )
}

export function CourseCardSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="aspect-video animate-pulse bg-line" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-line" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-line" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-line" />
        <div className="h-5 w-1/4 animate-pulse rounded bg-line" />
      </div>
    </div>
  )
}

export default CourseCard
