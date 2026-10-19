import { open } from "fs/promises";
import type { UploadedFile } from "express-fileupload";
import { lookupIfsc as findBranch, verifyIfsc } from "../../lib/ifsc";
import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { getUploadedFile, isPresent, parseNonNegativeNumber, requireFields, requireUser } from "../../shared/request";
import { PAYOUT_METHODS, PAYOUT_STATUSES, type PayoutMethod, type PayoutStatus } from "./payout.model";
import * as payoutService from "./payout.service";
import type { PayoutDecision, PayoutDestination } from "./payout.service";

const MAX_NOTE_LENGTH = 300;
const UPI_ID = /^[a-z0-9._-]{2,256}@[a-z]{2,64}$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER = /^\d{9,18}$/;

const parseStatusFilter = (value: unknown): PayoutStatus | undefined => {
  if (value === undefined || value === "") return undefined;
  if (!PAYOUT_STATUSES.includes(value as PayoutStatus)) {
    throw AppError.badRequest(`status must be one of: ${PAYOUT_STATUSES.join(", ")}`);
  }
  return value as PayoutStatus;
};

const parseOptionalText = (value: unknown, field: string, maxLength = MAX_NOTE_LENGTH): string | undefined => {
  if (!isPresent(value)) return undefined;
  const text = String(value).trim();
  if (text.length > maxLength) {
    throw AppError.badRequest(`${field} must be at most ${maxLength} characters`);
  }
  return text || undefined;
};

// Withdrawals are in whole rupees.
const parseAmount = (value: unknown): number => {
  const amount = parseNonNegativeNumber(value, "amount");
  if (!Number.isInteger(amount)) {
    throw AppError.badRequest("Amount must be in whole rupees");
  }
  return amount;
};

const parseIfsc = (value: unknown): string => {
  const ifsc = String(value ?? "").trim().toUpperCase();
  if (!IFSC.test(ifsc)) {
    throw AppError.badRequest("Enter a valid IFSC code, e.g. HDFC0001234");
  }
  return ifsc;
};

// Format checks first, then the IFSC is verified against the bank directory.
const parseDestination = async (body: Record<string, unknown>): Promise<PayoutDestination> => {
  const method = body.method as PayoutMethod;
  if (!PAYOUT_METHODS.includes(method)) {
    throw AppError.badRequest(`method must be one of: ${PAYOUT_METHODS.join(", ")}`);
  }

  if (method === "UPI") {
    const upiId = String(body.upiId ?? "").trim().toLowerCase();
    if (!UPI_ID.test(upiId)) {
      throw AppError.badRequest("Enter a valid UPI ID, e.g. name@bank");
    }
    return { method, upiId };
  }

  const details = (body.bankAccount ?? {}) as Record<string, unknown>;
  const accountHolderName = String(details.accountHolderName ?? "").trim().replace(/\s+/g, " ");
  const accountNumber = String(details.accountNumber ?? "").replace(/\s+/g, "");

  if (accountHolderName.length < 2 || accountHolderName.length > 100) {
    throw AppError.badRequest("Enter the account holder's name");
  }
  if (!ACCOUNT_NUMBER.test(accountNumber)) {
    throw AppError.badRequest("Account number must be 9 to 18 digits");
  }
  const { ifsc, bank, branch } = await verifyIfsc(parseIfsc(details.ifsc));
  return { method, bankAccount: { accountHolderName, accountNumber, ifsc, bankName: bank, branch } };
};

// Lets the withdraw form show the bank and branch as soon as a valid IFSC is typed.
export const lookupIfsc = asyncHandler(async (req, res) => {
  const details = await findBranch(parseIfsc(req.params.ifsc));
  if (!details) {
    throw AppError.notFound("No bank branch found for this IFSC code");
  }
  sendSuccess(res, 200, { data: details });
});

// Query: ?status=Pending|Paid|Rejected|Cancelled (optional).
export const getMyPayouts = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const { summary, counts, requests } = await payoutService.getInstructorPayouts(id, parseStatusFilter(req.query.status));
  sendSuccess(res, 200, { data: requests, counts, summary });
});

export const createPayout = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["amount", "method"]);

  const data = await payoutService.createPayout(id, {
    ...(await parseDestination(req.body)),
    amount: parseAmount(req.body.amount),
    note: parseOptionalText(req.body.note, "note"),
  });
  sendSuccess(res, 201, { message: "Withdrawal request submitted", data });
});

export const cancelPayout = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const data = await payoutService.cancelPayout(id, req.params.payoutId);
  sendSuccess(res, 200, { message: "Withdrawal request cancelled", data });
});

// Signed, short-lived receipt link: instructors get their own requests' receipts, the super admin any.
export const getMyReceiptUrl = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  sendSuccess(res, 200, { url: await payoutService.getReceiptUrl(req.params.payoutId, id) });
});

export const getReceiptUrl = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, { url: await payoutService.getReceiptUrl(req.params.payoutId) });
});

// Query: ?status=<status>&search=<instructor name or email>&page=<n> (all optional).
export const getAllPayouts = asyncHandler(async (req, res) => {
  const { search, page } = req.query;
  const pageNumber = page === undefined ? 1 : Number(page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw AppError.badRequest("Invalid page");
  }

  const result = await payoutService.getAllPayouts({
    status: parseStatusFilter(req.query.status),
    search: typeof search === "string" ? search.trim().slice(0, 100) : "",
    page: pageNumber,
  });
  sendSuccess(res, 200, {
    data: result.requests,
    counts: result.counts,
    amounts: result.amounts,
    page: result.page,
    totalPages: result.totalPages,
  });
});

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
// The browser-reported type is checked against the file's first bytes.
const RECEIPT_SIGNATURES: Record<string, (head: Buffer) => boolean> = {
  "image/jpeg": (head) => head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff,
  "image/png": (head) => head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
  "image/webp": (head) => head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP",
  "application/pdf": (head) => head.toString("ascii", 0, 5) === "%PDF-",
};

const readFileHead = async (path: string): Promise<Buffer> => {
  const file = await open(path, "r");
  try {
    const { buffer, bytesRead } = await file.read(Buffer.alloc(12), 0, 12, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await file.close();
  }
};

const parseReceipt = async (receipt: UploadedFile | undefined): Promise<UploadedFile | undefined> => {
  if (!receipt) return undefined;
  if (receipt.size > MAX_RECEIPT_BYTES) {
    throw AppError.badRequest("Receipt must be 5 MB or smaller");
  }
  const matchesType = RECEIPT_SIGNATURES[receipt.mimetype];
  if (!matchesType || !matchesType(await readFileHead(receipt.tempFilePath))) {
    throw AppError.badRequest("Receipt must be a JPG, PNG, WebP or PDF file");
  }
  return receipt;
};

// Multipart body: { status: "Paid" | "Rejected", reference?, adminNote?, receipt? (file) }.
// Paid needs the transfer reference and a receipt; Rejected needs a reason in adminNote.
export const processPayout = asyncHandler(async (req, res) => {
  const status = req.body.status as PayoutDecision["status"];
  if (status !== "Paid" && status !== "Rejected") {
    throw AppError.badRequest("status must be Paid or Rejected");
  }
  const reference = parseOptionalText(req.body.reference, "reference", 100);
  const adminNote = parseOptionalText(req.body.adminNote, "adminNote");
  const receipt = await parseReceipt(getUploadedFile(req, "receipt"));

  if (status === "Paid" && !reference) {
    throw AppError.badRequest("A transaction reference is required");
  }
  if (status === "Paid" && !receipt) {
    throw AppError.badRequest("Upload the payment receipt");
  }
  if (status === "Rejected" && !adminNote) {
    throw AppError.badRequest("Give a reason for rejecting the request");
  }

  const data = await payoutService.processPayout(
    req.params.payoutId,
    { status, reference: status === "Paid" ? reference : undefined, adminNote },
    status === "Paid" ? receipt : undefined
  );
  sendSuccess(res, 200, { message: `Request marked as ${status}`, data });
});
