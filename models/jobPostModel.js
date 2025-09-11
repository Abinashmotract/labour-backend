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
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contracter", // contractor model reference
      required: true,
    },
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",   // reference skillModel
        required: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobPost", jobPostSchema);
