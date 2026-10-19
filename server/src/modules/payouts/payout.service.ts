import type { UploadedFile } from "express-fileupload";
import { Types, type FilterQuery } from "mongoose";
import { payoutStatusEmail } from "../../emails/payoutStatus";
import { deleteFromCloudinary, getPrivateDownloadUrl, uploadToCloudinary } from "../../lib/cloudinary";
import { sendMailSafe } from "../../lib/mailer";
import { AppError } from "../../shared/errors";
import { escapeRegex } from "../../shared/utils/regex";
import { Course } from "../courses/course.model";
import { User } from "../users/user.model";
import { PAYOUT_STATUSES, Payout, type IBankAccount, type IPayout, type IReceipt, type PayoutStatus } from "./payout.model";

export const MIN_PAYOUT_AMOUNT = 100;

export type PayoutDestination = { method: "UPI"; upiId: string } | { method: "Bank"; bankAccount: IBankAccount };

export type PayoutInput = PayoutDestination & { amount: number; note?: string };

export interface PayoutDecision {
  status: Extract<PayoutStatus, "Paid" | "Rejected">;
  reference?: string;
  adminNote?: string;
}

type PayoutDoc = IPayout & { _id: Types.ObjectId };

// Same figure the instructor dashboard shows: price x enrolled students, summed over their courses.
const getTotalEarnings = async (instructor: Types.ObjectId): Promise<number> => {
  const [result] = await Course.aggregate<{ total: number }>([
    { $match: { instructor } },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: [{ $ifNull: ["$price", 0] }, { $size: { $ifNull: ["$studentsEnrolled", []] } }] } },
      },
    },
  ]);
  return result?.total ?? 0;
};

const getTotalsByStatus = async (match: FilterQuery<IPayout>) => {
  const groups = await Payout.aggregate<{ _id: PayoutStatus; amount: number; count: number }>([
    { $match: match },
    { $group: { _id: "$status", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const byStatus = new Map(groups.map((group) => [group._id, group]));
  const amount = (status: PayoutStatus) => byStatus.get(status)?.amount ?? 0;
  const counts = Object.fromEntries(
    PAYOUT_STATUSES.map((status) => [status, byStatus.get(status)?.count ?? 0])
  ) as Record<PayoutStatus, number>;
  return { amount, counts: { all: groups.reduce((sum, group) => sum + group.count, 0), ...counts } };
};

const getSummary = async (instructor: Types.ObjectId) => {
  const [totalEarnings, totals] = await Promise.all([getTotalEarnings(instructor), getTotalsByStatus({ instructor })]);
  const withdrawn = totals.amount("Paid");
  const pending = totals.amount("Pending");
  return {
    summary: {
      totalEarnings,
      withdrawn,
      pending,
      available: Math.max(0, totalEarnings - withdrawn - pending),
      minAmount: MIN_PAYOUT_AMOUNT,
      hasPendingRequest: totals.counts.Pending > 0,
    },
    counts: totals.counts,
  };
};

const maskAccountNumber = (accountNumber: string) => `•••• ${accountNumber.slice(-4)}`;

// Instructors only ever see the last digits of the account they entered.
const toInstructorView = ({ bankAccount, ...payout }: PayoutDoc) => ({
  ...withReceiptSummary(payout),
  ...(bankAccount && { bankAccount: { ...bankAccount, accountNumber: maskAccountNumber(bankAccount.accountNumber) } }),
});

// Balance, per-status counts (for the filter tabs) and the instructor's requests, newest first.
export const getInstructorPayouts = async (instructorId: string, status?: PayoutStatus) => {
  const instructor = new Types.ObjectId(instructorId);
  const [{ summary, counts }, requests] = await Promise.all([
    getSummary(instructor),
    Payout.find(status ? { instructor, status } : { instructor }, "-instructor").sort({ _id: -1 }).lean<PayoutDoc[]>(),
  ]);
  return { summary, counts, requests: requests.map(toInstructorView) };
};

export const createPayout = async (instructorId: string, input: PayoutInput) => {
  const instructor = new Types.ObjectId(instructorId);
  const { summary } = await getSummary(instructor);

  if (summary.hasPendingRequest) {
    throw AppError.conflict("You already have a pending withdrawal request");
  }
  if (input.amount < MIN_PAYOUT_AMOUNT) {
    throw AppError.badRequest(`The minimum withdrawal is ₹${MIN_PAYOUT_AMOUNT}`);
  }
  if (input.amount > summary.available) {
    throw AppError.badRequest("Amount exceeds your available balance");
  }

  try {
    const payout = await Payout.create({ instructor, status: "Pending", ...input });
    return toInstructorView(payout.toObject());
  } catch (error) {
    // The partial unique index caught a request created concurrently.
    if ((error as { code?: number }).code === 11000) {
      throw AppError.conflict("You already have a pending withdrawal request");
    }
    throw error;
  }
};

export const cancelPayout = async (instructorId: string, payoutId: string) => {
  const payout = await Payout.findOneAndUpdate(
    { _id: payoutId, instructor: instructorId, status: "Pending" },
    { status: "Cancelled" },
    { new: true }
  ).lean<PayoutDoc>();
  if (!payout) {
    throw AppError.notFound("No pending request found");
  }
  return toInstructorView(payout);
};

export const ADMIN_PAGE_SIZE = 20;

export interface AdminPayoutQuery {
  status?: PayoutStatus;
  search?: string;
  page: number;
}

// Instructors whose name or email matches the search.
const findInstructorIds = async (search: string) => {
  const pattern = escapeRegex(search);
  const users = await User.find(
    {
      accountType: "Instructor",
      $or: [
        { email: { $regex: pattern, $options: "i" } },
        { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: pattern, options: "i" } } },
      ],
    },
    "_id"
  ).lean();
  return users.map((user) => user._id);
};

// Super admin view: full payout details and who raised each request, newest first.
// `counts`/`amounts` ignore the status filter (but respect the search) so the tabs always show their totals.
export const getAllPayouts = async ({ status, search, page }: AdminPayoutQuery) => {
  const base: FilterQuery<IPayout> = search ? { instructor: { $in: await findInstructorIds(search) } } : {};
  const filter = status ? { ...base, status } : base;

  const [requests, total, totals] = await Promise.all([
    Payout.find(filter)
      .sort({ _id: -1 })
      .skip((page - 1) * ADMIN_PAGE_SIZE)
      .limit(ADMIN_PAGE_SIZE)
      .populate("instructor", "firstName lastName email image")
      .lean(),
    Payout.countDocuments(filter),
    getTotalsByStatus(base),
  ]);

  return {
    requests: requests.map(withReceiptSummary),
    counts: totals.counts,
    amounts: Object.fromEntries(PAYOUT_STATUSES.map((key) => [key, totals.amount(key)])),
    page,
    totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
};

// Receipts can show bank details, so they're private assets that are only reachable through signed links.
const uploadReceipt = async (receipt: UploadedFile): Promise<IReceipt> => {
  const resourceType = receipt.mimetype === "application/pdf" ? "raw" : "image";
  try {
    const { public_id, format } = await uploadToCloudinary(receipt, {
      subfolder: "payout-receipts",
      resource_type: resourceType,
      type: "private",
    });
    // Raw uploads have no `format`; their public id keeps the extension instead.
    return { publicId: public_id, resourceType, format: format ?? "" };
  } catch (error) {
    console.error("Receipt upload failed:", error);
    throw AppError.badGateway("Could not upload the receipt. Try again");
  }
};

// Clients only learn that a receipt exists (and its type); the file itself needs a signed link.
const withReceiptSummary = <T extends { receipt?: IReceipt }>({ receipt, ...payout }: T) => ({
  ...payout,
  ...(receipt && { receipt: { format: receipt.format || receipt.publicId.split(".").pop() } }),
});

// A link valid for a few minutes. Pass `instructorId` to restrict it to that instructor's own requests.
export const getReceiptUrl = async (payoutId: string, instructorId?: string): Promise<string> => {
  const payout = await Payout.findOne(
    instructorId ? { _id: payoutId, instructor: instructorId } : { _id: payoutId },
    "receipt"
  ).lean();
  if (!payout?.receipt) {
    throw AppError.notFound("No receipt found for this request");
  }
  const { publicId, format, resourceType } = payout.receipt;
  return getPrivateDownloadUrl(publicId, format, resourceType);
};

export const processPayout = async (payoutId: string, { status, reference, adminNote }: PayoutDecision, receipt?: UploadedFile) => {
  if (!(await Payout.exists({ _id: payoutId, status: "Pending" }))) {
    throw AppError.notFound("No pending request found");
  }

  const uploaded = receipt ? await uploadReceipt(receipt) : undefined;
  const payout = await Payout.findOneAndUpdate(
    { _id: payoutId, status: "Pending" },
    { status, reference, adminNote, receipt: uploaded, processedAt: new Date() },
    { new: true }
  ).lean<PayoutDoc>();

  if (!payout) {
    // Processed (or cancelled) by someone else while the receipt was uploading.
    if (uploaded) deleteFromCloudinary(uploaded.publicId, uploaded.resourceType, "private").catch(() => undefined);
    throw AppError.conflict("This request was already processed or cancelled");
  }

  const instructor = await User.findById(payout.instructor, "firstName email").lean();
  if (instructor) {
    sendMailSafe(
      instructor.email,
      status === "Paid" ? "Your withdrawal has been paid" : "Your withdrawal request was rejected",
      payoutStatusEmail(instructor.firstName, payout)
    );
  }
  return withReceiptSummary(payout);
};
