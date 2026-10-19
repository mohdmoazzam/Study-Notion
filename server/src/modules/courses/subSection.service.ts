import type { UploadedFile } from "express-fileupload";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { AppError } from "../../shared/errors";
import { assertCourseOwner } from "./course.queries";
import { Section } from "./section.model";
import { SubSection, type ISubSection } from "./subSection.model";

export interface SubSectionInput {
  title?: string;
  description?: string;
}

const findSectionWithSubSections = (sectionId: string) => Section.findById(sectionId).populate("subSection").lean();

const assertCanEdit = async (instructorId: string, sectionId: string, subSectionId?: string): Promise<void> => {
  await Promise.all([
    assertCourseOwner({ courseContent: sectionId }, instructorId),
    subSectionId &&
      Section.exists({ _id: sectionId, subSection: subSectionId }).then((exists) => {
        if (!exists) throw AppError.notFound("SubSection not found");
      }),
  ]);
};

const uploadVideo = async (video: UploadedFile): Promise<Pick<ISubSection, "videoUrl" | "timeDuration">> => {
  const { secure_url, duration } = await uploadToCloudinary(video);
  return { videoUrl: secure_url, timeDuration: `${duration}` };
};

export const createSubSection = async (
  instructorId: string,
  sectionId: string,
  input: Required<SubSectionInput>,
  video: UploadedFile
) => {
  await assertCanEdit(instructorId, sectionId);

  const subSection = await SubSection.create({ ...input, ...(await uploadVideo(video)) });
  return Section.findByIdAndUpdate(sectionId, { $push: { subSection: subSection._id } }, { new: true })
    .populate("subSection")
    .lean();
};

export const updateSubSection = async (
  instructorId: string,
  sectionId: string,
  subSectionId: string,
  input: SubSectionInput,
  video?: UploadedFile
) => {
  await assertCanEdit(instructorId, sectionId, subSectionId);

  const updates: Partial<ISubSection> = { ...input, ...(video ? await uploadVideo(video) : {}) };
  await SubSection.updateOne({ _id: subSectionId }, updates);

  return findSectionWithSubSections(sectionId);
};

export const deleteSubSection = async (instructorId: string, sectionId: string, subSectionId: string) => {
  await assertCanEdit(instructorId, sectionId, subSectionId);

  await Promise.all([
    Section.updateOne({ _id: sectionId }, { $pull: { subSection: subSectionId } }),
    SubSection.deleteOne({ _id: subSectionId }),
  ]);

  return findSectionWithSubSections(sectionId);
};
