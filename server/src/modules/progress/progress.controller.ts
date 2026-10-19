import { asyncHandler, sendSuccess } from "../../shared/http";
import { requireFields, requireUser } from "../../shared/request";
import * as progressService from "./progress.service";

export const updateCourseProgress = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["courseId", "subSectionId"]);

  await progressService.markLectureComplete(id, String(req.body.courseId), String(req.body.subSectionId));
  sendSuccess(res, 200, { message: "Course progress updated" });
});
