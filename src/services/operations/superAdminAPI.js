import { toast } from "react-hot-toast";

import { clearSuperAdminSession, saveSuperAdminSession } from "../../utils/superAdminSession";
import { apiConnector } from "../apiconnector";
import { superAdminEndpoints } from "../apis";

const { SUPER_ADMIN_LOGIN_API, SUPER_ADMIN_SESSION_API, SUPER_ADMIN_PAYOUTS_API } = superAdminEndpoints;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Thrown when the session is missing or expired, so pages can send the admin back to the login screen.
export class SessionExpiredError extends Error {}

const handleError = (error, fallback) => {
  if (error.response?.status === 401) {
    clearSuperAdminSession();
    toast.error("Your session has expired. Log in again");
    throw new SessionExpiredError();
  }
  toast.error(error.response?.data?.message ?? fallback);
};

// Returns the session on success, or null with the reason shown as a toast.
export const superAdminLogin = async (email, password) => {
  try {
    const response = await apiConnector("POST", SUPER_ADMIN_LOGIN_API, { email, password });
    const session = { token: response.data.token, email: response.data.email, expiresAt: response.data.expiresAt };
    saveSuperAdminSession(session);
    return session;
  } catch (error) {
    console.log("SUPER ADMIN LOGIN API ERROR............", error);
    toast.error(error.response?.data?.message ?? "Could not log in");
    return null;
  }
};

// Resolves to true when the stored token is still accepted by the server.
export const checkSuperAdminSession = async (token) => {
  try {
    await apiConnector("GET", SUPER_ADMIN_SESSION_API, null, authHeader(token));
    return true;
  } catch (error) {
    if (error.response?.status === 401) clearSuperAdminSession();
    return error.response?.status !== 401;
  }
};

// { requests, counts, amounts, page, totalPages }, or null on failure. Throws SessionExpiredError on 401.
export const fetchAllPayouts = async (token, params) => {
  try {
    const response = await apiConnector("GET", SUPER_ADMIN_PAYOUTS_API, null, authHeader(token), params);
    const { data, counts, amounts, page, totalPages } = response.data;
    return { requests: data ?? [], counts: counts ?? {}, amounts: amounts ?? {}, page, totalPages };
  } catch (error) {
    console.log("SUPER ADMIN PAYOUTS API ERROR............", error);
    handleError(error, "Could not load payout requests");
    return null;
  }
};

// Signed, short-lived link to a request's receipt; null on failure. Throws SessionExpiredError on 401.
export const getReceiptUrl = async (token, payoutId) => {
  try {
    const response = await apiConnector("GET", `${SUPER_ADMIN_PAYOUTS_API}/${payoutId}/receipt`, null, authHeader(token));
    return response.data.url;
  } catch (error) {
    console.log("SUPER ADMIN RECEIPT API ERROR............", error);
    handleError(error, "Could not open the receipt");
    return null;
  }
};

// `formData` carries status, reference, adminNote and the receipt file. Returns true on success.
export const processPayoutRequest = async (token, payoutId, formData) => {
  try {
    const response = await apiConnector("PATCH", `${SUPER_ADMIN_PAYOUTS_API}/${payoutId}`, formData, {
      ...authHeader(token),
      "Content-Type": "multipart/form-data",
    });
    toast.success(response.data.message ?? "Request updated");
    return true;
  } catch (error) {
    console.log("PROCESS PAYOUT API ERROR............", error);
    handleError(error, "Could not update the request");
    return false;
  }
};
