const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    company: { type: String },
    location: { type: String },
    salary: { type: Number },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter", required: true },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Job", JobSchema);
