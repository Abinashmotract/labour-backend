// utils/awsSNS.js
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const crypto = require('crypto');
const User = require("../models/userModel");

const snsClient = new SNSClient({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Generate and send OTP
const sendOTPMobile = async (phoneNumber) => {
  try {
    // 1. Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const message = `Your OTP is ${otp}. Valid for 5 minutes.`;

    // 2. Save OTP to DB with expiry (5 mins)
    await User.findOneAndUpdate(
      { phoneNumber },
      { 
        otp,
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        otpAttempts: 0 
      },
      { upsert: true }
    );

    // 3. Send via AWS SNS
    const params = {
      Message: message,
      PhoneNumber: phoneNumber, // Include country code (+1XXXXXXXXXX)
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'YOURAPP'
        }
      }
    };

    const response = await snsClient.send(new PublishCommand(params));
    return { success: true, messageId: response.MessageId };

  } catch (error) {
    console.error("AWS SNS error:", error);
    return { success: false, error: error.message };
  }
};

// Verify OTP
const verifyOTPMobile = async (phoneNumber, code) => {
  try {
    // 1. Find user and check OTP
    const user = await User.findOne({ phoneNumber });
    if (!user) return { success: false, error: "User not found" };

    // 2. Check expiry and attempts
    if (user.otpAttempts >= 3) {
      return { success: false, error: "Max attempts reached" };
    }
    if (user.otpExpiresAt < new Date()) {
      return { success: false, error: "OTP expired" };
    }

    // 3. Verify code
    if (user.otp !== code) {
      await User.updateOne(
        { phoneNumber },
        { $inc: { otpAttempts: 1 } }
      );
      return { success: false, error: "Invalid OTP" };
    }

    // 4. Mark as verified on success
    await User.updateOne(
      { phoneNumber },
      { 
        isPhoneVerified: true,
        otp: null,
        otpAttempts: 0 
      }
    );

    return { success: true };

  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPMobile, verifyOTPMobile };