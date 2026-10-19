import { AppError } from "../../shared/errors";
import { SubSection } from "../courses/subSection.model";
import { CourseProgress } from "./courseProgress.model";

export const markLectureComplete = async (userId: string, courseId: string, subSectionId: string): Promise<void> => {
  const [subSectionExists, progress] = await Promise.all([
    SubSection.exists({ _id: subSectionId }),
    CourseProgress.findOne({ courseID: courseId, userId }, "completedVideos").lean(),
  ]);

  if (!subSectionExists) {
    throw AppError.notFound("Invalid SubSection");
  }
  if (!progress) {
    throw AppError.notFound("Course progress does not exist");
  }
  if (progress.completedVideos.some((id) => id.toString() === subSectionId)) {
    throw AppError.badRequest("Subsection already completed");
  }

  await CourseProgress.updateOne({ _id: progress._id }, { $addToSet: { completedVideos: subSectionId } });
};
