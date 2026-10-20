import { useMemo } from "react"
import { useOutletContext } from "react-router-dom"

import CouponManager from "../../components/core/Coupons/CouponManager"
import {
  SessionExpiredError,
  createCoupon,
  deleteCoupon,
  fetchAllCoupons,
  setCouponActive,
} from "../../services/operations/superAdminAPI"

// Coupons section of the super admin console (rendered inside SuperAdminLayout): every coupon,
// including the ones instructors created.
export default function SuperAdminCoupons() {
  const { session, onSessionExpired: backToLogin } = useOutletContext()

  const api = useMemo(() => {
    // An expired session sends the admin back to the login screen; the call then counts as failed.
    const guard =
      (call, failed) =>
      async (...args) => {
        try {
          return await call(session.token, ...args)
        } catch (error) {
          if (error instanceof SessionExpiredError) backToLogin()
          return failed
        }
      }
    return {
      list: guard(fetchAllCoupons, null),
      create: guard(createCoupon, null),
      setActive: guard(setCouponActive, false),
      remove: guard(deleteCoupon, false),
    }
  }, [session, backToLogin])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <CouponManager
        api={api}
        isAdmin
        title="Coupons"
        description="Site-wide promotions, or codes limited to one instructor or to specific courses."
      />
    </div>
  )
}
