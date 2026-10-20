import type { Request } from "express";
import mongoose from "mongoose";
import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { isPresent, requireFields, requireUser } from "../../shared/request";
import { DISCOUNT_TYPES, type DiscountType } from "./coupon.model";
import * as couponService from "./coupon.service";

const MAX_RESTRICTED_COURSES = 50;

const parseCouponInput = (body: Record<string, unknown>, isAdmin: boolean): couponService.CouponInput => {
  requireFields(body, ["code", "discountType", "value"]);

  const code = couponService.normalizeCode(String(body.code));
  if (!couponService.COUPON_CODE_PATTERN.test(code)) {
    throw AppError.badRequest("Codes are 3-20 letters or numbers (- and _ allowed)");
  }

  const discountType = body.discountType as DiscountType;
  if (!DISCOUNT_TYPES.includes(discountType)) {
    throw AppError.badRequest("discountType must be percent or fixed");
  }

  const value = Number(body.value);
  if (discountType === "percent" && !(Number.isInteger(value) && value >= 1 && value <= 100)) {
    throw AppError.badRequest("The percentage must be a whole number from 1 to 100");
  }
  if (discountType === "fixed" && !(Number.isFinite(value) && value >= 1)) {
    throw AppError.badRequest("The discount must be at least ₹1");
  }

  let expiresAt: Date | undefined;
  if (isPresent(body.expiresAt)) {
    expiresAt = new Date(String(body.expiresAt));
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw AppError.badRequest("The expiry date must be in the future");
    }
  }

  let usageLimit: number | undefined;
  if (isPresent(body.usageLimit)) {
    usageLimit = Number(body.usageLimit);
    if (!Number.isInteger(usageLimit) || usageLimit < 1) {
      throw AppError.badRequest("The usage limit must be a whole number of at least 1");
    }
  }

  const courses = body.courses ?? [];
  if (!Array.isArray(courses) || !courses.every((id) => mongoose.isValidObjectId(id))) {
    throw AppError.badRequest("Invalid courses");
  }
  const courseIds = [...new Set(courses.map(String))];
  if (courseIds.length > MAX_RESTRICTED_COURSES) {
    throw AppError.badRequest(`A coupon can be limited to at most ${MAX_RESTRICTED_COURSES} courses`);
  }

  const instructorEmail = isAdmin && isPresent(body.instructorEmail) ? String(body.instructorEmail) : undefined;
  // Shown on course pages unless the creator opts out.
  const showOnCoursePage = body.showOnCoursePage !== false;

  return { code, discountType, value, expiresAt, usageLimit, courseIds, showOnCoursePage, instructorEmail };
};

const requireCouponId = (req: Request): string => {
  const { couponId } = req.params;
  if (!mongoose.isValidObjectId(couponId)) {
    throw AppError.badRequest("Invalid coupon id");
  }
  return couponId;
};

const MAX_OFFER_COURSES = 150;

// Public: offers for a course page or a checkout. Query: ?courses=<id>,<id>,...
export const getOffers = asyncHandler(async (req, res) => {
  const courseIds = [...new Set(String(req.query.courses ?? "").split(",").map((id) => id.trim()).filter(Boolean))];
  if (courseIds.length === 0 || courseIds.length > MAX_OFFER_COURSES || !courseIds.every((id) => mongoose.isValidObjectId(id))) {
    throw AppError.badRequest("Invalid courses");
  }
  sendSuccess(res, 200, { data: await couponService.getOffers(courseIds) });
});

// The same endpoints serve instructors (limited to the coupons they created) and the super admin
// console (every coupon). `ownerOf` returns the instructor id, or undefined for the super admin.
const couponHandlers = (ownerOf: (req: Request) => string | undefined) => ({
  // Query: ?status=active|inactive&search=<code>&page=<n> (all optional).
  list: asyncHandler(async (req, res) => {
    const { status, search, page } = req.query;
    const pageNumber = page === undefined ? 1 : Number(page);
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw AppError.badRequest("Invalid page");
    }
    if (status !== undefined && !couponService.COUPON_STATUSES.includes(status as couponService.CouponStatus)) {
      throw AppError.badRequest("Invalid status");
    }

    const result = await couponService.listCoupons({
      ownerId: ownerOf(req),
      status: status as couponService.CouponStatus | undefined,
      search: typeof search === "string" ? search.trim().slice(0, 20) : "",
      page: pageNumber,
    });
    sendSuccess(res, 200, { data: result.coupons, counts: result.counts, page: result.page, totalPages: result.totalPages });
  }),

  create: asyncHandler(async (req, res) => {
    const ownerId = ownerOf(req);
    const data = await couponService.createCoupon(parseCouponInput(req.body, !ownerId), ownerId);
    sendSuccess(res, 201, { message: "Coupon created", data });
  }),

  // Body: { active: boolean }. Coupons are otherwise immutable, so students always get what was advertised.
  update: asyncHandler(async (req, res) => {
    if (typeof req.body.active !== "boolean") {
      throw AppError.badRequest("active must be true or false");
    }
    const data = await couponService.setCouponActive(requireCouponId(req), req.body.active, ownerOf(req));
    sendSuccess(res, 200, { message: data.active ? "Coupon enabled" : "Coupon disabled", data });
  }),

  remove: asyncHandler(async (req, res) => {
    await couponService.deleteCoupon(requireCouponId(req), ownerOf(req));
    sendSuccess(res, 200, { message: "Coupon deleted" });
  }),
});

export const instructorCoupons = couponHandlers((req) => requireUser(req).id);
export const adminCoupons = couponHandlers(() => undefined);
