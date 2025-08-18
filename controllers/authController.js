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

let otpStore = {};

// Function to send OTP (static for now, replace with actual logic)
const sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Static OTP for now
    const otp = "888888";

    // Store OTP in memory (map phoneNumber -> otp)
    otpStore[phoneNumber] = otp;

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully (static)",
      otp // ⚠️ Only for testing, remove in prod
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
    const { phoneNumber, otp } = req.body;

    // Check in otpStore instead of user.otp
    if (!otpStore[phoneNumber]) {
      return res.status(400).json({ success: false, message: "OTP not sent or expired" });
    }

    if (otpStore[phoneNumber] !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Find or create user for this phone
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        phoneNumber,
        isPhoneVerified: true
      });
    } else {
      user.isPhoneVerified = true;
    }
    await user.save();
    delete otpStore[phoneNumber];

    return res.json({ success: true, message: "Phone verified successfully" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// user signup
const labourSignUp = async (req, res) => {
  try {
    let {
      firstName,
      lastName,
      fullName,
      email_address,
      mobile_no,
      address,
      work_experience,
      work_category,
      password,
      gender,
      lat,
      lng
    } = req.body;

    if ((!firstName || !lastName) && fullName) {
      const parts = fullName.trim().split(" ");
      firstName = parts[0];
      lastName = parts.slice(1).join(" ") || "";
    }

    let profileImage = null;
    if (req.fileLocations && req.fileLocations.length > 0) {
      profileImage = req.fileLocations[0];
    }

    validateEmail(email_address);
    validatePassword(password);
    validatePhoneNumber(mobile_no);
    validateName(firstName);

    const user = await User.findOne({ phoneNumber: mobile_no });
    if (!user || !user.isPhoneVerified) {
      return res.status(400).json({ success: false, message: "Phone not verified" });
    }

    // fix: check if already registered
    if (user.email && user.password) {
      return res.status(400).json({ success: false, message: "User already registered" });
    }

    const hashedPassword = await argon2.hash(password);

    user.firstName = firstName;
    user.lastName = lastName || "";
    user.email = email_address.toLowerCase();
    user.password = hashedPassword;
    user.addressLine1 = address;
    if (profileImage) user.profilePicture = profileImage;
    user.work_experience = work_experience;
    user.work_category = work_category;
    user.gender = gender || "male";
    user.role = "labour";

    if (lat && lng) {
      user.location = {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
    }

    await user.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully!",
      // data: {
      //   firstName,
      //   lastName,
      //   email: email_address,
      //   mobile_no,
      //   gender,
      //   profileImage: user.profilePicture || null,
      //   location: user.location
      // }
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// controllers/authController.js
const contracterSignUp = async (req, res) => {
  try {
    const {
      contracterName,
      email,
      mobile,
      address,
      typeOfWorkOffered,
      password,
      profileImage,
      gender,
    } = req.body;

    // ✅ Basic validations
    validateEmail(email);
    validatePassword(password);
    validatePhoneNumber(mobile);
    validateName(contracterName);

    // ✅ Check for existing email
    const [existingUser, existingContracter] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }, { email: 1 }),
      Contracter.findOne({ email: email.toLowerCase() }, { email: 1 })
    ]);

    if (existingUser || existingContracter) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Email already exists!"
      });
    }

    // ✅ Hash password
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    // ✅ Create contracter
    const contracter = await Contracter.create({
      fullName: contracterName,
      email: email.toLowerCase(),
      phoneNumber: mobile,
      address,
      work_category: typeOfWorkOffered,
      password: hashedPassword,
      profilePicture: req.fileLocations[0] || "",
      gender,
      role: 'contractor', // or 'contractor' if using same model
      profileCompletionStep: "personalInfo"
    });

    // ✅ Remove sensitive fields
    const { password: _, ...responseData } = contracter.toObject();

    return res.status(201).json({
      success: true,
      status: 201,
      message: "Contracter created successfully!",
      data: responseData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    });
  }
};

// login user
const login = async (req, res, next) => {
  try {
    const { email, password, longitude, latitude, role } = req.body;
    if (!validator.isEmail(email.toLowerCase())) {
      return res.status(400).json({ success: false, status: 400, message: "Invalid email format!" });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Password is required!"
      });
    }
    if (!role || !['labour', 'contractor'].includes(role)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Invalid role specified!"
      });
    }
    // Determine which model to use based on role
    const Model = role === 'labour' ? User : Contracter;
    const account = await Model.findOne({ email: email.toLowerCase(), role });
    if (!account) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} not found!`,
      });
    }
    if (account.isApproved === false) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} not approved!`
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
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        lastUpdated: new Date()
      };
      await account.save();
    }
    const token = jwt.sign(
      { id: account._id, email: account.email.toLowerCase(), role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const refreshToken = jwt.sign(
      { id: account._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "30d" }
    );
    account.refreshToken = refreshToken;
    await account.save();

    const { password: _, ...accountData } = account.toObject();

    const responseData = {
      success: true,
      status: 200,
      message: "Login successful!",
      id: accountData._id,
      token,
      refreshToken: accountData.refreshToken,
    };

    if (role === 'contractor') {
      responseData.profileCompletionStep = accountData.profileCompletionStep;
      responseData.isProfileCompleted = accountData.isProfileCompleted || false;
    }

    return res.status(200).json({
      ...responseData
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


const verifyMobileOTP = async (req, res) => {
  const { phoneNumber, code } = req.body;
  const result = await verifyOTPMobile(`+${phoneNumber}`, code);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ message: "Phone verified!" });
};

module.exports = {
  labourSignUp,
  contracterSignUp,
  sendEmail,
  verifyOTP,
  resetPassword,
  login,
  sendOTP,
  verifyOtp,
  verifyMobileOTP
}