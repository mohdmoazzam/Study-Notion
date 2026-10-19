import { asyncHandler, sendSuccess } from "../../shared/http";
import { requireFields, requireUser } from "../../shared/request";
import * as sectionService from "./section.service";

const MISSING_PROPERTIES = "Missing required properties";

export const createSection = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["sectionName", "courseId"], MISSING_PROPERTIES);

  const updatedCourse = await sectionService.createSection(id, req.body.courseId, req.body.sectionName);
  sendSuccess(res, 200, { updatedCourse });
});

export const updateSection = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["sectionName", "sectionId"], MISSING_PROPERTIES);

  const course = await sectionService.updateSection(id, req.body.sectionId, req.body.sectionName);
  sendSuccess(res, 200, { message: "Section updated", data: course });
});

export const deleteSection = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["sectionId", "courseId"], MISSING_PROPERTIES);

  const course = await sectionService.deleteSection(id, req.body.courseId, req.body.sectionId);
  sendSuccess(res, 200, { message: "Section deleted", data: course });
});
