import { Schema, model } from "mongoose";

export interface IOTP {
  email: string;
  otp: string;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  // TTL index: MongoDB removes the document 5 minutes after creation.
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

export const OTP = model<IOTP>("OTP", otpSchema);
