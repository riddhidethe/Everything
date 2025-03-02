const mongoose = require("mongoose");

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

// Hash password before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to check password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
