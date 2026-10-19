import React from "react";
import ContactDetails from "../components/ContactPage/ContactDetails";
import ContactForm from "../components/ContactPage/ContactForm";
import Footer from "../components/common/Footer";

const Contact = () => {
  return (
    <div>
      <div className="mx-auto mt-20 flex w-11/12 max-w-maxContent flex-col justify-between gap-10 text-richblack-5 lg:flex-row">
        <div className="lg:w-[40%]">
          <ContactDetails />
        </div>
        {/* Contact Form */}
        <div className="lg:w-[60%]">
          <ContactForm />
        </div>
      </div>
      <div className="my-20">
        <Footer />
      </div>
    </div>
  );
};

export default Contact;
