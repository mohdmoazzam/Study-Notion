import crypto from "crypto";
import { env } from "../../config/env";
import { paymentSuccessEmail } from "../../emails/paymentSuccess";
import { sendMailSafe } from "../../lib/mailer";
import { razorpay } from "../../lib/razorpay";
import { AppError } from "../../shared/errors";
import { Course } from "../courses/course.model";
import { User } from "../users/user.model";
import { enrollStudent } from "./enrollment.service";

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

const decodeCourseIds = (notes: Record<string, string | number>): string[] =>
  Object.entries(notes)
    .filter(([key]) => key.startsWith(COURSE_NOTE_PREFIX))
    .flatMap(([, value]) => String(value).split(","))
    .filter(Boolean);

const isValidSignature = ({ orderId, paymentId, signature }: PaymentConfirmation): boolean => {
  const expected = Buffer.from(
    crypto.createHmac("sha256", env.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest("hex")
  );
  const received = Buffer.from(signature);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

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

  await enrollStudent(userId, decodeCourseIds(notes));
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
