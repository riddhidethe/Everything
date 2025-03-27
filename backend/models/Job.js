const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    company: { type: String, required: true },
    location: { type: String },
    salary: { type: String }, // Change to String to store ₹15,000+ format
    work_type: { type: String }, // New field: Full-time, Part-time, Target-based, etc.
    incentives: { type: String }, // New field: Performance-based incentives
    benefits: { type: String }, // New field: Experience Letter, Offer Letter, etc.
    vacancies: { type: String }, // New field: Limited, Open, etc.
    apply_now: { type: String }, // New field: Open, Closed, etc.
    contact_phone: { type: String }, // New field: Phone number of recruiter/company
    listed_on: { type: Date, default: Date.now }, // New field: Date job was posted
    status: { type: String, enum: ["Active", "Closed"], default: "Active" }, // New field: Job status
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "Recruiter", required: true },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("Job", JobSchema);
