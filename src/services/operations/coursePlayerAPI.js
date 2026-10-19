import { toast } from "react-hot-toast";

import { apiConnector } from "../apiconnector";
import { courseEndpoints } from "../apis";

const { GET_FULL_COURSE_DETAILS_AUTHENTICATED, LECTURE_COMPLETION_API, CREATE_RATING_API } = courseEndpoints;

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// Course content and progress for the player: { course, completedVideos } or { error, status }.
// The page shows its own loading and error states, so this stays quiet.
export const fetchCoursePlayer = async (courseId, token) => {
  try {
    const response = await apiConnector("GET", `${GET_FULL_COURSE_DETAILS_AUTHENTICATED}/${courseId}`, null, authHeader(token));
    const { courseDetails, completedVideos } = response.data.data ?? {};
    return { course: courseDetails, completedVideos: (completedVideos ?? []).map(String) };
  } catch (error) {
    console.log("COURSE PLAYER API ERROR............", error);
    return {
      error: error.response?.data?.message ?? "Check your connection and try again.",
      status: error.response?.status,
    };
  }
};

// Resolves to true once the lecture is recorded as complete (including when it already was).
export const completeLecture = async (token, courseId, subSectionId) => {
  try {
    await apiConnector("POST", LECTURE_COMPLETION_API, { courseId, subSectionId }, authHeader(token));
    return true;
  } catch (error) {
    if (/already completed/i.test(error.response?.data?.message ?? "")) return true;
    console.log("LECTURE COMPLETION API ERROR............", error);
    toast.error(error.response?.data?.message ?? "Could not save your progress");
    return false;
  }
};

// Returns "created", "duplicate" (the student already reviewed this course) or null on failure.
export const submitReview = async (token, { courseId, rating, review }) => {
  try {
    await apiConnector("POST", CREATE_RATING_API, { courseId, rating, review }, authHeader(token));
    toast.success("Thanks for your review!");
    return "created";
  } catch (error) {
    if (error.response?.status === 409) {
      toast("You've already reviewed this course");
      return "duplicate";
    }
    console.log("CREATE RATING API ERROR............", error);
    toast.error(error.response?.data?.message ?? "Could not post your review");
    return null;
  }
};
