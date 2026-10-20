import { toast } from "react-hot-toast";

import { setLoading, setToken } from "../../slices/authSlice";
import { resetCart } from "../../slices/cartSlice";
import { setUser } from "../../slices/profileSlice";
import { apiConnector } from "../apiconnector";
import { endpoints } from "../apis";

const {
  SENDOTP_API,
  SIGNUP_API,
  LOGIN_API,
  GOOGLE_AUTH_API,
  RESETPASSTOKEN_API,
  RESETPASSWORD_API,
} = endpoints;

export function sendOtp(email, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", SENDOTP_API, {
        email,
        checkUserPresent: true,
      });
      console.log("SENDOTP API RESPONSE............", response);


      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("OTP Sent Successfully");
      navigate("/verify-email");
    } catch (error) {
      console.log("SENDOTP API ERROR............", error);
      toast.error("Could Not Send OTP");
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

export function signUp(
  accountType,
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  otp,
  navigate
) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", SIGNUP_API, {
        accountType,
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        otp,
      });

      console.log("SIGNUP API RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      toast.success("Signup Successful");
      navigate("/login");
    } catch (error) {
      console.log("SIGNUP API ERROR............", error);
      toast.error(error.response.data.message);
      navigate("/signup");
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

export function login(email, password, accountType, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", LOGIN_API, {
        email,
        password,
        accountType,
      });

      console.log("LOGIN API RESPONSE............", response.data.user);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Login Successful");
      startSession(dispatch, response.data, navigate);
    } catch (error) {
      console.log("LOGIN API ERROR............", error);
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

// Logs in with a Google ID token, creating an `accountType` account when the email is new.
export function googleLogin(credential, accountType, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", GOOGLE_AUTH_API, {
        credential,
        accountType,
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success(response.data.created ? "Account created" : "Login Successful");
      startSession(dispatch, response.data, navigate);
    } catch (error) {
      console.log("GOOGLE AUTH API ERROR............", error);
      toast.error(error.response?.data?.message || "Google sign-in failed. Please try again.");
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

function startSession(dispatch, { token, user }, navigate) {
  dispatch(setToken(token));
  const userImage = user?.image
    ? user.image
    : `https://api.dicebear.com/5.x/initials/svg?seed=${user.firstName} ${user.lastName}`;
  dispatch(setUser({ ...user, image: userImage }));
  localStorage.setItem("token", JSON.stringify(token));
  navigate("/dashboard/my-profile");
}

// Asks the server to email a password reset link. Resolves to { ok: true } or { error, notFound }
// so the forgot-password page can show the outcome inline.
export async function requestPasswordReset(email) {
  try {
    const response = await apiConnector("POST", RESETPASSTOKEN_API, { email });
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    return { ok: true };
  } catch (error) {
    console.log("RESETPASSTOKEN ERROR............", error);
    return {
      error: error.response?.data?.message ?? "Couldn't send the email. Check your connection and try again.",
      notFound: error.response?.status === 404,
    };
  }
}

export function resetPassword(password, confirmPassword, token, navigate) {
  return async (dispatch) => {
    const toastId = toast.loading("Loading...");
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("POST", RESETPASSWORD_API, {
        password,
        confirmPassword,
        token,
      });

      console.log("RESETPASSWORD RESPONSE............", response);

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      toast.success("Password Reset Successfully");
      navigate("/login");
    } catch (error) {
      console.log("RESETPASSWORD ERROR............", error);
      toast.error(error.response.data.message);
    }
    dispatch(setLoading(false));
    toast.dismiss(toastId);
  };
}

export function logout(navigate) {
  return (dispatch) => {
    dispatch(setToken(null));
    dispatch(setUser(null));
    dispatch(resetCart());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged Out");
    navigate("/");
  };
}
