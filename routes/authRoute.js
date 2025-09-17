const express = require("express");
const {
    roleBasisSignUp,
    sendEmail,
    verifyOTP,
    resetPassword,
    login,
    sendOTP,
    verifyOtp,
    updateFcmToken
} = require('../controllers/authController');
// const { verifyUser, verifyAdmin } = require("../middleware/verifyToken");
const { uploadToS3 } = require("../config/AWSConfig");
const rateLimit = require('express-rate-limit');
const { verifyAllToken } = require("../middleware/verifyToken");

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: "You've made too many requests. Please try again later.",
  skipSuccessfulRequests: true, // Only count failed attempts
});

const otpRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 2,
  message: "You've made too many requests. Please try again later.",
  skipSuccessfulRequests: true, // Only count failed attempts
});

const router = express.Router();
// ---------labour--------------
router.post('/labour/signup', uploadToS3, roleBasisSignUp);
router.post('/labour/verify-otp', verifyOtp);
router.post('/labour/send-otp', otpRateLimiter, sendOTP);
router.post("/update-fcmtoken", verifyAllToken(["labour", "contractor"]), updateFcmToken);

// ---------labour--------------

router.post('/send-email', otpRateLimiter, sendEmail);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/login', login);
router.post('/user/login', login);



module.exports = router;
