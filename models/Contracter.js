const mongoose = require("mongoose");

const contracterSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        work_category: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        profilePicture: {
            type: String,
            default: "",
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default: "other",
        },
        role: {
            type: String,
            enum: ["labour", "contractor", "admin"],
            default: "contractor",
        },
        profileCompletionStep: {
            type: String,
            default: "personalInfo",
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    }
);

module.exports = mongoose.model("Contracter", contracterSchema);