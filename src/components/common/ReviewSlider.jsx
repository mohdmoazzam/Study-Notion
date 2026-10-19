import { useEffect, useState } from "react"
import { FaStar } from "react-icons/fa"
import { Autoplay } from "swiper"
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"

import { apiConnector } from "../../services/apiconnector"
import { ratingsEndpoints } from "../../services/apis"

const clampClass = "overflow-hidden [-webkit-box-orient:vertical] [display:-webkit-box]"

function Stars({ rating }) {
  return (
    <div className="flex gap-1" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <FaStar key={value} className={value <= Math.round(rating) ? "text-brand" : "text-line"} />
      ))}
    </div>
  )
}

// Renders nothing until there are reviews, so pages don't show an empty section.
export const ReviewSlider = ({ title }) => {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    let active = true
    apiConnector("GET", ratingsEndpoints.REVIEWS_DETAILS_API)
      .then(({ data }) => {
        if (active && data?.success) setReviews(data.data)
      })
      .catch((error) => console.log("Could not fetch reviews.", error))
    return () => {
      active = false
    }
  }, [])

  if (reviews.length === 0) return null

  return (
    <section className="mx-auto w-11/12 max-w-maxContent py-20">
      {title}

      <Swiper
        modules={[Autoplay]}
        className="mt-12"
        spaceBetween={24}
        loop={reviews.length > 3}
        autoplay={{ delay: 3500, disableOnInteraction: false }}
        breakpoints={{ 0: { slidesPerView: 1 }, 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
      >
        {reviews.map((review) => {
          const { user, course } = review
          const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "StudyNotion learner"

          return (
            <SwiperSlide key={review._id} className="!h-auto">
              <figure className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6">
                <Stars rating={review.rating} />
                <blockquote className={`mt-4 flex-1 text-content [-webkit-line-clamp:4] ${clampClass}`}>
                  &ldquo;{review.review}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <img
                    src={user?.image || `https://api.dicebear.com/5.x/initials/svg?seed=${encodeURIComponent(name)}`}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-content">{name}</p>
                    {course?.courseName && (
                      <p className="truncate text-xs text-content-muted">{course.courseName}</p>
                    )}
                  </div>
                </figcaption>
              </figure>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </section>
  )
}
