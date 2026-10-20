import { courseEnrollmentEmail } from "../../emails/courseEnrollment";
import { sendMailSafe } from "../../lib/mailer";
import { AppError } from "../../shared/errors";
import { Course } from "../courses/course.model";
import { CourseProgress } from "../progress/courseProgress.model";
import { User } from "../users/user.model";

// Idempotent: enrolling twice in the same course is a no-op, and the email only goes out once.
export const enrollStudent = async (userId: string, courseIds: string[]): Promise<void> => {
  const [user, courses] = await Promise.all([
    User.findById(userId, "firstName email").lean(),
    Course.find({ _id: { $in: courseIds } }, "courseName").lean(),
  ]);

  if (!user) {
    throw AppError.notFound("User not found");
  }
  if (courses.length !== courseIds.length) {
    throw AppError.notFound("Course not found");
  }

  await Promise.all(
    courses.map(async (course) => {
      const [enrollment, progress] = await Promise.all([
        Course.updateOne({ _id: course._id }, { $addToSet: { studentsEnrolled: userId } }),
        CourseProgress.findOneAndUpdate(
          { courseID: course._id, userId },
          { $setOnInsert: { completedVideos: [] } },
          { upsert: true, new: true }
        ).lean(),
      ]);

      await User.updateOne(
        { _id: userId },
        { $addToSet: { courses: course._id, ...(progress && { courseProgress: progress._id }) } }
      );

      // Unmodified means the student was already enrolled (e.g. the webhook got here first).
      if (enrollment.modifiedCount === 0) return;
      sendMailSafe(
        user.email,
        `Successfully Enrolled into ${course.courseName}`,
        courseEnrollmentEmail(course.courseName ?? "", user.firstName)
      );
    })
  );
};
