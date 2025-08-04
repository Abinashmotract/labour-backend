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


// user signup
const labourSignUp = async (req, res) => {
  try {
    const {
      fullName,
      email_address,
      mobile_no,
      address,
      work_experience,
      work_category,
      password,
      gender
    } = req.body;

    const profileImage = req.fileLocations?.[0] || null;

    // Basic validations
    validateEmail(email_address);
    validatePassword(password);
    validatePhoneNumber(mobile_no);
    validateName(fullName);

    // Check for existing email
    const [existingUser, existingContracter] = await Promise.all([
      User.findOne({ email: email_address.toLowerCase() }, { email: 1 }),
      Contracter.findOne({ email: email_address.toLowerCase() }, { email: 1 })
    ]);

    if (existingUser || existingContracter) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Email already exists!",
      });
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const newUser = new User({
      fullName,
      email: email_address.toLowerCase(),
      phoneNumber: mobile_no,
      addressLine1: address,
      password: hashedPassword,
      profilePicture: profileImage,
      role: "labour",
      work_experience,
      work_category,
      gender
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      status: 201,
      message: "User registered successfully!",
      data: {
        fullName,
        email: email_address.toLowerCase(),
        profileImage,
        gender
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
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


const verifyOTP = async (req, res) => {
  const { otp, email } = req.body;

  try {
    if (!otp || !email) {
      return res.status(400).json({
        success: false,
        message: "OTP and email are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || !user.otpExpiration) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found. Please request a new OTP.",
      });
    }

    if (user.otpExpiration < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully!",
      token,
      role: user.role,
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message,
    });
  }
};

// reset password

const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Invalid token payload"
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1
    });

    // Save new password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Password reset error:", error);

    // Token-specific error handling
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
  // const { phoneNumber } = req.body;
  const result = "12345"
  // const result = await sendOTPMobile(`+${phoneNumber}`);
  // if (!result.success) {
  //   return res.status(400).json({ error: result.error });
  // }
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

const forgotPassword=async(req,res)=>{
  try{
    const {email}=req.body;
    const userData=await User.findOne({email});
    if(!userData){
      return res.status(404).json({
        success:false,
        message:"User Not Found"
      })
    }

    const otp= Math.floor(10000 + Math.random() * 90000);

    userData.otp=otp;
    userData.otpExpiration=new Date(Date.now()+10*60*1000);

    await userData.save();


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
      message: "OTP sent successfully",
    });


  }catch(error){
    console.error("Password reset error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  labourSignUp,
  contracterSignUp,
  sendEmail,
  verifyOTP,
  resetPassword,
  login,
  sendOTP,
  verifyMobileOTP,
  forgotPassword
}