const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")

const RecruiterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["recruiter"], default: "recruiter" },

    // Profile picture field (newly added)
    profilePic: { type: String },
    // Recruiter Dashboard
    jobsPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    applicationsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }]
});

module.exports = mongoose.model("Recruiter", RecruiterSchema);
