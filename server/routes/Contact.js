const express = require("express");
const { handleContactUs } = require("../controllers/ContactUs");
const router = express.Router();


router.post("/contact", handleContactUs);

module.exports = router;