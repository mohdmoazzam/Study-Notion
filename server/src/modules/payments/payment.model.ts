import { Schema, Types, model } from "mongoose";

// What was bought, as it was at purchase time (a course can later be renamed, repriced or deleted).
export interface IPurchasedCourse {
  course: Types.ObjectId;
  courseName: string;
  price: number;
  thumbnail?: string;
}

export interface IPayment {
  user: Types.ObjectId;
  courses: IPurchasedCourse[];
  // In rupees, as charged by Razorpay.
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  createdAt: Date;
  updatedAt: Date;
}

const purchasedCourseSchema = new Schema<IPurchasedCourse>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    courseName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    thumbnail: { type: String },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPayment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "user", required: true },
    courses: { type: [purchasedCourseSchema], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    // One record per order, so verifying the same payment twice doesn't duplicate it.
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, _id: -1 });

export const Payment = model<IPayment>("Payment", paymentSchema);
