import { AppError } from "../../shared/errors";
import { Course } from "./course.model";
import { assertCourseOwner, courseContentPopulate, findCourseWithContent } from "./course.queries";
import { Section } from "./section.model";
import { SubSection } from "./subSection.model";

export const createSection = async (instructorId: string, courseId: string, sectionName: string) => {
  await assertCourseOwner({ _id: courseId }, instructorId);

  const section = await Section.create({ sectionName });
  return Course.findByIdAndUpdate(courseId, { $push: { courseContent: section._id } }, { new: true })
    .populate(courseContentPopulate())
    .lean();
};

// Returns the whole course: the course builder replaces its course state with this payload.
export const updateSection = async (instructorId: string, sectionId: string, sectionName: string) => {
  const courseId = await assertCourseOwner({ courseContent: sectionId }, instructorId);
  await Section.updateOne({ _id: sectionId }, { sectionName });
  return findCourseWithContent(courseId);
};

export const deleteSection = async (instructorId: string, courseId: string, sectionId: string) => {
  await assertCourseOwner({ _id: courseId, courseContent: sectionId }, instructorId);

  const section = await Section.findById(sectionId, "subSection").lean();
  if (!section) {
    throw AppError.notFound("Section not Found");
  }

  await Promise.all([
    Course.updateOne({ _id: courseId }, { $pull: { courseContent: sectionId } }),
    SubSection.deleteMany({ _id: { $in: section.subSection } }),
    Section.deleteOne({ _id: sectionId }),
  ]);

  return findCourseWithContent(courseId);
};
