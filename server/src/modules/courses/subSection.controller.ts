import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { getUploadedFile, requireFields, requireUser } from "../../shared/request";
import * as subSectionService from "./subSection.service";

const MISSING_PROPERTIES = "Missing required properties";

export const createSubSection = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const video = getUploadedFile(req, "video");

  requireFields(req.body, ["sectionId", "title", "description"], "All Fields are Required");
  if (!video) {
    throw AppError.badRequest("All Fields are Required");
  }

  const { sectionId, title, description } = req.body;
  const section = await subSectionService.createSubSection(id, sectionId, { title, description }, video);
  sendSuccess(res, 201, { data: section });
});

export const updateSubSection = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["sectionId", "subSectionId"], MISSING_PROPERTIES);

  const { sectionId, subSectionId, title, description } = req.body;
  const section = await subSectionService.updateSubSection(
    id,
    sectionId,
    subSectionId,
    { title, description },
    getUploadedFile(req, "video")
  );
  sendSuccess(res, 200, { message: "Section updated successfully", data: section });
});

export const deleteSubSection = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  requireFields(req.body, ["sectionId", "subSectionId"], MISSING_PROPERTIES);

  const section = await subSectionService.deleteSubSection(id, req.body.sectionId, req.body.subSectionId);
  sendSuccess(res, 200, { message: "SubSection deleted successfully", data: section });
});
