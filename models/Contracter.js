const mongoose = require("mongoose");

const contracterSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true, },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, },
        phoneNumber: { type: String, required: true, trim: true, },
        addressLine1: { type: String, required: true, trim: true, },
        work_category: { type: String, required: true, trim: true, },
        password: { type: String, required: true, },
        profilePicture: { type: String, default: "", },
        gender: { type: String, enum: ["male", "female", "other"], default: "other", },
        role: { type: String, enum: ["labour", "contractor", "admin"], default: "contractor", },
        isAgent: { type: Boolean, default: false },
        profileCompletionStep: { type: String, default: "personalInfo", },
        fcmToken: { type: String, default: "" },
        otp: { type: String }, // 6 digit OTP
        otpExpiration: { type: Number }, // OTP expiry timestamp
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);
module.exports = mongoose.model("Contracter", contracterSchema);