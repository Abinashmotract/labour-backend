const User = require("../models/userModel");
const validator = require("validator");
const nodemailer = require("nodemailer");
const activeLocks = new Map(); // In-memory store for locks
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const twilio = require('twilio');
const { sendOTPMobile, verifyOTPMobile } = require("../utils/awsSNS");

const Contracter = require("../models/Contracter");

const { validateEmail, validatePassword, validatePhoneNumber, validateName, validatePostalCode } = require('../utils/validator');

// Function to send OTP (static for now, replace with actual logic)
const sendOTP = async (req, res) => {
  try {
    const { phoneNumber, userId } = req.body;

    if (!phoneNumber && !userId) {
      return res.status(400).json({
        success: false,
        message: "Phone number or UserId is required",
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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Save OTP in DB
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp // ⚠️ testing only, remove later
    });
  } catch (err) {
    console.error("Send OTP Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
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
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired" });
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
      message: "Phone verified successfully",
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
      lng
    } = req.body;

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });

    if (!user || !user.isPhoneVerified) {
      return res.status(400).json({ success: false, message: "Phone not verified" });
    }

    if (user.email) {
      return res.status(400).json({ success: false, message: "User already registered" });
    }

    // Hash password
    const hashedPassword = await argon2.hash(password);

    // Update user details
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email.toLowerCase();
    user.password = hashedPassword;
    user.addressLine1 = addressLine1;
    user.work_category = work_category;
    user.work_experience = work_experience;
    user.gender = gender;
    user.role = role; // labour / contractor

    if (lat && lng) {
      user.location = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] };
    }

    // ✅ Save uploaded profile picture URL (from S3 middleware)
    if (req.fileLocations && req.fileLocations.profilePicture) {
      user.profilePicture = req.fileLocations.profilePicture;
    }

    await user.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        role: user.role,
        gender: user.gender,
        location: user.location,
        profilePicture: user.profilePicture || null
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// login user
const login = async (req, res, next) => {
  try {
    const { phoneNumber, password, longitude, latitude, role } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Phone number is required!"
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Password is required!"
      });
    }
    if (!role || !["labour", "contractor"].includes(role)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Invalid role specified! Must be labour or contractor"
      });
    }
    const account = await User.findOne({ phoneNumber, role });
    if (!account) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `${role} with this phone number not found!`,
      });
    }
    if (role === "contractor" && account.isApproved === false) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: "Contractor not approved!"
      });
    }
    const isPasswordValid = await argon2.verify(account.password, password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Incorrect password!",
      });
    }
    if (longitude && latitude) {
      account.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      await account.save();
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
      message: "Login successful!",
      id: accountData._id,
      token,
      refreshToken: accountData.refreshToken,
      role: accountData.role,
      phoneNumber: accountData.phoneNumber
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
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!role || !['labour', 'contractor'].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // 2. Find Account by Role
    const Model = role === 'labour' ? User : Contracter;
    const account = await Model.findOne({ email });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `${role} not found with this email`
      });
    }

    // 3. OTP Cooldown Check
    const now = Date.now();
    if (account.otpExpiration && account.otpExpiration > now) {
      const remainingTime = Math.ceil((account.otpExpiration - now) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingTime} minutes before requesting a new OTP`
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
      message: "OTP sent successfully!"
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
  const { otp, role, email } = req.body; // Added email for better validation

  try {
    // Validate inputs
    if (!otp || !role || !['labour', 'contractor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Missing OTP or invalid role specified"
      });
    }

    // Check if OTP is already being verified (prevent race conditions)
    if (activeLocks.has(otp)) {
      return res.status(429).json({
        success: false,
        message: "OTP verification already in progress. Please wait."
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
      ...(email && { email: email.toLowerCase() }) // Optional email verification
    });

    if (!account) {
      activeLocks.delete(otp); // Release lock before returning
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
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
        email: account.email,
        role: account.role // Include role in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Release lock
    activeLocks.delete(otp);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully!",
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
    const { email, role } = decoded; // Extract role from token

    if (!email || !role || !['labour', 'contractor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    // 2. Find account based on role
    const Model = role === 'labour' ? User : Contracter;
    const account = await Model.findOne({ email });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
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
      message: "Password reset successfully!"
    });

  } catch (error) {
    console.error("Password reset error:", error);

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
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
  verifyOtp
}