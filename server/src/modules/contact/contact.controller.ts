import { asyncHandler, sendSuccess } from "../../shared/http";
import { requireFields } from "../../shared/request";
import * as contactService from "./contact.service";

export const handleContactUs = asyncHandler(async (req, res) => {
  requireFields(req.body, ["email", "firstname", "message"]);
  const { email, firstname, lastname = "", message, phoneNo = "", countrycode = "" } = req.body;

  await contactService.sendContactMessage({
    email: String(email),
    firstName: firstname,
    lastName: lastname,
    message,
    phone: `${countrycode} ${phoneNo}`.trim(),
  });
  sendSuccess(res, 201, { message: "Email send successfully" });
});
