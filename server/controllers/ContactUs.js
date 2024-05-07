const mailSender = require("../utils/mailSender");
const {contactUsEmail} = require("../mail/templates/contactFormRes");

exports.handleContactUs = async (req, res) => {
    try {
        const { email, firstname, lastname, message, phoneNo, countrycode } = req.body;
        await mailSender(email, "Your Data send successfully", contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode))
        await mailSender("mohdmozzam27@gmail.com", "Someone Send this data to you", contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode))

        return res.status(201).json({ success: true, message: "Email send successfully" });
    } catch (ex) {
        console.error(ex);
        return res.status(400).json({ success: false, message: "Something went wrong" });
    }
};