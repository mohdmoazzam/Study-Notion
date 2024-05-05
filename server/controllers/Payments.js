const { default: Mongoose, default: mongoose } = require("mongoose");
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const crypto = require("crypto");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");
const CourseProgress = require("../models/CourseProgress");


exports.capturePayment = async (req, res) => {
    const { courses } = req.body;
    const userId = req.user.id;

    if (courses.lenghth === 0) {
        return res.status(400).json({ success: false, message: "Please provide id" });
    }

    let totalAmount = 0;
    for (const course_id of courses) {
        let course;
        try {
            course = await Course.findById(course_id);
            if (!course) {
                return res.status(404).json({ success: false, message: "Could not find the course" });
            }

            const uid = new mongoose.Types.ObjectId(userId);

            if (course.studentsEnrolled.includes(uid)) {
                return res.status(409).json({ success: false, message: "Student is already enrolled" });
            }

            totalAmount += course.price;
        } catch (e) {
            console.log(e);
            return res.status(400).json({ success: false, message: e.message });
        }
    }

    const options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString()
    };

    try {
        const paymentResponse = await instance.orders.create(options);
        res.status(201).json({
            success: true,
            message: paymentResponse
        });
    } catch (e) {
        return res.status(400).json({ success: false, message: "Could not initiate order" });
    }
};

exports.verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body.razorpay_order_id;
    const razorpay_payment_id = req.body.razorpay_payment_id;
    const razorpay_signature = req.body.razorpay_signature;
    const courses = req.body.courses;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses) {
        return res.status(400).json({ success: false, message: "Payment failed" });
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        await enrollStudents(courses, userId, res);
        return res.status(200).json({ success: true, message: "Payment verified" });
    }
    return res.status(400).json({ success: false, message: "Payment failed" });
};

const enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
        return res.status(400).json({ success: false, message: "Please provide data" });
    }

    for (const courseId of courses) {
        const enrolledCourse = await Course.findByIdAndUpdate(
            { _id: courseId },
            { $push: { studentsEnrolled: userId } },
            { new: true }
        );

        if (!enrolledCourse) {
            return res.status(400).json({ success: false, message: "Course not found" });
        }
        const courseProgress = await CourseProgress.create({
            courseID: courseId,
            userId: userId,
            completedVideos: []
        });
        const enrolledStudent = await User.findByIdAndUpdate(userId,
            {
                $push: {
                    courses: courseId,
                    courseProgress: courseProgress._id
                }
            }, { new: true });
        const emailResponse = await mailSender(enrollStudents.email, `Successfully Enrolled into ${enrolledCourse.courseName}`, courseEnrollmentEmail(enrolledCourse.courseName, `${enrolledStudent.firstName}`))
    }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
    const { orderId, paymentId, amount } = req.body;

    const userId = req.user.id;

    if (!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({ success: false, message: "Please provide all the fields" });
    }

    try {
        //student ko dhundo
        const enrolledStudent = await User.findById(userId);
        await mailSender(
            enrolledStudent.email,
            `Payment Recieved`,
            paymentSuccessEmail(`${enrolledStudent.firstName}`,
                amount / 100, orderId, paymentId)
        )
    }
    catch (error) {
        console.log("error in sending mail", error)
        return res.status(500).json({ success: false, message: "Could not send email" })
    }
}