const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true },
    otp: { type: String }, // 6 digit OTP
    otpExpiry: { type: Date }, // OTP expiry time
    isPhoneVerified: { type: Boolean, default: false },
    gender: { type: String, enum: ["male", "female", "others"], default: "male" },
    addressLine1: { type: String },
    work_experience: { type: String },
    work_category: { type: String },
    password: { type: String },
    profilePicture: { type: String, default: "" },
    role: { type: String, enum: ["labour", "contractor", "admin"], default: "labour" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
  },
  { timestamps: true }
);

UserSchema.index({ location: "2dsphere" }); // ✅ for geo-queries
module.exports = mongoose.model('labour', UserSchema);
