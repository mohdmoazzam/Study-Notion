import { toast } from "react-hot-toast";

import { setLoading, setUser } from "../../slices/profileSlice";
import { apiConnector } from "../apiconnector";
import { profileEndpoints } from "../apis";
import { logout } from "./authAPI";

const {
  GET_USER_DETAILS_API,
  GET_USER_ENROLLED_COURSES_API,
  GET_INSTRUCTOR_DATA_API,
} = profileEndpoints;

// Quietly re-syncs the signed-in user with the server (run on app load) so the UI never shows a stale cached profile.
// Logs out only when the session is rejected; network errors keep the cached user.
export function getUserDetails(token, navigate) {
  return async (dispatch) => {
    dispatch(setLoading(true));
    try {
      const response = await apiConnector("GET", GET_USER_DETAILS_API, null, {
        Authorization: `Bearer ${token}`,
      });
      if (!response.data.success) {
        throw new Error(response.data.message);
      }
      const user = response.data.data;
      const userImage = user.image || `https://api.dicebear.com/5.x/initials/svg?seed=${user.firstName} ${user.lastName}`;
      dispatch(setUser({ ...user, image: userImage }));
    } catch (error) {
      console.log("GET_USER_DETAILS API ERROR............", error);
      if ([401, 404].includes(error?.response?.status)) {
        toast.error("Your session has expired. Please log in again.");
        dispatch(logout(navigate));
      }
    }
    dispatch(setLoading(false));
  };
}

// The student's courses with progress; null when the request fails (vs [] for no courses).
export async function getUserEnrolledCourses(token) {
  let result = null;
  try {
    const response = await apiConnector("GET", GET_USER_ENROLLED_COURSES_API,
      null,
      {
        Authorization: `Bearer ${token}`,
      }
    );
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    result = response.data.data ?? [];
  } catch (error) {
    console.log("GET_USER_ENROLLED_COURSES_API API ERROR............", error);
    toast.error("Could not load your courses");
  }
  return result;
}

// Per-course stats for the instructor dashboard; null when the request fails (vs [] for no courses).
export async function getInstructorData(token) {
  try {
    const response = await apiConnector("GET", GET_INSTRUCTOR_DATA_API, null, { Authorization: `Bearer ${token}` });
    return response?.data?.courses ?? [];
  } catch (error) {
    console.log("GET_INSTRUCTOR_API ERROR", error);
    toast.error("Could not load your dashboard");
    return null;
  }
}
