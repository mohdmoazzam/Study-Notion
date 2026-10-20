import { Schema, Types, model } from "mongoose";

export const DISCOUNT_TYPES = ["percent", "fixed"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export interface ICoupon {
  // Stored uppercase; students can type it in any case.
  code: string;
  discountType: DiscountType;
  // A percentage (1-100) or an amount in rupees, depending on `discountType`.
  value: number;
  expiresAt?: Date;
  // Total redemptions allowed across all students; unset means unlimited.
  usageLimit?: number;
  usedCount: number;
  // Restrictions: when set, the discount only applies to these courses / this instructor's courses.
  courses: Types.ObjectId[];
  instructor?: Types.ObjectId;
  // The instructor who created it; unset for coupons created in the super admin console.
  owner?: Types.ObjectId;
  active: boolean;
  // Listed as an offer on the course pages it applies to. Off for private codes (e.g. sent by email).
  showOnCoursePage: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    discountType: { type: String, enum: DISCOUNT_TYPES, required: true },
    value: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date },
    usageLimit: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    courses: { type: [{ type: Schema.Types.ObjectId, ref: "Course" }], default: [] },
    instructor: { type: Schema.Types.ObjectId, ref: "user" },
    owner: { type: Schema.Types.ObjectId, ref: "user" },
    active: { type: Boolean, default: true },
    showOnCoursePage: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.index({ owner: 1, _id: -1 });

export const Coupon = model<ICoupon>("Coupon", couponSchema);
