const BASE_URL = process.env.REACT_APP_BASE_URL

// AUTH ENDPOINTS
export const endpoints = {
  SENDOTP_API: BASE_URL + "/auth/sendotp",
  SIGNUP_API: BASE_URL + "/auth/signup",
  LOGIN_API: BASE_URL + "/auth/login",
  GOOGLE_AUTH_API: BASE_URL + "/auth/google",
  RESETPASSTOKEN_API: BASE_URL + "/auth/reset-password-token",
  RESETPASSWORD_API: BASE_URL + "/auth/reset-password",
}

// PROFILE ENDPOINTS
export const profileEndpoints = {
  GET_USER_DETAILS_API: BASE_URL + "/profile/getUserDetails",
  GET_USER_ENROLLED_COURSES_API: BASE_URL + "/profile/getEnrolledCourses",
  GET_INSTRUCTOR_DATA_API: BASE_URL + "/profile/instructorDashboard"
}

// STUDENTS ENDPOINTS
export const studentEndpoints = {
  CHECKOUT_CONFIG_API: BASE_URL + "/payment/config",
  APPLY_COUPON_API: BASE_URL + "/payment/applyCoupon",
  COURSE_PAYMENT_API: BASE_URL + "/payment/capturePayment",
  COURSE_VERIFY_API: BASE_URL + "/payment/verifyPayment",
  SEND_PAYMENT_SUCCESS_EMAIL_API: BASE_URL + "/payment/sendPaymentSuccessEmail",
  PURCHASE_HISTORY_API: BASE_URL + "/payment/history",
}

// COURSE ENDPOINTS
export const courseEndpoints = {
  GET_ALL_COURSE_API: BASE_URL + "/course/getAllCourses",
  COURSE_DETAILS_API: BASE_URL + "/course/getCourseDetails",
  EDIT_COURSE_API: BASE_URL + "/course/editCourse",
  COURSE_CATEGORIES_API: BASE_URL + "/course/showAllCategories",
  CREATE_CATEGORY_API: BASE_URL + "/course/createCategory",
  CREATE_COURSE_API: BASE_URL + "/course/createCourse",
  CREATE_SECTION_API: BASE_URL + "/course/addSection",
  CREATE_SUBSECTION_API: BASE_URL + "/course/addSubSection",
  UPDATE_SECTION_API: BASE_URL + "/course/updateSection",
  UPDATE_SUBSECTION_API: BASE_URL + "/course/updateSubSection",
  GET_ALL_INSTRUCTOR_COURSES_API: BASE_URL + "/course/getInstructorCourses",
  DELETE_SECTION_API: BASE_URL + "/course/deleteSection",
  DELETE_SUBSECTION_API: BASE_URL + "/course/deleteSubSection",
  DELETE_COURSE_API: BASE_URL + "/course/deleteCourse",
  GET_FULL_COURSE_DETAILS_AUTHENTICATED: BASE_URL + "/course/getFullCourseDetails",
  LECTURE_COMPLETION_API: BASE_URL + "/course/updateCourseProgress",
  CREATE_RATING_API: BASE_URL + "/course/createRating",
}

// RATINGS AND REVIEWS
export const ratingsEndpoints = {
  REVIEWS_DETAILS_API: BASE_URL + "/course/getReviews",
}

// CATAGORIES API
export const categories = {
  CATEGORIES_API: BASE_URL + "/course/showAllCategories",
}

// CATALOG PAGE DATA
export const catalogData = {
  CATALOGPAGEDATA_API: BASE_URL + "/course/getCategoryPageDetails",
}
// CONTACT-US API
export const contactusEndpoint = {
  CONTACT_US_API: BASE_URL + "/reach/contact",
}

// SETTINGS PAGE API
export const settingsEndpoints = {
  UPDATE_DISPLAY_PICTURE_API: BASE_URL + "/profile/updateDisplayPicture",
  UPDATE_PROFILE_API: BASE_URL + "/profile/updateProfile",
  CHANGE_PASSWORD_API: BASE_URL + "/auth/changepassword",
  DELETE_PROFILE_API: BASE_URL + "/profile/deleteProfile",
}

// INSTRUCTOR PAYOUT ENDPOINTS
export const payoutEndpoints = {
  PAYOUT_REQUESTS_API: BASE_URL + "/payout/requests",
  IFSC_LOOKUP_API: BASE_URL + "/payout/ifsc",
}

// INSTRUCTOR COUPON ENDPOINTS
export const couponEndpoints = {
  COUPONS_API: BASE_URL + "/coupon",
  COURSE_OFFERS_API: BASE_URL + "/coupon/offers",
}

// NOTIFICATION ENDPOINTS
export const notificationEndpoints = {
  NOTIFICATIONS_API: BASE_URL + "/notifications",
  NOTIFICATION_STREAM_API: BASE_URL + "/notifications/stream",
  MARK_ALL_READ_API: BASE_URL + "/notifications/read-all",
  markReadApi: (id) => `${BASE_URL}/notifications/${id}/read`,
}

// SUPER ADMIN CONSOLE ENDPOINTS
export const superAdminEndpoints = {
  SUPER_ADMIN_LOGIN_API: BASE_URL + "/super-admin/login",
  SUPER_ADMIN_SESSION_API: BASE_URL + "/super-admin/session",
  SUPER_ADMIN_PAYOUTS_API: BASE_URL + "/super-admin/payouts",
  SUPER_ADMIN_COUPONS_API: BASE_URL + "/super-admin/coupons",
}
