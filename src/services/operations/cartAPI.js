import { apiConnector } from "../apiconnector";
import { courseEndpoints } from "../apis";

const { COURSE_DETAILS_API } = courseEndpoints;

// Re-fetches every course in the cart so prices and ratings are current.
// Returns { courses, removed }: courses that were deleted or unpublished are dropped and named in `removed`;
// a course that couldn't be checked (e.g. offline) keeps its saved copy.
export const refreshCartCourses = async (cart) => {
  const results = await Promise.all(
    cart.map(async (item) => {
      try {
        const response = await apiConnector("POST", COURSE_DETAILS_API, { courseId: item._id });
        const fresh = response.data?.data?.courseDetails;
        if (!fresh || fresh.status !== "Published") return { item, available: false };
        return { item: fresh, available: true };
      } catch (error) {
        const gone = error.response?.status === 404 || error.response?.status === 400;
        return { item, available: !gone };
      }
    })
  );

  return {
    courses: results.filter((result) => result.available).map((result) => result.item),
    removed: results.filter((result) => !result.available).map((result) => result.item.courseName),
  };
};
