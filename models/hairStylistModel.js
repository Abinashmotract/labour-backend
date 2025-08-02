const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ServiceSchema = require("../models/stylistServices");

// models/StylistProfile.js
const StylistSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: false,
    },
    bio: {
      type: String,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      lowercase: true,
    },
    dob: { type: Date },
    address: {
      street: String,
      house: String,
      city: String,
      province: String,
      zipCode: Number,
      country: String,
    },
    phoneNumber: {
      type: Number,
      required: false,
      // unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "stylist", "admin"],
      default: "stylist",
    },
    deviceToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpiration: {
      type: Date,
    },
    lastOtpRequest: Date,
    isApproved: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
    },
    photos: [
      {
        url: { type: String, required: true },
        name: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        metadata: {
          size: Number,
          fileType: String,
        },
      },
    ],
    socialMediaLinks: {
      facebook: {
        type: String,
      },
      instagram: {
        type: String,
      },
      linkedin: {
        type: String,
      },
    },
    profileCompletionStep: {
      type: String,
      enum: [
        "personalInfo",
        "serviceLocation",
        "portfolio",
        "services",
        "availability",
        "specialities",
        "certifications",
        "completed",
      ],
    },
    services: [
      {
        serviceId: {
          type: Schema.Types.ObjectId,
          ref: "StylistService",
        },
        subService: {
          type: Schema.Types.ObjectId,
        },
        price: Number,
        duration: String,
      },
    ],
    serviceLocation: {
      type: {
        type: String,
        enum: ["customer_place", "boc_location", "own_salon"],
        required: false,
      },
      ownSalonDetails: {
        isPrivateParkingAvailable: { type: Boolean, default: false },
        isBusStopNearby: { type: Boolean, default: false },
      },
    },
    gender: {
      type: String,
      enum: ["male", "female", "others"],
      default: "male",
    },
    location: {
      category: {
        type: String,
        enum: ["customer", "boc", "own"],
      },
      details: {
        parking: {
          type: Boolean,
        },
        busStop: {
          type: Boolean,
        },
      },
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
            return (
              v.length === 2 && Math.abs(v[0]) <= 180 && Math.abs(v[1]) <= 90
            );
          },
          message: "Invalid GeoJSON coordinates",
        },
        lastUpdated: {
          type: Date,
          default: null,
        },
      },
    },
    specialities: [String],
    expertise: [String],
    experience: [
      {
        salon: String,
        role: String,
        duration: String,
      },
    ],
    certificates: [
      {
        url: String,
        verified: { type: Boolean, default: false },
      },
    ],
    portfolio: [
      {
        url: String,
      },
    ],
    isProfileCompleted: {
      type: Boolean,
    },
    about: {
      shopName: {
        type: String,
        maxlength: 50,
      },
      startFrom: {
        type: Number,
      },
      about: {
        type: String,
        maxlength: 1000,
      },
      address: {
        type: String,
        maxlength: 200,
      },
      schedule: {
        type: String,
        enum: ["Mon-Fri", "Mon-Sat", "Daily", "Custom"],
        default: "Mon-Sat",
      },
      customDays: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      timings: {
        from: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        till: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          validate: {
            validator: function (till) {
              return !this.timings?.from || till > this.timings.from;
            },
            message: "Closing time must be after opening time",
          },
        },
      },
      currentStatus: {
        type: Boolean,
      },
    },
  },
  { timestamps: true }
);

StylistSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Stylist", StylistSchema);
