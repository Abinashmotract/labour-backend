const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    gender: { type: String, enum: ["male", "female", "others"], default: "male" },
    addressLine1: {
      type: String,
      required: true,
    },
    work_experience: {
      type: String,
      required: false,
    },
    work_category: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["labour", "contractor", "admin"],
      default: "labour",
    },

    // ======= Commented but preserved fields below =======
    // age: { type: Number },
    // addressLine2: { type: String },
    // city: { type: String },
    // region: { type: String },
    // postalCode: { type: String },
    // gender: { type: String, enum: ["male", "female", "others"], default: "male" },
    // location: {
    //   type: {
    //     type: String,
    //     enum: ["Point"],
    //     default: "Point",
    //   },
    //   coordinates: {
    //     type: [Number],
    //     default: [0, 0],
    //     validate: {
    //       validator: function (v) {
    //         return v.length === 2 &&
    //           Math.abs(v[0]) <= 180 &&
    //           Math.abs(v[1]) <= 90;
    //       },
    //       message: "Invalid GeoJSON coordinates"
    //     },
    //     lastUpdated: { type: Date, default: null }
    //   },
    // },

    // deviceToken: { type: String },
    // refreshToken: { type: String },
    // otp: { type: String },
    // otpExpiration: { type: Date },
    // lastOtpRequest: { type: Date },
    // isPhoneVerified: { type: Boolean, default: false },
    // otpFailedAttempts: { type: Number },
    // otpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Uncomment if you re-enable location field
// UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('User', UserSchema);
