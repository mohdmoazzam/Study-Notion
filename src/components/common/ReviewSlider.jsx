import React, { useEffect, useState } from "react"
import ReactStars from "react-rating-stars-component"
 
import { Swiper, SwiperSlide } from "swiper/react"                // Import Swiper React components
import "swiper/css"                                              // Import Swiper styles
import "swiper/css/free-mode"
import "swiper/css/pagination"
import "../../App.css"
import { FaStar } from "react-icons/fa"                         // Icons

import { apiConnector } from "../../services/apiconnector"          // Get apiFunction and the endpoint
import { ratingsEndpoints } from "../../services/apis"

export const ReviewSlider = () => {
    const [reviews, setReviews] = useState([]);
    const truncateWords = 15;

    useEffect(() => {
        ; (async () => {
            const { data } = await apiConnector("GET", ratingsEndpoints.REVIEWS_DETAILS_API);
            if (data?.success) {
                setReviews(data?.data);
            }
        })()
    }, []);

    return (
        <div className='text-white'>
            <div className="my-[50px] h-[184px] max-w-maxContentTab lg:max-w-maxContent">
            <Swiper className="w-full " slidesPerView={3} spaceBetween={25} loop={true} freeMode={true} autoplay={{delay: 2500,  disableOnInteraction: false, }} >
                    {
                        reviews?.map((review, index) => (
                            <SwiperSlide key={index}>
                                <img
                                    src={review?.user?.image ? review?.user?.image : `https://api.dicebear.com/5.x/initials/svg?seed=${review?.user?.firstName} ${review?.user?.lastName}`}
                                    alt='Profile pic'
                                    className="h-9 w-9 rounded-full object-cover"
                                />
                                <p>{review?.user?.firstName} {review?.user?.lastName}</p>
                                <p>{review?.course?.courseName}</p>
                                <p>
                                    {review?.review}
                                </p>

                                <p>{review?.rating.toFixed(1)}</p>

                                <ReactStars
                                    count={5}
                                    value={review?.rating}
                                    size={20}
                                    edit={false}
                                    activeColor="#ffd700"
                                    emptyIcon={FaStar}
                                    filledIcon={FaStar}
                                />
                            </SwiperSlide>
                        ))
                    }
                </Swiper>
            </div>
        </div>
    )
}
