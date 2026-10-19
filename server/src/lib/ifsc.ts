import { AppError } from "../shared/errors";

// Razorpay's public IFSC directory: https://github.com/razorpay/ifsc (no API key needed).
const IFSC_API_URL = "https://ifsc.razorpay.com";
const TIMEOUT_MS = 5000;
const MAX_CACHED = 500;

export interface IfscDetails {
  ifsc: string;
  bank: string;
  branch: string;
  city: string;
  state: string;
  // Whether the branch can receive NEFT / IMPS transfers.
  canReceiveTransfers: boolean;
}

interface IfscApiResponse {
  IFSC: string;
  BANK: string;
  BRANCH: string;
  CITY: string;
  STATE: string;
  NEFT?: boolean;
  IMPS?: boolean;
}

// Branch details almost never change, so lookups are cached for the life of the process.
const cache = new Map<string, IfscDetails | null>();

const remember = (ifsc: string, details: IfscDetails | null) => {
  if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
  cache.set(ifsc, details);
  return details;
};

// Returns the branch for a (format-checked, upper-case) IFSC, or null if no such branch exists.
export const lookupIfsc = async (ifsc: string): Promise<IfscDetails | null> => {
  if (cache.has(ifsc)) return cache.get(ifsc)!;

  let response: Response;
  try {
    response = await fetch(`${IFSC_API_URL}/${encodeURIComponent(ifsc)}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    console.error("IFSC lookup failed:", error);
    throw AppError.badGateway("Could not verify the IFSC code right now. Try again");
  }

  if (response.status === 404) return remember(ifsc, null);
  if (!response.ok) {
    console.error(`IFSC lookup failed with status ${response.status}`);
    throw AppError.badGateway("Could not verify the IFSC code right now. Try again");
  }

  const data = (await response.json()) as IfscApiResponse;
  return remember(ifsc, {
    ifsc: data.IFSC,
    bank: data.BANK,
    branch: data.BRANCH,
    city: data.CITY,
    state: data.STATE,
    canReceiveTransfers: Boolean(data.NEFT || data.IMPS),
  });
};

// Like lookupIfsc, but rejects codes that don't exist or can't receive bank transfers.
export const verifyIfsc = async (ifsc: string): Promise<IfscDetails> => {
  const details = await lookupIfsc(ifsc);
  if (!details) {
    throw AppError.badRequest("No bank branch found for this IFSC code");
  }
  if (!details.canReceiveTransfers) {
    throw AppError.badRequest("This branch can't receive NEFT/IMPS transfers. Use another account");
  }
  return details;
};
