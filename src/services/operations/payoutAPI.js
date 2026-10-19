import { toast } from "react-hot-toast";

import { apiConnector } from "../apiconnector";
import { payoutEndpoints } from "../apis";

const { PAYOUT_REQUESTS_API, IFSC_LOOKUP_API } = payoutEndpoints;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Balance summary, per-status counts and the (optionally status-filtered) requests; null on failure.
export const fetchPayouts = async (token, params = {}) => {
  try {
    const response = await apiConnector("GET", PAYOUT_REQUESTS_API, null, authHeader(token), params);
    if (!response?.data?.success) {
      throw new Error("Could not fetch payouts");
    }
    const { data, counts, summary } = response.data;
    return { requests: data ?? [], counts: counts ?? {}, summary };
  } catch (error) {
    console.log("PAYOUT REQUESTS API ERROR............", error);
    toast.error("Could not load your payouts");
    return null;
  }
};

// Returns the created request, or null with the server's reason shown as a toast.
export const requestPayout = async (token, data) => {
  try {
    const response = await apiConnector("POST", PAYOUT_REQUESTS_API, data, authHeader(token));
    if (!response?.data?.success) {
      throw new Error("Could not submit your request");
    }
    toast.success("Withdrawal request submitted");
    return response.data.data;
  } catch (error) {
    console.log("CREATE PAYOUT API ERROR............", error);
    toast.error(error.response?.data?.message ?? "Could not submit your request");
    return null;
  }
};

// Looks up a branch while the form is being filled, so it stays quiet (no toasts).
// Returns { details } when found, { notFound: true } for unknown codes, or null if the lookup failed.
export const lookupIfsc = async (token, ifsc, signal) => {
  try {
    const response = await apiConnector("GET", `${IFSC_LOOKUP_API}/${encodeURIComponent(ifsc)}`, null, authHeader(token), undefined, signal);
    return { details: response.data.data };
  } catch (error) {
    if (error.response?.status === 404) return { notFound: true };
    if (error.name !== "CanceledError") console.log("IFSC LOOKUP API ERROR............", error);
    return null;
  }
};

// Signed, short-lived link to the receipt of one of the instructor's own requests; null on failure.
export const getMyReceiptUrl = async (token, payoutId) => {
  try {
    const response = await apiConnector("GET", `${PAYOUT_REQUESTS_API}/${payoutId}/receipt`, null, authHeader(token));
    return response.data.url;
  } catch (error) {
    console.log("RECEIPT URL API ERROR............", error);
    toast.error(error.response?.data?.message ?? "Could not open the receipt");
    return null;
  }
};

// Cancels a pending request; returns true on success.
export const cancelPayout = async (token, payoutId) => {
  try {
    const response = await apiConnector("PATCH", `${PAYOUT_REQUESTS_API}/${payoutId}/cancel`, null, authHeader(token));
    if (!response?.data?.success) {
      throw new Error("Could not cancel the request");
    }
    toast.success("Withdrawal request cancelled");
    return true;
  } catch (error) {
    console.log("CANCEL PAYOUT API ERROR............", error);
    toast.error(error.response?.data?.message ?? "Could not cancel the request");
    return false;
  }
};
