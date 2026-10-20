import { Types, type FilterQuery } from "mongoose";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors";
import { escapeRegex } from "../../shared/utils/regex";
import { Course } from "../courses/course.model";
import { User } from "../users/user.model";
import { Coupon, type DiscountType, type ICoupon } from "./coupon.model";

export const COUPON_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,19}$/;

export const normalizeCode = (code: string) => code.trim().toUpperCase();

type CouponDoc = ICoupon & { _id: Types.ObjectId };

// Why a coupon can't be redeemed right now, or null when it can.
const unusableReason = (coupon: CouponDoc, now = new Date()): string | null => {
  if (!coupon.active) return "This coupon code is not valid";
  if (coupon.expiresAt && coupon.expiresAt <= now) return "This coupon has expired";
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return "This coupon has reached its usage limit";
  return null;
};

export interface PricedCourse {
  _id: Types.ObjectId;
  price?: number;
  instructor: Types.ObjectId;
}

export interface OrderQuote {
  // In rupees. total = subtotal - discount + platformFee.
  subtotal: number;
  discount: number;
  platformFee: number;
  total: number;
  coupon?: { code: string; discountType: DiscountType; value: number; eligibleCourseIds: string[] };
}

const roundRupees = (amount: number) => Math.round(amount * 100) / 100;

// The fee is charged once per order, and not at all when there's nothing else to pay
// (so a 100%-off coupon still means free).
export const platformFeeFor = (amountAfterDiscount: number) => (amountAfterDiscount > 0 ? env.platformFee : 0);

const withPlatformFee = (subtotal: number, discount: number) => {
  const afterDiscount = roundRupees(subtotal - discount);
  const platformFee = platformFeeFor(afterDiscount);
  return { subtotal, discount, platformFee, total: roundRupees(afterDiscount + platformFee) };
};

const appliesTo = (coupon: Pick<CouponDoc, "instructor" | "courses">, course: PricedCourse) =>
  (!coupon.instructor || coupon.instructor.equals(course.instructor)) &&
  (coupon.courses.length === 0 || coupon.courses.some((id) => id.equals(course._id)));

type CouponTerms = Pick<CouponDoc, "discountType" | "value" | "instructor" | "courses">;

// What a coupon takes off these courses. Shared by checkout pricing and the offers list so both always agree.
const priceWithCoupon = (coupon: CouponTerms, courses: PricedCourse[]) => {
  const subtotal = roundRupees(courses.reduce((sum, course) => sum + (course.price ?? 0), 0));
  const eligible = courses.filter((course) => (course.price ?? 0) > 0 && appliesTo(coupon, course));
  const eligibleTotal = eligible.reduce((sum, course) => sum + (course.price ?? 0), 0);
  let discount =
    coupon.discountType === "percent"
      ? Math.floor((eligibleTotal * coupon.value) / 100)
      : Math.min(coupon.value, eligibleTotal);
  // Razorpay can't charge less than ₹1, so a smaller remainder is waived too.
  if (eligible.length > 0 && subtotal - discount < 1) discount = subtotal;
  return {
    subtotal,
    discount: roundRupees(discount),
    total: roundRupees(subtotal - discount),
    eligibleCourseIds: eligible.map((course) => course._id.toString()),
  };
};

// Prices an order from the courses as stored, so the amount never comes from the browser.
// Throws a 400 explaining why when `code` is given but can't be applied to these courses.
export const quoteOrder = async (courses: PricedCourse[], code?: string): Promise<OrderQuote> => {
  const subtotal = roundRupees(courses.reduce((sum, course) => sum + (course.price ?? 0), 0));
  if (!code) return withPlatformFee(subtotal, 0);

  const coupon = await Coupon.findOne({ code: normalizeCode(code) }).lean<CouponDoc>();
  if (!coupon) {
    throw AppError.badRequest("This coupon code is not valid");
  }
  const reason = unusableReason(coupon);
  if (reason) {
    throw AppError.badRequest(reason);
  }

  const { discount, eligibleCourseIds } = priceWithCoupon(coupon, courses);
  if (eligibleCourseIds.length === 0) {
    throw AppError.badRequest("This coupon doesn't apply to these courses");
  }

  return {
    ...withPlatformFee(subtotal, discount),
    coupon: { code: coupon.code, discountType: coupon.discountType, value: coupon.value, eligibleCourseIds },
  };
};

export const MAX_OFFERS = 5;

// Public offers for a course page or a checkout: usable coupons that apply to at least one of the
// courses and are allowed to be shown, best first. `discount` and `total` are for buying all of them together,
// before the platform fee.
export const getOffers = async (courseIds: string[]) => {
  const courses = await Course.find({ _id: { $in: courseIds }, price: { $gt: 0 } }, "price instructor").lean();
  if (courses.length === 0) return [];

  const coupons = await Coupon.find(
    {
      $and: [
        usableFilter(new Date()),
        { showOnCoursePage: { $ne: false } },
        { $or: [{ instructor: null }, { instructor: { $in: courses.map((course) => course.instructor) } }] },
        { $or: [{ courses: { $size: 0 } }, { courses: { $in: courses.map((course) => course._id) } }] },
      ],
    },
    "code discountType value expiresAt usageLimit usedCount instructor courses"
  ).lean<CouponDoc[]>();

  return coupons
    .map((coupon) => ({
      _id: coupon._id,
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      expiresAt: coupon.expiresAt,
      ...(coupon.usageLimit && { usesLeft: Math.max(0, coupon.usageLimit - coupon.usedCount) }),
      ...priceWithCoupon(coupon, courses),
    }))
    .filter((offer) => offer.eligibleCourseIds.length > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, MAX_OFFERS);
};

// Counted once per paid order (when its payment is first recorded). Two students checking out
// at the same moment can both pass the limit check, so the count may go one or two over the limit.
export const recordCouponUse = async (code: string): Promise<void> => {
  await Coupon.updateOne({ code: normalizeCode(code) }, { $inc: { usedCount: 1 } });
};

// --- Managing coupons (instructors for their own courses, the super admin for any) ---

export interface CouponInput {
  code: string;
  discountType: DiscountType;
  value: number;
  expiresAt?: Date;
  usageLimit?: number;
  courseIds: string[];
  showOnCoursePage: boolean;
  // Super admin only: restrict to one instructor's courses.
  instructorEmail?: string;
}

export const COUPON_STATUSES = ["active", "inactive"] as const;
export type CouponStatus = (typeof COUPON_STATUSES)[number];

const usableFilter = (now: Date): FilterQuery<ICoupon> => ({
  active: true,
  $and: [
    { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    { $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
  ],
});

const statusFilter = (status: CouponStatus, now: Date): FilterQuery<ICoupon> =>
  status === "active" ? usableFilter(now) : { $nor: [usableFilter(now)] };

// What the lists show as the coupon's status.
const stateOf = (coupon: CouponDoc, now: Date) => {
  if (!coupon.active) return "disabled";
  if (coupon.expiresAt && coupon.expiresAt <= now) return "expired";
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return "usedUp";
  return "active";
};

export const COUPON_PAGE_SIZE = 20;

// Newest first. Pass `ownerId` to list one instructor's coupons; without it, every coupon (super admin).
// `counts` ignore the status filter (but respect the search) so the tabs always show their totals.
export const listCoupons = async ({
  ownerId,
  status,
  search,
  page,
}: {
  ownerId?: string;
  status?: CouponStatus;
  search?: string;
  page: number;
}) => {
  const now = new Date();
  const base: FilterQuery<ICoupon> = {
    ...(ownerId && { owner: new Types.ObjectId(ownerId) }),
    ...(search && { code: { $regex: escapeRegex(search), $options: "i" } }),
  };
  const filter = status ? { $and: [base, statusFilter(status, now)] } : base;

  const [coupons, total, all, active] = await Promise.all([
    Coupon.find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * COUPON_PAGE_SIZE)
      .limit(COUPON_PAGE_SIZE)
      .populate("courses", "courseName")
      .populate("instructor", "firstName lastName email")
      .populate("owner", "firstName lastName email")
      .lean<CouponDoc[]>(),
    Coupon.countDocuments(filter),
    Coupon.countDocuments(base),
    Coupon.countDocuments({ $and: [base, usableFilter(now)] }),
  ]);

  return {
    coupons: coupons.map((coupon) => ({ ...coupon, state: stateOf(coupon, now) })),
    counts: { all, active, inactive: all - active },
    page,
    totalPages: Math.max(1, Math.ceil(total / COUPON_PAGE_SIZE)),
  };
};

const findInstructorByEmail = async (email: string) => {
  const instructor = await User.findOne({ email: email.trim().toLowerCase(), accountType: "Instructor" }, "_id").lean();
  if (!instructor) {
    throw AppError.notFound("No instructor found with that email");
  }
  return instructor._id;
};

// Pass `ownerId` when an instructor creates it: the coupon is then limited to their own courses.
export const createCoupon = async (input: CouponInput, ownerId?: string) => {
  const instructor = ownerId
    ? new Types.ObjectId(ownerId)
    : input.instructorEmail
    ? await findInstructorByEmail(input.instructorEmail)
    : undefined;

  if (input.courseIds.length > 0) {
    const found = await Course.countDocuments({ _id: { $in: input.courseIds }, ...(instructor && { instructor }) });
    if (found !== input.courseIds.length) {
      throw AppError.badRequest(
        ownerId
          ? "You can only create coupons for your own courses"
          : instructor
          ? "Some of the courses don't belong to that instructor"
          : "Some of the courses could not be found"
      );
    }
  }

  try {
    const coupon = await Coupon.create({
      code: normalizeCode(input.code),
      discountType: input.discountType,
      value: input.value,
      expiresAt: input.expiresAt,
      usageLimit: input.usageLimit,
      courses: input.courseIds,
      showOnCoursePage: input.showOnCoursePage,
      instructor,
      owner: ownerId,
    });
    return coupon.toObject();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw AppError.conflict("A coupon with this code already exists");
    }
    throw error;
  }
};

// Instructors can only change their own coupons; the super admin (no `ownerId`) can change any.
export const setCouponActive = async (couponId: string, active: boolean, ownerId?: string) => {
  const coupon = await Coupon.findOneAndUpdate(
    { _id: couponId, ...(ownerId && { owner: ownerId }) },
    { active },
    { new: true }
  ).lean();
  if (!coupon) {
    throw AppError.notFound("Coupon not found");
  }
  return coupon;
};

// Coupons that have been redeemed stay for the record; they can only be disabled.
export const deleteCoupon = async (couponId: string, ownerId?: string): Promise<void> => {
  const coupon = await Coupon.findOne({ _id: couponId, ...(ownerId && { owner: ownerId }) }, "usedCount").lean();
  if (!coupon) {
    throw AppError.notFound("Coupon not found");
  }
  if (coupon.usedCount > 0) {
    throw AppError.conflict("This coupon has been used, so it can't be deleted. Disable it instead");
  }
  await Coupon.deleteOne({ _id: coupon._id, usedCount: 0 });
};
