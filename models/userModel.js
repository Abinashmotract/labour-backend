const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    email: { type: String, required: false },
    phoneNumber: { type: String, required: true, unique: true },

    otp: { type: String }, // 6 digit OTP
    otpExpiry: { type: Date }, // OTP expiry time
    isPhoneVerified: { type: Boolean, default: false },

    gender: { type: String, enum: ["male", "female", "others"], default: "male" },
    addressLine1: { type: String, required: false },
    work_experience: { type: String },
    work_category: { type: String },

    password: { type: String, required: false },
    profilePicture: { type: String },

    role: { type: String, enum: ["labour", "contractor", "admin"], default: "labour" },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat] order MongoDB ke hisaab se
        default: [0, 0]
      }
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model('labour', UserSchema);
