import { AppError } from "../../shared/errors";
import { asyncHandler, sendSuccess } from "../../shared/http";
import { getUploadedFile, requireUser } from "../../shared/request";
import * as profileService from "./profile.service";

export const updateProfile = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const { firstName, lastName, dateOfBirth = "", about = "", contactNumber = "", gender = "" } = req.body;

  const updatedUserDetails = await profileService.updateProfile(id, {
    firstName,
    lastName,
    dateOfBirth,
    about,
    contactNumber,
    gender,
  });
  sendSuccess(res, 200, { message: "Profile updated successfully", updatedUserDetails });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  await profileService.deleteAccount(id);

  res.clearCookie("token");
  sendSuccess(res, 200, { message: "User deleted successfully" });
});

export const getUserDetails = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  sendSuccess(res, 200, { message: "User Data fetched successfully", data: await profileService.getUserDetails(id) });
});

export const updateDisplayPicture = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  const picture = getUploadedFile(req, "displayPicture");
  if (!picture) {
    throw AppError.badRequest("Display picture is required");
  }

  const user = await profileService.updateDisplayPicture(id, picture);
  sendSuccess(res, 200, { message: "Image Updated successfully", data: user });
});

export const getEnrolledCourses = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  sendSuccess(res, 200, { data: await profileService.getEnrolledCourses(id) });
});

export const getInstructorDashboard = asyncHandler(async (req, res) => {
  const { id } = requireUser(req);
  sendSuccess(res, 200, { courses: await profileService.getInstructorDashboard(id) });
});
