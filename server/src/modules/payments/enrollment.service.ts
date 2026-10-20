import { AppError } from "../../shared/errors";
import { Course } from "../courses/course.model";
import { notifySafe } from "../notifications/notification.service";
import { CourseProgress } from "../progress/courseProgress.model";
import { User } from "../users/user.model";

// Idempotent: enrolling twice in the same course is a no-op, and the email only goes out once.
export const enrollStudent = async (userId: string, courseIds: string[]): Promise<void> => {
  const [user, courses] = await Promise.all([
    User.findById(userId, "firstName lastName email").lean(),
    Course.find({ _id: { $in: courseIds } }, "courseName instructor price").lean(),
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
      notifySafe(
        "course.enrolled",
        { userId, email: user.email },
        { name: user.firstName, courseName: course.courseName ?? "" }
      );
      // And tell the instructor they have a new student.
      notifySafe(
        "course.newEnrollment",
        { userId: course.instructor.toString() },
        {
          studentName: `${user.firstName} ${user.lastName ?? ""}`.trim(),
          courseName: course.courseName ?? "your course",
          price: course.price ?? 0,
        }
      );
    })
  );
};
