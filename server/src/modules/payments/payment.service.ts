import crypto from "crypto";
import { Types } from "mongoose";
import { env } from "../../config/env";
import { paymentSuccessEmail } from "../../emails/paymentSuccess";
import { sendMailSafe } from "../../lib/mailer";
import { razorpay } from "../../lib/razorpay";
import { AppError } from "../../shared/errors";
import { escapeRegex } from "../../shared/utils/regex";
import { Course } from "../courses/course.model";
import { User } from "../users/user.model";
import { enrollStudent } from "./enrollment.service";
import { Payment } from "./payment.model";

// Razorpay notes allow at most 15 keys of 256 chars each, so course ids are chunked across keys.
const IDS_PER_NOTE = 10;
const MAX_NOTE_KEYS = 14;
const COURSE_NOTE_PREFIX = "courses_";
export const MAX_COURSES_PER_ORDER = IDS_PER_NOTE * MAX_NOTE_KEYS;

export interface PaymentConfirmation {
  orderId: string;
  paymentId: string;
  signature: string;
}

const encodeCourseIds = (ids: string[]): Record<string, string> => {
  const notes: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += IDS_PER_NOTE) {
    notes[`${COURSE_NOTE_PREFIX}${i / IDS_PER_NOTE}`] = ids.slice(i, i + IDS_PER_NOTE).join(",");
  }
  return notes;
};

export const decodeCourseIds = (notes: Record<string, string | number>): string[] =>
  Object.entries(notes)
    .filter(([key]) => key.startsWith(COURSE_NOTE_PREFIX))
    .flatMap(([, value]) => String(value).split(","))
    .filter(Boolean);

const hmacMatches = (secret: string, data: string | Buffer, signature: string): boolean => {
  const expected = Buffer.from(crypto.createHmac("sha256", secret).update(data).digest("hex"));
  const received = Buffer.from(signature);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

const isValidSignature = ({ orderId, paymentId, signature }: PaymentConfirmation): boolean =>
  hmacMatches(env.razorpay.keySecret, `${orderId}|${paymentId}`, signature);

export const createOrder = async (userId: string, courseIds: string[]) => {
  const courses = await Course.find({ _id: { $in: courseIds } }, "price studentsEnrolled").lean();
  if (courses.length !== courseIds.length) {
    throw AppError.notFound("Could not find the course");
  }
  if (courses.some((course) => course.studentsEnrolled.some((id) => id.toString() === userId))) {
    throw AppError.conflict("Student is already enrolled");
  }

  const totalAmount = courses.reduce((sum, course) => sum + (course.price ?? 0), 0);

  try {
    return await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      notes: { userId, ...encodeCourseIds(courseIds) },
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw AppError.badGateway("Could not initiate order");
  }
};

export const verifyAndEnroll = async (userId: string, confirmation: PaymentConfirmation): Promise<void> => {
  if (!isValidSignature(confirmation)) {
    throw AppError.badRequest("Payment failed");
  }

  // Enroll in the courses recorded on the order, not whatever the client sends now.
  const order = await razorpay.orders.fetch(confirmation.orderId);
  const notes = (order.notes ?? {}) as Record<string, string | number>;
  if (String(notes.userId) !== userId) {
    throw AppError.badRequest("Payment failed");
  }

  await fulfillOrder(userId, notes, {
    orderId: confirmation.orderId,
    paymentId: confirmation.paymentId,
    amountInPaise: Number(order.amount),
    currency: order.currency,
  });
};

// Shared by the checkout callback and the webhook, which usually both arrive for the same order;
// enrolling and recording are idempotent, so whichever comes second changes nothing.
const fulfillOrder = async (
  userId: string,
  notes: Record<string, string | number>,
  payment: { orderId: string; paymentId: string; amountInPaise: number; currency: string }
): Promise<void> => {
  const courseIds = decodeCourseIds(notes);
  await enrollStudent(userId, courseIds);
  await recordPayment(userId, courseIds, payment);
};

const FULFILLING_EVENTS = new Set(["order.paid", "payment.captured"]);

interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string } };
  };
}

// Verifies a Razorpay webhook and fulfills paid orders, so a student is enrolled even if their
// browser closed before the checkout callback reached us. Resolves to whether the event was acted on.
export const handleWebhook = async (rawBody: Buffer, signature: string): Promise<boolean> => {
  if (!env.razorpay.webhookSecret) {
    throw new AppError(503, "Webhook is not configured");
  }
  if (!hmacMatches(env.razorpay.webhookSecret, rawBody, signature)) {
    throw AppError.badRequest("Invalid webhook signature");
  }

  const event = JSON.parse(rawBody.toString("utf8")) as RazorpayWebhookEvent;
  if (!FULFILLING_EVENTS.has(event.event)) return false;

  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id || payment.status !== "captured") return false;

  // The order is fetched rather than read from the payload so amounts and notes come from Razorpay.
  const order = await razorpay.orders.fetch(payment.order_id);
  const notes = (order.notes ?? {}) as Record<string, string | number>;
  const userId = String(notes.userId ?? "");
  // Orders without our notes were created by something else on the same Razorpay account.
  if (!Types.ObjectId.isValid(userId) || decodeCourseIds(notes).length === 0) return false;

  await fulfillOrder(userId, notes, {
    orderId: payment.order_id,
    paymentId: payment.id,
    amountInPaise: Number(order.amount),
    currency: order.currency,
  });
  return true;
};

// Saves the purchase for the student's history. Upserting on the order id keeps a repeated
// verification of the same payment from creating a second record.
// `paidAt` is for backfilling older purchases with their original date; it defaults to now.
export const recordPayment = async (
  userId: string,
  courseIds: string[],
  {
    orderId,
    paymentId,
    amountInPaise,
    currency,
    paidAt,
  }: { orderId: string; paymentId: string; amountInPaise: number; currency: string; paidAt?: Date }
): Promise<boolean> => {
  const courses = await Course.find({ _id: { $in: courseIds } }, "courseName price thumbnail").lean();
  try {
    const result = await Payment.updateOne(
      { razorpayOrderId: orderId },
      {
        $setOnInsert: {
          user: userId,
          courses: courses.map((course) => ({
            course: course._id,
            courseName: course.courseName ?? "Untitled course",
            price: course.price ?? 0,
            thumbnail: course.thumbnail,
          })),
          amount: amountInPaise / 100,
          currency,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          ...(paidAt && { createdAt: paidAt, updatedAt: paidAt }),
        },
      },
      // With an explicit date, Mongoose must not stamp its own timestamps over it.
      { upsert: true, ...(paidAt && { timestamps: false }) }
    );
    return result.upsertedCount > 0;
  } catch (error) {
    // Two simultaneous upserts (checkout callback and webhook) can both try to insert; one wins.
    if ((error as { code?: number }).code === 11000) return false;
    throw error;
  }
};

export const HISTORY_PAGE_SIZE = 10;

// The student's purchases, newest first. `search` matches course names; `summary` covers all purchases.
export const getPurchaseHistory = async (userId: string, { search, page }: { search: string; page: number }) => {
  const user = new Types.ObjectId(userId);
  const filter = search ? { user, "courses.courseName": { $regex: escapeRegex(search), $options: "i" } } : { user };

  const [payments, total, [summary]] = await Promise.all([
    Payment.find(filter, "-user -__v")
      .sort({ _id: -1 })
      .skip((page - 1) * HISTORY_PAGE_SIZE)
      .limit(HISTORY_PAGE_SIZE)
      .lean(),
    Payment.countDocuments(filter),
    Payment.aggregate<{ orders: number; totalSpent: number; courses: number }>([
      { $match: { user } },
      { $group: { _id: null, orders: { $sum: 1 }, totalSpent: { $sum: "$amount" }, courses: { $sum: { $size: "$courses" } } } },
    ]),
  ]);

  return {
    payments,
    summary: { orders: summary?.orders ?? 0, totalSpent: summary?.totalSpent ?? 0, courses: summary?.courses ?? 0 },
    page,
    totalPages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)),
  };
};

export const sendPaymentSuccessEmail = async (
  userId: string,
  { orderId, paymentId, amountInPaise }: { orderId: string; paymentId: string; amountInPaise: number }
): Promise<void> => {
  const user = await User.findById(userId, "firstName email").lean();
  if (!user) {
    throw AppError.notFound("User not found");
  }

  sendMailSafe(user.email, "Payment Received", paymentSuccessEmail(user.firstName, amountInPaise / 100, orderId, paymentId));
};
