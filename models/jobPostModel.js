const mongoose = require("mongoose");

const jobPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true
      },
      coordinates: {
        type: [Number],
        required: true
      },
      address: { 
      type: String,
      trim: true
    }
    },
    jobTiming: {
      type: String,
      required: true,
    },
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    createdBy: {
      type: String,
      default: "contractor",
    },
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        required: true,
      },
    ],
    labourersRequired: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    labourersFilled: {
      type: Number,
      default: 0,
      min: 0,
    },
    validUntil: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > new Date(); // Must be in the future
        },
        message: "Valid until date must be in the future",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFilled: {
      type: Boolean,
      default: false,
    },
    acceptedLabours: [
      {
        labour: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        acceptedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
jobPostSchema.index({ validUntil: 1 });
jobPostSchema.index({ isActive: 1, validUntil: 1 });
jobPostSchema.index({ isFilled: 1 });

// Create geospatial index for location-based queries
jobPostSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("JobPost", jobPostSchema);
