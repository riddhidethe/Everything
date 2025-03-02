const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recruiter",
    required: true
  },
  resume: {
    type: String,
    required: true
  },
  coverLetter: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "reviewing", "interviewed", "offered", "rejected", "accepted", "withdrawn"],
    default: "pending"
  },
  answers: [{
    question: String,
    answer: String
  }],
  appliedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Application", ApplicationSchema);