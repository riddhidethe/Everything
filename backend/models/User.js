const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// For buyer and applicant
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // Role can be 'buyer' or 'applicant'

    // Profile-related fields
    profilePic: { type: String, default: "user.png" }, // Ensure default empty string if not provided
    resumeFileName: { type: String, default: "" }, // New field to store original resume filename

    // Applicant-specific fields
    skills: { type: [String], default: [] },
    exp: { type: String, default: "" },

    // Contact details
    fname: { type: String },
    lname: { type: String },
    mobileNo: { type: String, default: "" }, 
    age: { type: Number, default: null }, 
    gender: { type: String, enum: ["Male", "Female", "Other"], default: "Other" }, 
}, { timestamps: true }); // Adds `createdAt` and `updatedAt` timestamps automatically

module.exports = mongoose.model("User", UserSchema);
