import { useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"

import { createMyCoupon, deleteMyCoupon, fetchMyCoupons, setMyCouponActive } from "../../../services/operations/couponAPI"
import { fetchInstructorCourses } from "../../../services/operations/courseDetailsAPI"
import CouponManager from "../Coupons/CouponManager"

// Instructor dashboard: coupons for the instructor's own courses.
export default function Coupons() {
  const { token } = useSelector((state) => state.auth)
  const [courses, setCourses] = useState([])

  // For limiting a new coupon to some of the instructor's courses.
  useEffect(() => {
    fetchInstructorCourses(token).then((result) => result && setCourses(result.courses))
  }, [token])

  const api = useMemo(
    () => ({
      list: (params) => fetchMyCoupons(token, params),
      create: (body) => createMyCoupon(token, body),
      setActive: (id, active) => setMyCouponActive(token, id, active),
      remove: (id) => deleteMyCoupon(token, id),
    }),
    [token]
  )

  return (
    <div className="mx-auto w-full max-w-5xl">
      <CouponManager
        api={api}
        courses={courses}
        title="Coupons"
        description="Discount codes for your courses. Students enter them in their cart."
      />
    </div>
  )
}
