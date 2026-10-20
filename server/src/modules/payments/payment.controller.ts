import { env } from "../../config/env";
import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { parseNonNegativeNumber, requireFields, requireUser } from "../../shared/request";
import * as paymentService from "./payment.service";

const parseCourseIds = (courses: unknown): string[] => {
  if (!Array.isArray(courses) || courses.length === 0) {
    throw AppError.badRequest("Please provide course ids");
  }
  const courseIds = [...new Set(courses.map(String))];
  if (courseIds.length > paymentService.MAX_COURSES_PER_ORDER) {
    throw AppError.badRequest("Too many courses in one order");
  }
  return courseIds;
};

const parseCouponCode = (coupon: unknown): string | undefined =>
  typeof coupon === "string" && coupon.trim() ? coupon.trim().slice(0, 20) : undefined;

// Public: pricing settings the checkout shows before an order is created.
export const getCheckoutConfig = asyncHandler(async (_req, res) => {
  sendSuccess(res, 200, { platformFee: env.platformFee });
});

// Body: { courses, coupon? }. The amount is always worked out on the server.
export const capturePayment = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const courseIds = parseCourseIds(req.body.courses);

  const result = await paymentService.createOrder(id, courseIds, parseCouponCode(req.body.coupon));
  if (result.free) {
    sendSuccess(res, 200, { message: "Enrolled", free: true, quote: result.quote });
    return;
  }
  // The client reads the order from `message`. The key id is public; Checkout must use the same
  // Razorpay account that created the order, so the server is the single source for it.
  sendSuccess(res, 201, { message: result.order, data: result.order, quote: result.quote, key: env.razorpay.keyId });
});

// Body: { courses, coupon }. Returns the discounted price for the cart, or a 400 saying why the coupon doesn't apply.
export const applyCoupon = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const courseIds = parseCourseIds(req.body.courses);
  const coupon = parseCouponCode(req.body.coupon);
  if (!coupon) {
    throw AppError.badRequest("Enter a coupon code");
  }

  const quote = await paymentService.previewOrder(id, courseIds, coupon);
  sendSuccess(res, 200, { message: "Coupon applied", data: quote });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"], "Payment failed");

  await paymentService.verifyAndEnroll(id, {
    orderId: String(req.body.razorpay_order_id),
    paymentId: String(req.body.razorpay_payment_id),
    signature: String(req.body.razorpay_signature),
  });
  sendSuccess(res, 200, { message: "Payment verified" });
});

// Razorpay retries any non-2xx response, so events we don't act on still get a 200.
export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.get("x-razorpay-signature");
  if (!req.rawBody || !signature) {
    throw AppError.badRequest("Invalid webhook request");
  }

  const handled = await paymentService.handleWebhook(req.rawBody, signature);
  sendSuccess(res, 200, { message: handled ? "Event processed" : "Event ignored" });
});

// Query: ?search=<course name>&page=<n> (both optional).
export const getPurchaseHistory = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const { search, page } = req.query;
  const pageNumber = page === undefined ? 1 : Number(page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw AppError.badRequest("Invalid page");
  }

  const result = await paymentService.getPurchaseHistory(id, {
    search: typeof search === "string" ? search.trim().slice(0, 100) : "",
    page: pageNumber,
  });
  sendSuccess(res, 200, { data: result.payments, summary: result.summary, page: result.page, totalPages: result.totalPages });
});

export const sendPaymentSuccessEmail = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["orderId", "paymentId", "amount"], "Please provide all the fields");

  await paymentService.sendPaymentSuccessEmail(id, {
    orderId: String(req.body.orderId),
    paymentId: String(req.body.paymentId),
    amountInPaise: parseNonNegativeNumber(req.body.amount, "amount"),
  });
  sendSuccess(res, 200, { message: "Payment success email queued" });
});
