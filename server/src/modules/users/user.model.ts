import { Schema, Types, model } from "mongoose";
import { ACCOUNT_TYPES, type AccountType } from "../../shared/types/auth";

export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  // Unset for accounts created through Google sign-in until one is set via password reset.
  password?: string;
  googleId?: string;
  accountType: AccountType;
  active: boolean;
  approved: boolean;
  additionalDetails: Types.ObjectId;
  courses: Types.ObjectId[];
  token?: string;
  resetPasswordExpires?: Date;
  image: string;
  courseProgress: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    // Google accounts don't always carry a family name.
    lastName: { type: String, trim: true, default: "" },
    email: { type: String, required: true, trim: true, unique: true },
    // Secrets are excluded from every query unless explicitly selected with "+field".
    password: { type: String, select: false },
    googleId: { type: String, select: false, index: { unique: true, sparse: true } },
    accountType: { type: String, enum: ACCOUNT_TYPES, required: true },
    active: { type: Boolean, default: true },
    approved: { type: Boolean, default: true },
    additionalDetails: { type: Schema.Types.ObjectId, required: true, ref: "Profile" },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    token: { type: String, select: false, index: { sparse: true } },
    resetPasswordExpires: { type: Date, select: false },
    image: { type: String, required: true },
    courseProgress: [{ type: Schema.Types.ObjectId, ref: "courseProgress" }],
  },
  { timestamps: true }
);

export const User = model<IUser>("user", userSchema);
