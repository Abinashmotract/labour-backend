const express = require("express");
const {
    roleBasisSignUp,
    sendEmail,
    verifyForgotOtp,
    resetPassword,
    login,
    sendOTP,
    verifyOtp,
    updateFcmToken,
    forgotPassword
} = require('../controllers/authController');
const { uploadToLocal } = require("../config/multerLocal");
const rateLimit = require('express-rate-limit');
const { verifyAllToken } = require("../middleware/verifyToken");

const otpRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 2, // Maximum 2 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: (req, res) => {
    // Try to get reset time from rate limit info, fallback to window duration
    let retryAfterSeconds = 120; // Default 2 minutes
    if (req.rateLimit && req.rateLimit.resetTime) {
      retryAfterSeconds = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    }
    
    const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
    
    return res.status(429).json({
      success: false,
      message: `बहुत अधिक OTP अनुरोध। कृपया ${retryAfterMinutes} मिनट बाद पुनः प्रयास करें।`,
      retryAfter: retryAfterSeconds,
      retryAfterMinutes: retryAfterMinutes
    });
  }
});

const router = express.Router();
// ---------labour--------------
router.post('/labour/signup', uploadToLocal, roleBasisSignUp);
router.post('/labour/verify-otp', verifyOtp);
router.post('/labour/send-otp', otpRateLimiter, sendOTP);
router.post("/update-fcmtoken", verifyAllToken(["labour", "contractor"]), updateFcmToken);

// ---------labour--------------

router.post('/send-email', otpRateLimiter, sendEmail);
router.post('/verify-otp', verifyForgotOtp);
router.post('/reset-password', resetPassword);
router.post('/forgot-password', otpRateLimiter, forgotPassword);
router.post('/login', login);
router.post('/user/login', login);



module.exports = router;
