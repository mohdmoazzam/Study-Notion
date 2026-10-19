import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import CountryCode from "../../../data/countrycode.json";
import toast from "react-hot-toast";
import { apiConnector } from "../../../services/apiconnector";
import { contactusEndpoint } from "../../../services/apis";

const ContactUsForm = () => {

  const { register, handleSubmit, reset, formState: { errors, isSubmitSuccessful } } = useForm();

  const submitContactForm = async (data) => {
    const toastId = toast.loading("Loading...")
    try {
      setLoading(true);
      await apiConnector("POST", contactusEndpoint.CONTACT_US_API, data);
    } catch (error) {
      console.error(error.message);
      toast.dismiss(toastId)
    }
    toast.dismiss(toastId);
    toast.success("Message sent successfully");
  };
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset({
        email: "",
        firstname: "",
        lastname: "",
        message: "",
        phoneNo: "",
      });
    }
  }, [reset, isSubmitSuccessful]);

  return (
    <form onSubmit={handleSubmit(submitContactForm)}>
      <div className="flex flex-col gap-14">
        <div className="flex gap-5 ">
          {/* FirstName */}
          <div className="flex flex-col gap-2 lg:w-[48%]">
            <label htmlFor="firstname" className="lable-style">
              First Name
            </label>
            <input
              type="text"
              name="firstname"
              id="firstname"
              className="form-style"
              placeholder="Enter your first name"
              {...register("firstname", { required: true })}
            />
            {errors.firstname && <span>Please enter your name</span>}
          </div>

          {/* LastName */}
          <div className="flex flex-col gap-2 lg:w-[48%]">
            <label htmlFor="lastname" className="lable-style">
              Last Name
            </label>
            <input
              type="text"
              name="lastname"
              id="lastname"
              className="form-style"
              placeholder="Enter your last name"
              {...register("lastname")}
            />
          </div>
        </div>
        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="lable-style">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            className="form-style"
            placeholder="Enter email Address"
            {...register("email", { required: true })}
          />
          {errors.email && <span>Please enter your email address</span>}
        </div>

        {/* PhoneNo */}
        <div className="flex flex-col gap-2">
          <label htmlFor="phonenumber" className="lable-style">
            Phone Number
          </label>

          <div className="flex gap-5 justify-center items-center">
            <div className="flex w-[81px] flex-col gap-2">
              <select
                type="text"
                name="firstname"
                id="firstname"
                placeholder="Enter first name"
                className="form-style"
                {...register("countrycode", { required: true })}
              >
                {CountryCode.map((ele, i) => {
                  return (
                    <option key={i} value={ele.code}>
                      {ele.code} -{ele.country}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex w-[calc(100%-90px)] flex-col gap-2">
              <input
                type="number"
                name="phonenumber"
                id="phonenumber"
                placeholder="12345 67890"
                className="form-style"
                {...register("phoneNo", {
                  required: {
                    value: true,
                    message: "Please enter your Phone Number.",
                  },
                  maxLength: { value: 12, message: "Invalid Phone Number" },
                  minLength: { value: 10, message: "Invalid Phone Number" },
                })}
              />
            </div>
          </div>
          {errors.phoneNo && (
            <span className="-mt-1 text-[12px] text-accent">
              {errors.phoneNo.message}
            </span>
          )}
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="lable-style">
            Message
          </label>
          <textarea
            name="message"
            id="message"
            rows="7"
            cols="30"
            className="form-style"
            placeholder="Enter your message here"
            {...register("message", { required: true })}
          />
          {errors.message && <span>Please enter your message</span>}
        </div>
        <button
          disabled={loading}
          type="submit"
          className={`rounded-md bg-yellow-50 px-6 py-3 text-center text-[13px] font-bold text-black shadow-[2px_2px_0px_0px_rgba(255,255,255,0.18)] 
         ${!loading &&
            "transition-all duration-200 hover:scale-95 hover:shadow-none"
            }  disabled:bg-richblack-500 sm:text-[16px] `}
        >
          Send Message
        </button>
      </div>
    </form>
  );
};

export default ContactUsForm;
