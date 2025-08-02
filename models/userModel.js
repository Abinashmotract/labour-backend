const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: false
    },
    email: {
      type: String,
      required: false,
      unique: true,
    },
    age: {
      type: Number,
      required: false,
    },
    phoneNumber: {
      type: Number,
      required: false,
      // unique: true,
    },
    profilePicture: {
      type: String,
    },
    addressLine1: { type: String, required: false },
    addressLine2: { type: String, required: false },
    city: { type: String, required: false },
    region: { type: String, required: false },
    postalCode: { type: String, required: false },
    password: {
      type: String,
      required: false,
    },
    role: { type: String, enum: ["user", "stylist", "admin"], default: "user" },
    gender: { type: String, enum: ["male", "female", "others"], default: "male" },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
        validate: {
          validator: function (v) {
            return v.length === 2 &&
              Math.abs(v[0]) <= 180 &&
              Math.abs(v[1]) <= 90;
          },
          message: "Invalid GeoJSON coordinates"
        },
        lastUpdated: {
          type: Date,
          default: null
        }
      },
    },
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stylist'
    }],
    deviceToken: {
      type: String,
    },
    refreshToken: {
      type: String
    },
    otp: {
      type: String,
    },
    otpExpiration: {
      type: Date,
    },
    lastOtpRequest: Date, // Track last request time
    isPhoneVerified: { type: Boolean, default: false },
    otpFailedAttempts: { type: Number },
    otpAttempts: { type: Number, default: 0 }, // Track attempts
  },
  {
    timestamps: true
  }
);

UserSchema.index({ location: "2dsphere" }); // Creates a geospatial index

module.exports = mongoose.model('User', UserSchema);