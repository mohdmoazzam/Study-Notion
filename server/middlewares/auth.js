const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      console.log(error);
      return res.status(401).json({
        isSuccess: false,
        message: "Token is missing",
      });
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      isSuccess: false,
      message: "Token is invalid",
    });
  }
};

exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Student") {
      return res.status(403).json({
        isSuccess: false,
        message: "This is a protected route for students only",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      isSuccess: false,
      message: "Something went wrong.Try again",
    });
  }
};

exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Instructor") {
      return res.status(403).json({
        isSuccess: false,
        message: "This is a protected route for instructor only",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      isSuccess: false,
      message: "Something went wrong.Try again",
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== "Admin") {
      return res.status(403).json({
        isSuccess: false,
        message: "This is a protected route for Admin only",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      isSuccess: false,
      message: "Something went wrong.Try again",
    });
  }
};
