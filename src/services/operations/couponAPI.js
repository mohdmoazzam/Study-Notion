import { toast } from "react-hot-toast";

import { apiConnector } from "../apiconnector";
import { couponEndpoints } from "../apis";

const { COUPONS_API, COURSE_OFFERS_API } = couponEndpoints;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Public offers for these courses bought together, best first: { code, discountType, value, expiresAt,
// usesLeft?, subtotal, discount, total, eligibleCourseIds }. Quiet: a failure just means no offers are shown.
export const fetchOffers = async (courseIds) => {
  try {
    const response = await apiConnector("GET", COURSE_OFFERS_API, null, null, { courses: courseIds.join(",") });
    return response.data.data ?? [];
  } catch (error) {
    console.log("COURSE OFFERS API ERROR............", error);
    return [];
  }
};

// The instructor's own coupons: { coupons, counts, page, totalPages }, or null on failure.
export const fetchMyCoupons = async (token, params) => {
  try {
    const response = await apiConnector("GET", COUPONS_API, null, authHeader(token), params);
    const { data, counts, page, totalPages } = response.data;
    return { coupons: data ?? [], counts: counts ?? {}, page, totalPages };
  } catch (error) {
    console.log("COUPONS API ERROR............", error);
    toast.error("Could not load your coupons");
    return null;
  }
};

// Returns the created coupon, or null with the server's reason shown as a toast.
export const createMyCoupon = async (token, body) => {
  try {
    const response = await apiConnector("POST", COUPONS_API, body, authHeader(token));
    toast.success("Coupon created");
    return response.data.data;
  } catch (error) {
    console.log("CREATE COUPON API ERROR............", error);
    toast.error(error.response?.data?.message ?? "Could not create the coupon");
    return null;
  }
};

// Enables or disables a coupon; returns true on success.
export const setMyCouponActive = async (token, couponId, active) => {
  try {
    const response = await apiConnector("PATCH", `${COUPONS_API}/${couponId}`, { active }, authHeader(token));
    toast.success(response.data.message);
    return true;
  } catch (error) {
    console.log("UPDATE COUPON API ERROR............", error);
    toast.error(error.response?.data?.message ?? "Could not update the coupon");
    return false;
  }
};

// Deletes an unused coupon; returns true on success.
export const deleteMyCoupon = async (token, couponId) => {
  try {
    await apiConnector("DELETE", `${COUPONS_API}/${couponId}`, null, authHeader(token));
    toast.success("Coupon deleted");
    return true;
  } catch (error) {
    console.log("DELETE COUPON API ERROR............", error);
    toast.error(error.response?.data?.message ?? "Could not delete the coupon");
    return false;
  }
};
