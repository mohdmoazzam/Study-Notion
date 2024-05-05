import React from 'react';
import Logo1 from "../../../assets/TimeLineLogo/Logo1.svg";
import Logo2 from "../../../assets/TimeLineLogo/Logo2.svg";
import Logo3 from "../../../assets/TimeLineLogo/Logo3.svg";
import Logo4 from "../../../assets/TimeLineLogo/Logo4.svg";
import timeLineImage from "../../../assets/Images/TimelineImage.png"

const timeLine = [
    {
        logo: Logo1,
        Heading: "Leadership",
        Description: "Fully commited to the success company"
    },
    {
        logo: Logo2,
        Heading: "Leadership",
        Description: "Fully commited to the success company"
    },
    {
        logo: Logo3,
        Heading: "Leadership",
        Description: "Fully commited to the success company"
    },
    {
        logo: Logo4,
        Heading: "Leadership",
        Description: "Fully commited to the success company"
    }
]
export const TimelineSection = () => {
    return (
        <div>
            <div className='flex flex-row gap-16 items-center'>
                {/* Left Part */}
                <div className='w-[45%] flex flex-col gap-11'>
                    {
                        timeLine.map((ele, i) => {
                            return (
                                <div className="flex flex-col lg:gap-3" key={i}>
                                    <div className="flex gap-6" key={i}>
                                        <div className="w-[52px] h-[52px] bg-white rounded-full flex justify-center items-center shadow-[#00000012] shadow-[0_0_62px_0]">
                                            <img src={ele.logo} alt="" />
                                        </div>
                                        <div>
                                            <h2 className="font-semibold text-[18px]">{ele.Heading}</h2>
                                            <p className="text-base">{ele.Description}</p>
                                        </div>
                                    </div>
                                    <div
                                        className={`hidden ${timeLine.length - 1 === i ? "hidden" : "lg:block"
                                            }  h-14 border-dotted border-r border-richblack-100 bg-richblack-400/0 w-[26px]`}
                                    ></div>
                                </div>
                            );

                        })
                    }

                </div>

                {/* Right Part */}
                <div className='relative shadow-blue-200'>

                    <img src={timeLineImage} alt="timeLineImage"
                        className='shadow-white object-cover h-fit' />

                    <div className='absolute bg-caribbeangreen-700 flex flex-row text-white uppercase 
                    py-7 left-[50%] translate-x-[-50%] translate-y-[-50%]'>
                        <div className='flex flex-row gap-5 items-center border-r border-caribbeangreen-300
                        px-7'>
                            <p className='text-3xl text-bold'>10</p>
                            <p className='text-caribbeangreen-300 text-sm'>Years of Experience</p>
                        </div>

                        <div className='flex gap-5 items-center px-7'>
                            <p className='text-3xl text-bold'>250</p>
                            <p className='text-caribbeangreen-300 text-sm'>Type of Courses</p>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    )
}
