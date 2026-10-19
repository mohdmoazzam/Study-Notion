import { Schema, Types, model } from "mongoose";

export const PAYOUT_STATUSES = ["Pending", "Paid", "Rejected", "Cancelled"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const PAYOUT_METHODS = ["UPI", "Bank"] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export interface IBankAccount {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  // From the IFSC directory when the request was verified.
  bankName: string;
  branch: string;
}

export interface IReceipt {
  publicId: string;
  resourceType: "image" | "raw";
  format: string;
}

export interface IPayout {
  instructor: Types.ObjectId;
  amount: number;
  method: PayoutMethod;
  upiId?: string;
  bankAccount?: IBankAccount;
  note?: string;
  status: PayoutStatus;
  // Set by an admin when the request is processed.
  reference?: string;
  adminNote?: string;
  // Proof of transfer (image or PDF) uploaded when the request is marked Paid.
  // Stored as a private Cloudinary asset; links are signed on demand (see getReceiptUrl).
  receipt?: IReceipt;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bankAccountSchema = new Schema<IBankAccount>(
  {
    accountHolderName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    ifsc: { type: String, required: true, trim: true, uppercase: true },
    bankName: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const receiptSchema = new Schema<IReceipt>(
  {
    publicId: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "raw"], required: true },
    format: { type: String, required: true },
  },
  { _id: false }
);

const payoutSchema = new Schema<IPayout>(
  {
    instructor: { type: Schema.Types.ObjectId, required: true, ref: "user" },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYOUT_METHODS, required: true },
    upiId: { type: String, trim: true },
    bankAccount: { type: bankAccountSchema },
    note: { type: String, trim: true },
    status: { type: String, enum: PAYOUT_STATUSES, default: "Pending", index: true },
    reference: { type: String, trim: true },
    adminNote: { type: String, trim: true },
    receipt: { type: receiptSchema },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

payoutSchema.index({ instructor: 1, _id: -1 });
// One open request per instructor; this also stops two concurrent requests from overdrawing the balance.
payoutSchema.index({ instructor: 1 }, { unique: true, partialFilterExpression: { status: "Pending" } });

export const Payout = model<IPayout>("Payout", payoutSchema);
