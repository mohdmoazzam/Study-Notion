const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");

exports.createRating = async (req, res) => {
    try {
        const userId = req.user.id;
        const { rating, review, courseId } = req.body;
        const courseDetails = await Course.findOne({ _id: courseId, studentsEnrolled: { $elemMatch: { $eq: userId } }, });

        if (!courseDetails) {
            return res.status(404).json({
                isSuccess: false,
                message: 'Student is not enrolled in the course'
            });
        }

        const isAlreadyReviewd = await RatingAndReview.findOne({ user: userId, Course: courseId });
        if (isAlreadyReviewd) {
            return res.status(403).json({
                isSuccess: false,
                message: 'Course is already reviewed by the user'
            });
        }

        const ratingReview = await RatingAndReview.create({
            rating: rating,
            review: review,
            course: courseId,
            user: userId
        });

        await Course.findByIdAndUpdate({ _id: courseId }, {
            $push: {
                ratingAndReviews: ratingReview._id
            }
        }, { new: true });

        return res.status(201).json({
            success: true,
            data: ratingReview
        });
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            isSuccess: false,
            message: error.message
        });
    }
};

exports.getAverageRating = async (req, res) => {
    try {
        const courseId = req.body.courseId;
        const response = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" }
                }
            }
        ]);
        if (response.length > 0) {
            return res.status(200).json({
                isSuccess: true,
                averageRating: response[0].averageRating
            });
        }

        return res.status(200).json({
            isSuccess: true,
            message: "Average rating is 0, no rating given till now",
            averageRating: 0
        });

    } catch (error) {
        return res.status(400).json({
            isSuccess: false,
            message: 'Something went wrong'
        });
    }
};

exports.getAllRating = async (req, res) => {
    try {
        const allReviews = await RatingAndReview.find({}).sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image",
            })
            .populate({
                path: "course",
                select: "courseName",
            }).exec();

        return res.status(200).json({
            success: true,
            data: allReviews
        });
    } catch (error) {
        return res.status(400).json({
            isSuccess: false,
            message: 'Something went wrong'
        });
    }
};