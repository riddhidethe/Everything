const mongoose = require("mongoose");

const RecruiterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["recruiter"], default: "recruiter" },

    // Recruiter Dashboard
    jobsPosted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    applicationsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: "Application" }]
});

// Hash password before saving
RecruiterSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to check password
RecruiterSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Recruiter", RecruiterSchema);
