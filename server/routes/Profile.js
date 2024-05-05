const express = require("express")
const router = express.Router()
const { auth, isInstructor } = require("../middlewares/auth");
const { deleteUserAccount, updateUserProfile, getAllUserDetails, updateDisplayPicture, getEnrolledCourses , instructorDashboard} = require("../controllers/Profile");

router.delete("/deleteProfile", auth, deleteUserAccount);
router.put("/updateProfile", auth, updateUserProfile);
router.get("/getUserDetails", auth, getAllUserDetails);
router.get("/getEnrolledCourses", auth, getEnrolledCourses);
router.put("/updateDisplayPicture", auth, updateDisplayPicture);
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard)


module.exports = router