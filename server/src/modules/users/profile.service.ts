import type { UploadedFile } from "express-fileupload";
import { uploadToCloudinary } from "../../lib/cloudinary";
import { AppError } from "../../shared/errors";
import { convertSecondsToDuration, countSubSections, getTotalSeconds } from "../../shared/utils/duration";
import { Course } from "../courses/course.model";
import { courseContentPopulate, type PopulatedSection } from "../courses/course.queries";
import { CourseProgress } from "../progress/courseProgress.model";
import { RatingAndReview } from "../reviews/review.model";
import { Profile, type IProfile } from "./profile.model";
import { User } from "./user.model";

export interface ProfileUpdate extends IProfile {
  firstName?: string;
  lastName?: string;
}

export const getUserDetails = async (userId: string) => {
  const user = await User.findById(userId).populate("additionalDetails").lean();
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return user;
};

const getProfileId = async (userId: string) => {
  const user = await User.findById(userId, "additionalDetails").lean();
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return user.additionalDetails;
};

export const updateProfile = async (userId: string, { firstName, lastName, ...profile }: ProfileUpdate) => {
  const profileId = await getProfileId(userId);

  const nameUpdates = {
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
  };

  await Promise.all([
    Profile.updateOne({ _id: profileId }, profile),
    Object.keys(nameUpdates).length > 0 && User.updateOne({ _id: userId }, nameUpdates, { runValidators: true }),
  ]);

  return getUserDetails(userId);
};

export const deleteAccount = async (userId: string): Promise<void> => {
  const [profileId, reviews] = await Promise.all([
    getProfileId(userId),
    RatingAndReview.find({ user: userId }, "_id").lean(),
  ]);
  const reviewIds = reviews.map((review) => review._id);

  await Promise.all([
    Profile.deleteOne({ _id: profileId }),
    Course.updateMany(
      { $or: [{ studentsEnrolled: userId }, { ratingAndReviews: { $in: reviewIds } }] },
      { $pull: { studentsEnrolled: userId, ratingAndReviews: { $in: reviewIds } } }
    ),
    RatingAndReview.deleteMany({ _id: { $in: reviewIds } }),
    CourseProgress.deleteMany({ userId }),
    User.deleteOne({ _id: userId }),
  ]);
};

export const updateDisplayPicture = async (userId: string, picture: UploadedFile) => {
  const { secure_url } = await uploadToCloudinary(picture, { height: 1000, quality: "auto" });
  return User.findByIdAndUpdate(userId, { image: secure_url }, { new: true }).populate("additionalDetails").lean();
};

export const getEnrolledCourses = async (userId: string) => {
  const [user, progressDocs] = await Promise.all([
    User.findById(userId, "courses")
      .populate<{ courses: { _id: unknown; courseContent: PopulatedSection[] }[] }>({
        path: "courses",
        populate: courseContentPopulate("title timeDuration"),
      })
      .lean(),
    CourseProgress.find({ userId }, "courseID completedVideos").lean(),
  ]);

  if (!user) {
    throw AppError.notFound("User not found");
  }

  const completedByCourse = new Map(progressDocs.map((doc) => [String(doc.courseID), doc.completedVideos.length]));

  return user.courses.map((course) => {
    const totalLectures = countSubSections(course.courseContent);
    const completed = completedByCourse.get(String(course._id)) ?? 0;

    return {
      ...course,
      totalDuration: convertSecondsToDuration(getTotalSeconds(course.courseContent)),
      progressPercentage: totalLectures === 0 ? 100 : Math.round((completed / totalLectures) * 10000) / 100,
    };
  });
};

export const getInstructorDashboard = async (instructorId: string) => {
  const courses = await Course.find(
    { instructor: instructorId },
    "courseName courseDescription price studentsEnrolled"
  ).lean();

  return courses.map((course) => {
    const totalStudentsEnrolled = course.studentsEnrolled.length;
    return {
      _id: course._id,
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      totalStudentsEnrolled,
      totalAmountGenerated: totalStudentsEnrolled * (course.price ?? 0),
    };
  });
};
