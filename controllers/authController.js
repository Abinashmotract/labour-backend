const User = require("../models/userModel");
const validator = require("validator");
const nodemailer = require("nodemailer");
const activeLocks = new Map(); // In-memory store for locks
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const Contracter = require("../models/Contracter");
const { getAddressFromCoordinates } = require("../utils/geocoding");

// Function to send OTP (static for now, replace with actual logic)
const sendOTP = async (req, res) => {
  try {
    const { phoneNumber, userId } = req.body;

    if (!phoneNumber && !userId) {
      return res.status(400).json({
        success: false,
        message: "फोन नंबर या यूजर आईडी आवश्यक है",
      });
    }

    const otp = "888888"; // static for now
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min valid

    let user;
    if (phoneNumber) {
      user = await User.findOne({ phoneNumber });
      if (!user) {
        // agar user exist nahi hai to new create karo
        user = new User({ phoneNumber });
      }
    } else if (userId) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "उपयोगकर्ता नहीं मिला" });
    }

    // Save OTP in DB
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP सफलतापूर्वक भेजा गया",
      otp // ⚠️ testing only, remove later
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    return res.status(500).json({
      success: false,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

// Function to verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, userId, otp } = req.body;
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (phoneNumber) {
      user = await User.findOne({ phoneNumber });
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "उपयोगकर्ता नहीं मिला" });
    }
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "अमान्य OTP" });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "OTP समाप्त हो गया" });
    }
    user.isPhoneVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    if (user.createdByAdmin && user.email && user.firstName) {
      user.signupComplete = true;
    }
    await user.save();
    return res.json({
      success: true,
      message: "फोन सफलतापूर्वक सत्यापित हो गया",
      data: {
        userId: user._id,
        phoneNumber: user.phoneNumber,
        signupComplete: user.signupComplete
      }
    });

  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// user signup
const roleBasisSignUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      addressLine1,
      work_category,
      work_experience,
      gender,
      role,
      lat,
      lng,
      referralCode
    } = req.body;
    const user = await User.findOne({ phoneNumber });
    if (!user || !user.isPhoneVerified) {
      return res.status(400).json({ success: false, message: "फोन सत्यापित नहीं है" });
    }
    if (user.email) {
      return res.status(400).json({ success: false, message: "उपयोगकर्ता पहले से पंजीकृत है" });
    }
    const hashedPassword = await argon2.hash(password);
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email.toLowerCase();
    user.password = hashedPassword;
    user.addressLine1 = addressLine1;
    user.work_category = work_category;
    user.work_experience = work_experience;
    user.gender = gender;
    user.role = role; // labour / contractor
    user.isAgent = req.body.isAgent || false;
    if (role === "contractor") {
      user.isAgent = req.body.isAgent || false;
    } else {
      user.isAgent = undefined; // ya delete user.isAgent;
    }
    if (role === "labour" && referralCode) {
      try {
        const agent = await User.findOne({ referralCode: referralCode, isAgent: true, role: "contractor" });
        if (agent) {
          if (!user.referredBy) {
            user.referredBy = agent._id;
            agent.referralsCount = (agent.referralsCount || 0) + 1;
            await agent.save();
          }
        } else {
          console.warn("Invalid referral code used during signup:", referralCode);
        }
      } catch (err) {
        console.warn("Referral handling failed:", err);
      }
    }

    if (lat && lng) {
      user.location = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] };
      try {
        const address = await getAddressFromCoordinates(lat, lng);
        user.addressLine1 = address;
      } catch (err) {
        console.warn("Reverse geocoding failed:", err.message);
      }
    }
    // ✅ Save uploaded profile picture URL (from S3 middleware)
    if (req.fileLocations && req.fileLocations.profilePicture) {
      user.profilePicture = req.fileLocations.profilePicture;
    }
    await user.save();
    return res.status(201).json({
      success: true,
      message: "उपयोगकर्ता सफलतापूर्वक पंजीकृत",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// login user
const login = async (req, res, next) => {
  try {
    const { phoneNumber, password, longitude, latitude, role, fcmToken } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "फोन नंबर आवश्यक है!"
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "पासवर्ड आवश्यक है!"
      });
    }
    if (!role || !["labour", "contractor"].includes(role)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "अमान्य भूमिका निर्दिष्ट! मजदूर या ठेकेदार होना चाहिए"
      });
    }
    const account = await User.findOne({ phoneNumber, role });
    if (!account) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `${role} इस फोन नंबर के साथ नहीं मिला!`,
      });
    }
    if (role === "contractor" && account.isApproved === false) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: "ठेकेदार अनुमोदित नहीं!"
      });
    }
    const isPasswordValid = await argon2.verify(account.password, password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "गलत पासवर्ड!",
      });
    }
    if (longitude && latitude) {
      account.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      await account.save();
    }
    // ✅ FCM Token update (NEW)
    if (fcmToken) {
      account.fcmToken = fcmToken;
      console.log(`FCM token updated for ${role}: ${phoneNumber}`);
    }

    const token = jwt.sign(
      { id: account._id, phoneNumber: account.phoneNumber, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    const refreshToken = jwt.sign(
      { id: account._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "30d" }
    );
    account.refreshToken = refreshToken;
    await account.save();
    const { password: _, otp, otpExpiry, ...accountData } = account.toObject();
    return res.status(200).json({
      success: true,
      status: 200,
      message: "लॉगिन सफल!",
      id: accountData._id,
      token,
      refreshToken: accountData.refreshToken,
      role: accountData.role,
      phoneNumber: accountData.phoneNumber,
      fcmTokenUpdated: !!fcmToken
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
};

const sendEmail = async (req, res, next) => {
  const { email, role } = req.body;

  try {
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "अमान्य ईमेल प्रारूप" });
    }

    if (!role || !['labour', 'contractor'].includes(role)) {
      return res.status(400).json({ message: "अमान्य भूमिका निर्दिष्ट" });
    }

    // 2. Find Account by Role
    const Model = role === 'labour' ? User : Contracter;
    const account = await Model.findOne({ email });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `${role} इस ईमेल के साथ नहीं मिला`
      });
    }

    // 3. OTP Cooldown Check
    const now = Date.now();
    if (account.otpExpiration && account.otpExpiration > now) {
      const remainingTime = Math.ceil((account.otpExpiration - now) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `कृपया नया OTP अनुरोध करने से पहले ${remainingTime} मिनट प्रतीक्षा करें`
      });
    }

    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    account.otp = otp;
    account.otpExpiration = now + 15 * 60 * 1000; // 15 minutes expiry
    await account.save();

    const mailTransporter = nodemailer.createTransport({
      service: "GMAIL",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailDetails = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP is: <strong>${otp}</strong> (valid for 15 minutes)</p>`
    };

    await mailTransporter.sendMail(mailDetails);

    return res.status(200).json({
      success: true,
      message: "OTP सफलतापूर्वक भेजा गया!"
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

const verifyOTP = async (req, res, next) => {
  const { otp, role, phoneNumber } = req.body; // Added email for better validation

  try {
    // Validate inputs
    if (!otp || !role || !['labour', 'contractor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "OTP गुम है या अमान्य भूमिका निर्दिष्ट"
      });
    }

    // Check if OTP is already being verified (prevent race conditions)
    if (activeLocks.has(otp)) {
      return res.status(429).json({
        success: false,
        message: "OTP सत्यापन पहले से चल रहा है। कृपया प्रतीक्षा करें।"
      });
    }

    // Acquire lock
    activeLocks.set(otp, true);

    // Determine which model to query based on role
    const Model = role === 'labour' ? User : Contracter;

    // Find account with matching OTP that isn't expired
    const account = await Model.findOne({
      otp,
      otpExpiration: { $gt: Date.now() },
      // ...(email && { email: email.toLowerCase() }) // Optional email verification
      ...(phoneNumber && { phoneNumber: phoneNumber }) // Optional phone number verification
    });

    if (!account) {
      activeLocks.delete(otp); // Release lock before returning
      return res.status(400).json({
        success: false,
        message: "अमान्य या समाप्त OTP"
      });
    }

    // Clear OTP fields
    account.otp = undefined;
    account.otpExpiration = undefined;
    await account.save();

    // Generate JWT token with role
    const token = jwt.sign(
      {
        id: account._id,
        phoneNumber: account.phoneNumber,
        role: account.role // Include role in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Release lock
    activeLocks.delete(otp);

    return res.status(200).json({
      success: true,
      message: "OTP सफलतापूर्वक सत्यापित!",
      token,
      role: account.role // Return role for client-side handling
    });

  } catch (error) {
    // Ensure lock is released on errors
    activeLocks.delete(otp);
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

// reset password
const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, phoneNumber, role } = decoded; // Accept either email or phone-based flow

    if ((!email && !phoneNumber) || !role || !['labour', 'contractor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "अमान्य या समाप्त टोकन"
      });
    }

    // 2. Find account based on role and identifier (email or phone)
    const Model = role === 'labour' ? User : Contracter;
    const query = email ? { email: email.toLowerCase() } : { phoneNumber };
    const account = await Model.findOne(query);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "खाता नहीं मिला"
      });
    }

    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    account.password = hashedPassword;
    await account.save();

    return res.status(200).json({
      success: true,
      message: "पासवर्ड सफलतापूर्वक रीसेट!"
    });

  } catch (error) {
    console.error("Password reset error:", error);

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "अमान्य या समाप्त टोकन"
      });
    }

    return res.status(500).json({
      success: false,
      message: "आंतरिक सर्वर त्रुटि"
    });
  }
};

// Forgot password for contractors using phone number
const forgotPassword = async (req, res, next) => {
  const { phoneNumber, role } = req.body;

  try {
    // Validate inputs
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "फोन नंबर आवश्यक है"
      });
    }

    if (!role || !['labour', 'contractor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "अमान्य भूमिका निर्दिष्ट। 'मजदूर' या 'ठेकेदार' होना चाहिए"
      });
    }

    // Find account by phone number and role
    const Model = role === 'labour' ? User : Contracter;
    const account = await Model.findOne({ phoneNumber, role });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `${role} इस फोन नंबर के साथ नहीं मिला`
      });
    }

    // Check OTP cooldown
    const now = Date.now();
    if (account.otpExpiration && account.otpExpiration > now) {
      const remainingTime = Math.ceil((account.otpExpiration - now) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `कृपया नया OTP अनुरोध करने से पहले ${remainingTime} मिनट प्रतीक्षा करें`
      });
    }

    // Generate static OTP based on role
    const otp = role === 'contractor' ? '333333' : '888888';
    account.otp = otp;
    account.otpExpiration = now + 15 * 60 * 1000; // 15 minutes expiry
    await account.save();

    // For now, return OTP in response (in production, send via SMS)
    return res.status(200).json({
      success: true,
      message: "आपके फोन नंबर पर OTP सफलतापूर्वक भेजा गया",
      otp // ⚠️ Remove this in production - send via SMS instead
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "आंतरिक सर्वर त्रुटि"
    });
  }
};

// Save/Update FCM Token for logged-in user
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "FCM टोकन आवश्यक है",
      });
    }
    const userId = req.user.id;
    await User.findByIdAndUpdate(userId, { fcmToken }, { new: true });
    return res.status(200).json({
      success: true,
      status: 200,
      message: "FCM टोकन सफलतापूर्वक अपडेट",
    });
  } catch (err) {
    console.error("Error updating FCM token:", err);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

module.exports = {
  roleBasisSignUp,
  sendEmail,
  verifyOTP,
  resetPassword,
  login,
  sendOTP,
  verifyOtp,
  updateFcmToken,
  forgotPassword
}