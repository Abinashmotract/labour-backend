const User = require("../models/userModel");
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


// Modified sendOTP function with delay check
const sendOTP = async (phoneNumber) => {
  try {
    // 1. Find user and check delay
    const user = await User.findOne({ phoneNumber });
    const now = new Date();
    const cooldownPeriod = 2 * 60 * 1000; // 2 minutes

    if (user?.lastOtpRequest && (now - user.lastOtpRequest < cooldownPeriod)) {
      const remainingTime = Math.ceil((cooldownPeriod - (now - user.lastOtpRequest)) / 1000);
      throw new Error(`Please wait ${remainingTime} seconds before requesting a new OTP`);
    }

    // 2. Send OTP via Twilio
    const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    // 3. Update user record
    await User.findOneAndUpdate(
      { phoneNumber },
      { 
        lastOtpRequest: now,
        $inc: { otpAttempts: 1 } 
      },
      { upsert: true }
    );

    return { success: true };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: error.message };
  }
};