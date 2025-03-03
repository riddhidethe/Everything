const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")

//For buyer and applicant
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["buyer"], default: "buyer" }, // Default role is buyer

    // Applicant fields (only required if applying for jobs)
    skills: { type: [String], default: [] },
    experience: { type: String, default: "" },
    resume: { type: String, default: "" } // File URL for resume
});

module.exports = mongoose.model("User", UserSchema);
