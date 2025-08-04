const express = require("express");
const {
    labourSignUp,
    sendEmail,
    verifyOTP,
    resetPassword,
    login,
    sendOTP,
    verifyMobileOTP,
    contracterSignUp,
    forgotPassword
} = require('../controllers/authController');
// const { verifyUser, verifyAdmin } = require("../middleware/verifyToken");
const { handleFileUpload } = require("../config/multerConfig");
const rateLimit = require('express-rate-limit');

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

router.post('/labour/signup', handleFileUpload, labourSignUp);
router.post('/contracter/signup', handleFileUpload, contracterSignUp);
router.post('/send-email', otpRateLimiter, sendEmail);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.post('/login', login);
router.post('/user/login', login);
router.post('/send-otp', otpRateLimiter, sendOTP);
// router.post('/verify-otp', verifyMobileOTP);
router.post('/forgot-password', forgotPassword);



module.exports = router;
