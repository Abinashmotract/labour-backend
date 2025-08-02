const User = require("../models/userModel");
const validator = require("validator");
const nodemailer = require("nodemailer");
const activeLocks = new Map(); // In-memory store for locks
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const twilio = require('twilio');
const { sendOTPMobile, verifyOTPMobile } = require("../utils/awsSNS");
const Stylist = require("../models/hairStylistModel");
const { mergeCarts } = require("./cartController");
const { validateEmail, validatePassword, validatePhoneNumber, validateName, validatePostalCode } = require('../utils/validator');


// user signup
const userSignup = async (req, res) => {
  try {
    const {
      fullName,
      email,
      age,
      phoneNumber,
      city,
      region,
      password,
      addressLine1,
      addressLine2
    } = req.body;

    const postalCode = req.body.postalCode?.toString().trim();  // Convert to string safely

    validateEmail(email);
    validatePassword(password);
    validatePhoneNumber(phoneNumber);
    validateName(fullName);
    validatePostalCode(postalCode);

    const [existingUser, existingStylist] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }, { email: 1 }),
      Stylist.findOne({ email: email.toLowerCase() }, { email: 1 })
    ]);

    if (existingUser || existingStylist) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Email already exists!"
      });
    }

    // 2. Generate a random salt
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id, // Best practice (hybrid of Argon2i and Argon2d)
      memoryCost: 65536,     // Memory usage (in KiB)
      timeCost: 3,           // Iterations
      parallelism: 1,        // Threads
    });

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      age,
      phoneNumber,
      city,
      addressLine1,
      addressLine2,
      region,
      postalCode,
      password: hashedPassword,
      role: 'user',
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      status: 201,
      message: "User registered successfully!",
      data: {
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
      },
    });

  }
  catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message
    })
  }
};

// controllers/stylistController.js
const contracterSignUp = async (req, res) => {
  try {
    const {
      fullName, email, dob, phoneNumber, password
    } = req.body;

    // Validate inputs
    validateEmail(email);
    validatePassword(password);
    validatePhoneNumber(phoneNumber);           
    validateName(fullName);

    const [existingUser, existingStylist] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }, { email: 1 }),
      Stylist.findOne({ email: email.toLowerCase() }, { email: 1 })
    ]);

    if (existingUser || existingStylist) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Email already exists!"
      });
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const stylist = await Stylist.create({
      fullName,
      email: email.toLowerCase(),
      dob: new Date(dob),
      phoneNumber,
      password: hashedPassword,
      role: 'stylist',
      profileCompletionStep: "personalInfo"
    });

    // Strip sensitive fields
    const { password: _, ...responseData } = stylist.toObject();

    res.status(201).json({
      success: true,
      status: 201,
      message: "Contracter created successfully!",
      data: responseData
    });
  } catch (error) {
    res.status(500).json({
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
    if (!role || !['user', 'stylist'].includes(role)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Invalid role specified!"
      });
    }
    // Determine which model to use based on role
    const Model = role === 'user' ? User : Stylist;
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
    if (role === "user") {
      const mergedCart = await mergeCarts(req.sessionID, account._id);
      console.log('Carts merged successfully:', mergedCart);
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

    if (role === 'stylist') {
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

    if (!role || !['user', 'stylist'].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // 2. Find Account by Role
    const Model = role === 'user' ? User : Stylist;
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
    if (!otp || !role || !['user', 'stylist'].includes(role)) {
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
    const Model = role === 'user' ? User : Stylist;

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

    if (!email || !role || !['user', 'stylist'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    // 2. Find account based on role
    const Model = role === 'user' ? User : Stylist;
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

//  mobile OTP setup apis
const sendOTP = async (req, res) => {
  const { phoneNumber } = req.body;
  const result = "1234"
  // const result = await sendOTPMobile(`+${phoneNumber}`);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.status(200).json({
    success: true,
    status: 200,
    message: "OTP sent!",
    data: result
  });
};

const verifyMobileOTP = async (req, res) => {
  const { phoneNumber, code } = req.body;
  const result = await verifyOTPMobile(`+${phoneNumber}`, code);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ message: "Phone verified!" });
};

const stylistLogout = async (req, res) => {
  try {
    // The stylist's id is expected to be in req.user.id (set by verifyAllToken middleware)
    const stylistId = req.user && req.user.id;
    if (!stylistId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No stylist id found."
      });
    }

    // Clear the refreshToken for the stylist
    await Stylist.findByIdAndUpdate(stylistId, { $unset: { refreshToken: "" } });

    return res.status(200).json({
      success: true,
      message: "Logout successful!"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error."
    });
  }
}

module.exports = {
  userSignup,
  sendEmail,
  verifyOTP,
  resetPassword,
  login,
  sendOTP,
  verifyMobileOTP,
  contracterSignUp,
  stylistLogout
}