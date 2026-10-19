import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { buyCourse } from '../services/operations/studentFeaturesAPI';
import { fetchCourseDetails } from '../services/operations/courseDetailsAPI';
import GetAvgRating from '../utils/avgRating';
import ConfirmationModal from '../components/common/ConfirmationModal';
import RatingStars from '../components/common/RatingStars';
import { BiInfoCircle } from "react-icons/bi"
import { HiOutlineGlobeAlt } from "react-icons/hi"
import { formattedDate } from '../utils/dateFormatter';
import CourseDetailsCard from '../components/core/course/CourseDetailsCard';
import ReactMarkdown from 'react-markdown'
import { CourseAccordionBar } from '../components/core/course/CourseAccordionBar';

export const CourseDetails = () => {

    const { user } = useSelector((state) => state.profile);
    const { token } = useSelector((state) => state.auth);
    const { loading } = useSelector((state) => state.profile);
    const { paymentLoading } = useSelector((state) => state.course);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [courseData, setCourseData] = useState(null);
    const [confirmationModal, setConfirmationModal] = useState(null);
    const [isActive, setIsActive] = useState(Array(0));

    const handleActive = (id) => {
        setIsActive(!isActive.includes(id) ? isActive.concat([id]) : isActive.filter((e) => e !== id))
    }


    useEffect(() => {
        const getCourseFullDetails = async () => {
            try {
                const result = await fetchCourseDetails(courseId);
                setCourseData(result);
            } catch (error) {
                console.log("Could not fetch details");
            }
        }
        getCourseFullDetails();
    }, [courseId]);

    const [avgReviewCount, setAvgReviewCount] = useState(0);
    useEffect(() => {
        const count = GetAvgRating(courseData?.data?.courseDetails?.ratingAndReviews);
        setAvgReviewCount(count);
    }, [courseData]);

    const [totalNoOfLectures, setTotalNoOfLecture] = useState(0);

    useEffect(() => {
        let lectures = 0;
        courseData?.data?.courseDetails?.courseContent?.forEach((sec) => {
            lectures += sec.subSection.length || 0
        });
        setTotalNoOfLecture(lectures);
    }, [courseData]);

    const handleBuyCourse = () => {
        if (token) {
            buyCourse(token, [courseId], user, navigate, dispatch);
            return;
        }
        setConfirmationModal({
            text1: "You are not logged in!",
            text2: "Please login to purchase course.",
            btn1Text: "Login",
            btn2Text: "Cancel",
            btn1Handler: () => navigate("/login"),
            btn2Handler: () => setConfirmationModal(null),
        })

    };


    return (
        <>
            <div className={`relative w-full bg-richblack-800`}>

                {/* Hero Section */}
                <div className="mx-auto box-content px-4 lg:w-[1260px] 2xl:relative ">

                    <div className="mx-auto grid min-h-[450px] max-w-maxContentTab justify-items-center py-8 lg:mx-0 lg:justify-items-start lg:py-0 xl:max-w-[810px]">

                        <div className="relative block max-h-[30rem] lg:hidden">
                            <div className="absolute bottom-0 left-0 h-full w-full shadow-[inset_0px_-64px_36px_-28px_rgb(var(--color-richblack-800))]"></div>
                            <img src={courseData?.data?.courseDetails.thumbnail} alt="course thumbnail" className="aspect-auto w-full" />
                        </div>

                        <div className={`z-30 my-5 flex flex-col justify-center gap-4 py-5 text-lg text-richblack-5`} >
                            <div>
                                <p className="text-4xl font-bold text-richblack-5 sm:text-[42px]"> {courseData?.data?.courseDetails.courseName} </p>
                            </div>
                            <p className={`text-richblack-200`}>{courseData?.data?.courseDetails.courseDescription}</p>
                            <div className="text-md flex flex-wrap items-center gap-2">
                                <span className="text-accent">{avgReviewCount}</span>
                                <RatingStars Review_Count={avgReviewCount} Star_Size={24} />
                                <span>{`(${courseData?.data?.courseDetails.ratingAndReviews.length} reviews)`}</span>
                                <span>{`${courseData?.data?.courseDetails.studentsEnrolled.length} students enrolled`}</span>
                            </div>
                            <div>
                                <p className=""> Created By {`${courseData?.data?.courseDetails.instructor.firstName} ${courseData?.data?.courseDetails.instructor.lastName}`} </p>
                            </div>
                            <div className="flex flex-wrap gap-5 text-lg">
                                <p className="flex items-center gap-2"> {" "}<BiInfoCircle /> Created at {formattedDate(courseData?.data?.courseDetails.createdAt)} </p>
                                <p className="flex items-center gap-2"> {" "} <HiOutlineGlobeAlt /> English </p>
                            </div>
                        </div>

                        <div className="flex w-full flex-col gap-4 border-y border-y-richblack-500 py-4 lg:hidden">
                            <p className="space-x-3 pb-4 text-3xl font-semibold text-richblack-5"> Rs. {courseData?.data?.courseDetails.price} </p>
                            <button className="yellowButton" onClick={handleBuyCourse}> Buy Now </button>
                            <button className="blackButton">Add to Cart</button>
                        </div>

                    </div>

                    {/* Courses Card */}
                    <div className="right-[1rem] top-[60px] mx-auto hidden min-h-[600px] w-1/3 max-w-[410px] translate-y-24 md:translate-y-0 lg:absolute lg:block">
                        {courseData?.data?.courseDetails && <CourseDetailsCard course={courseData.data.courseDetails} setConfirmationModal={setConfirmationModal} handleBuyCourse={handleBuyCourse} />}
                    </div>

                </div>

            </div>

            <div className="mx-auto box-content px-4 text-start text-richblack-5 lg:w-[1260px]">
                <div className="mx-auto max-w-maxContentTab lg:mx-0 xl:max-w-[810px]">
                    {/* What will you learn section */}
                    <div className="my-8 border border-richblack-600 p-8">
                        <p className="text-3xl font-semibold">What you'll learn</p>
                        <div className="mt-5">
                            <ReactMarkdown>{courseData?.data?.courseDetails?.whatYouWillLearn}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Course content section */}
                    <div className="max-w-[830px]">
                        <div className="flex flex-col gap-3">
                            <p className="text-[28px] font-semibold">Course Content</p>
                            <div className="flex flex-wrap justify-between gap-2">
                                <div className="flex gap-2">
                                    <span>{courseData?.data?.courseDetails?.courseContent?.length} {`section(s)`}</span>
                                    <span> {totalNoOfLectures} {`lecture(s)`} </span>
                                    <span>{courseData?.data?.totalDuration} total length</span>
                                </div>

                                <div>
                                    <button className="text-accent" onClick={() => setIsActive([])}> Collapse all sections </button>
                                </div>
                            </div>
                        </div>

                        {/* Course Details Accordion */}

                        <div className='py-4'>
                            {
                                courseData?.data?.courseDetails?.courseContent?.map((course, index) => (
                                    <CourseAccordionBar course={course} key={index} isActive={isActive} handleActive={handleActive} />
                                ))
                            }
                        </div>

                        {/* Author Details Section */}
                        <div className="mb-12 py-4">
                            <p className="text-[28px] font-semibold">Author</p>
                            <div className="flex items-center gap-4 py-4">
                                <img src = {courseData?.data?.courseDetails?.instructor.image ? courseData?.data?.courseDetails?.instructor.image : `https://api.dicebear.com/5.x/initials/svg?seed=${courseData?.data?.courseDetails?.instructor?.firstName} ${courseData?.data?.courseDetails?.instructor?.lastName}`} alt="Loading" 
                                className="h-14 w-14 rounded-full object-cover"
                                />
                                <p className="text-lg">{`${courseData?.data?.courseDetails?.instructor.firstName} ${courseData?.data?.courseDetails?.instructor.lastName}`}</p>
                            </div>
                            <p className="text-richblack-50">{courseData?.data?.courseDetails?.instructor?.additionalDetails?.about}</p>
                        </div>
                    </div>
                </div>
            </div>

            {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
        </>
    )
}
