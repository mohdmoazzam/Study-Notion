import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { parseNonNegativeNumber, requireFields, requireUser } from "../../shared/request";
import * as paymentService from "./payment.service";

export const capturePayment = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const { courses } = req.body;

  if (!Array.isArray(courses) || courses.length === 0) {
    throw AppError.badRequest("Please provide course ids");
  }
  const courseIds = [...new Set(courses.map(String))];
  if (courseIds.length > paymentService.MAX_COURSES_PER_ORDER) {
    throw AppError.badRequest("Too many courses in one order");
  }

  const order = await paymentService.createOrder(id, courseIds);
  // The client reads the order from `message`.
  sendSuccess(res, 201, { message: order, data: order });
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
