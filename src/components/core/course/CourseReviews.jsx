import { FaStar } from "react-icons/fa"

import GetAvgRating from "../../../utils/avgRating"
import RatingStars from "../../common/RatingStars"

const MAX_REVIEWS = 6

const reviewerName = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "StudyNotion learner"

function CourseReviews({ reviews = [] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-content-muted">
        No reviews yet. Students who enroll can rate this course after they start learning.
      </div>
    )
  }

  const average = GetAvgRating(reviews)
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((review) => Math.round(review.rating) === star).length,
  }))

  return (
    <div className="space-y-4">
      {/* Summary: average + per-star breakdown */}
      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <div className="text-center sm:w-40 sm:shrink-0">
          <p className="text-5xl font-extrabold tracking-tight text-content">{average.toFixed(1)}</p>
          <div className="mt-2 flex justify-center">
            <RatingStars Review_Count={average} Star_Size={18} />
          </div>
          <p className="mt-1 text-sm text-content-muted">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>

        <div className="flex-1 space-y-2">
          {breakdown.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-3 text-sm">
              <span className="flex w-8 items-center gap-1 text-content-muted">
                {star} <FaStar aria-hidden="true" className="text-xs text-brand" />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: `${(count / reviews.length) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right tabular-nums text-content-muted">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {reviews.slice(0, MAX_REVIEWS).map((review) => {
        const name = reviewerName(review.user)
        return (
          <figure key={review._id} className="rounded-2xl border border-line bg-surface p-5">
            <figcaption className="flex items-center gap-3">
              <img
                src={review.user?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(name)}`}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-content">{name}</p>
                <RatingStars Review_Count={review.rating} Star_Size={14} />
              </div>
            </figcaption>
            <blockquote className="mt-3 text-content">&ldquo;{review.review}&rdquo;</blockquote>
          </figure>
        )
      })}
    </div>
  )
}

export default CourseReviews
