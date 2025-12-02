// utils/twilio.js
const User = require("../models/userModel");
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Twilio se OTP SMS bhejna + basic cooldown per number
 * OTP verify hum apne DB se karenge (Twilio se nahi)
 */
const sendOtpSms = async (phoneNumber, message) => {
  try {
    const now = new Date();
    const cooldownPeriod = 2 * 60 * 1000; // 2 minutes

    // user record se cooldown check (optional but useful)
    const user = await User.findOne({ phoneNumber });

    if (user?.lastOtpRequest && now - user.lastOtpRequest < cooldownPeriod) {
      const remainingSeconds = Math.ceil(
        (cooldownPeriod - (now - user.lastOtpRequest)) / 1000
      );
      throw new Error(
        `कृपया नया OTP मंगाने से पहले ${remainingSeconds} सेकंड इंतज़ार करें`
      );
    }

    // Twilio Messaging Service se SMS send
    await client.messages.create({
      to: phoneNumber,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      body: message,
    });

    // Cooldown + attempts update
    if (user) {
      user.lastOtpRequest = now;
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
    }

    return { success: true };
  } catch (error) {
    console.error("Twilio SMS Error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOtpSms };
