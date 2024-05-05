const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");
const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 300
    }
});
async function sendVerificationEmail(email, otp) {
    try {
        await mailSender(email, "Verification E-mail From StudyNotion", emailTemplate(otp));
    } catch (error) {
        console.log('Error occured while sending mail', error)
    }
};
OTPSchema.pre("save", async function (next) {
    if (this.isNew) {
        await sendVerificationEmail(this.email, this.otp);
    }
    next();
});
module.exports = mongoose.model("OTP", OTPSchema);