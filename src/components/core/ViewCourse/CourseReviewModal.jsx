import { useState } from "react"
import { FaStar } from "react-icons/fa"
import { FiStar } from "react-icons/fi"
import { useSelector } from "react-redux"

import { submitReview } from "../../../services/operations/coursePlayerAPI"
import Dialog from "../../common/Dialog"
import { Field, inputClass, primaryButtonClass, secondaryButtonClass } from "../../common/formUi"

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"]
const MAX_REVIEW_LENGTH = 1000

// `onReviewed(rating)` gets the posted rating, or `true` when the course had already been reviewed.
export const CourseReviewModal = ({ course, onClose, onReviewed }) => {
  const { user } = useSelector((state) => state.profile)
  const { token } = useSelector((state) => state.auth)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [review, setReview] = useState("")
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const found = {}
    if (!rating) found.rating = "Choose a rating"
    if (!review.trim()) found.review = "Tell other students what you thought"
    setErrors(found)
    if (Object.keys(found).length) return

    setSubmitting(true)
    const result = await submitReview(token, { courseId: course._id, rating, review: review.trim() })
    setSubmitting(false)
    if (result === "created") onReviewed(rating)
    else if (result === "duplicate") onReviewed(true)
  }

  const shown = hovered || rating

  return (
    <Dialog
      id="course-review"
      as="form"
      onSubmit={handleSubmit}
      Icon={FiStar}
      title="Rate this course"
      busy={submitting}
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? "Posting…" : "Post review"}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        {user?.image && <img src={user.image} alt="" className="h-10 w-10 rounded-full object-cover" />}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-content">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-content-muted">Your review of {course.courseName} will be public</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? "" : "s"} – ${RATING_LABELS[value]}`}
                onClick={() => {
                  setRating(value)
                  setErrors((current) => ({ ...current, rating: undefined }))
                }}
                onMouseEnter={() => setHovered(value)}
                className="rounded p-0.5 text-3xl transition hover:scale-110"
              >
                <FaStar aria-hidden="true" className={value <= shown ? "text-brand" : "text-line"} />
              </button>
            ))}
            <span className="ml-2 text-sm font-medium text-content-muted">{RATING_LABELS[shown]}</span>
          </div>
          {errors.rating && <p className="mt-1 text-xs text-danger">{errors.rating}</p>}
        </div>

        <Field label="Your review" htmlFor="course-review-text" required error={errors.review} hint={`${review.length}/${MAX_REVIEW_LENGTH}`}>
          <textarea
            id="course-review-text"
            value={review}
            onChange={(event) => {
              setReview(event.target.value)
              setErrors((current) => ({ ...current, review: undefined }))
            }}
            rows={4}
            maxLength={MAX_REVIEW_LENGTH}
            placeholder="What did you like? What could be better?"
            className={`${inputClass(Boolean(errors.review))} resize-none`}
          />
        </Field>
      </div>
    </Dialog>
  )
}
