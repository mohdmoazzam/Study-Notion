const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const crypto = require("crypto");

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const doesUserExist = await User.findOne({ email: email });
    if (doesUserExist) {
      return res.status(401).json({
        isSuccess: false,
        message: "User already registered",
      });
    }
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const otpPayload = { email, otp };
    await OTP.create(otpPayload);
    res.status(201).json({
      isSuccess: true,
      message: "OTP Sent Successfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      isSuccess: false,
      message: "Something Went Wrong",
    });
  }
};

exports.signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        isSuccess: false,
        message: "All fields are required",
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        isSuccess: false,
        message: "Password and confirm password does not match.Try again",
      });
    }

    const doesUserExist = await User.findOne({ email: email });
    if (doesUserExist) {
      return res.status(400).json({
        isSuccess: false,
        message: "User is already registered",
      });
    }
    const recentOtp = await OTP.find({ email: email })
      .sort({ createdAt: -1 })
      .limit(1);
    if (recentOtp.length === 0) {
      return res.status(400).json({
        isSuccess: false,
        message: "OTP not found",
      });
    }
    if (otp !== recentOtp[0].otp) {
      return res.status(400).json({
        isSuccess: false,
        message: "Invalid otp.Try again",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const profiledetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const createdUser = await User.create({
      firstName: firstName,
      lastName: lastName,
      email: email,
      contactNumber: contactNumber,
      password: hashedPassword,
      accountType: accountType,
      additionalDetails: profiledetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });
    return res.status(201).json({
      isSuccess: true,
      message: "User is registered successfully",
      createdUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      isSuccess: false,
      message: "Something went wrong.Try again",
    });
  }
};

exports.logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(403).json({
        isSuccess: false,
        message: "All fields are required",
      });
    }
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        isSuccess: false,
        message: "User is not registered",
      });
    }
    const passwordmatched = await bcrypt.compare(password, user.password);
    if (!passwordmatched) {
      return res.status(401).json({
        isSuccess: false,
        message: "Entered password is incorrect.Try again",
      });
    }
    const payload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    user.token = token;
    user.password = undefined;
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 100),
      httpOnly: true,
    };
    res.cookie("token", token, options).status(201).json({
      isSuccess: true,
      token,
      user,
      message: "Logged in successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      isSuccess: false,
      message: "Something went wrong.Try again",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id);
    const { oldPassword, newPassword } = req.body;
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (!isPasswordMatch) {
      // If old password does not match, return a 401 (Unauthorized) error
      return res
        .status(401)
        .json({ success: false, message: "The password is incorrect" });
    }

    // Update password
    const encryptedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: encryptedPassword },
      { new: true }
    );

    // Send notification email
    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );
      console.log("Email sent successfully:", emailResponse.response);
    } catch (error) {
      // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }

    // Return success response
    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
    console.error("Error occurred while updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error occurred while updating password",
      error: error.message,
    });
  }
};

exports.resetPasswordToken = async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({
        isSuccess: false,
        message: "All fields are required",
      });
    }
    const isUserExist = await User.findOne({ email: email });
    if (!isUserExist) {
      return res.status(404).json({
        isSuccess: false,
        message: "Email is not registered",
      });
    }
    const token = crypto.randomUUID();
    const user = await User.findOneAndUpdate(
      { email: email },
      { token: token, resetPasswordToken: Date.now() + 5 * 60 * 1000 },
      { new: true }
    );
    const url = `http://localhost:3000/update-password/${token}`;
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link: ${url}`
    );
    return res.status(200).json({
      isSuccess: true,
      message: "Please check your mail-box",
    });
  } catch (error) {
    return res.status(400).json({
      isSuccess: false,
      message: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.status(400).json({
        isSuccess: false,
        message: "Password not matching",
      });
    }
    const userDetails = await User.findOne({ token });
    if (!userDetails) {
      return res.status(401).json({
        isSuccess: false,
        message: "Token is invalid",
      });
    }
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(401).json({
        isSuccess: false,
        message: "Token is expired, please regenerate your token",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );
    return res.status(201).json({
      isSuccess: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      isSuccess: false,
      message: "Something went wrong.",
    });
  }
};
