// models/jobApplicationModel.js
const mongoose = require("mongoose");

const jobApplicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    labour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "labour", // userModel se
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "accepted", "rejected"],
      default: "applied",
    },
    coverLetter: { type: String }, // optional
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
