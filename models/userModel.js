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
    isAgent: { type: Boolean, default: false },
    role: { type: String, enum: ["labour", "contractor", "admin"], default: "labour" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] } 
    },
    fcmToken: { type: String },
    skills: [{
      type: Schema.Types.ObjectId,
      ref: 'Skill'
    }],
    // --- new referral fields ---
    referralCode: { type: String, unique: true, sparse: true }, // only agents will have
    referralsCount: { type: Number, default: 0 }, // how many labours referred to this agent
    referredBy: { type: Schema.Types.ObjectId, ref: 'users' }, // who referred this user (if any)
  },
  { timestamps: true }
);
UserSchema.index({ location: "2dsphere" }); // ✅ for geo-queries
UserSchema.index({ phoneNumber: 1, role: 1 }, { unique: true });
module.exports = mongoose.model('users', UserSchema);
