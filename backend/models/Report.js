const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reportedItem: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'itemType',
    required: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['Product', 'User', 'Seller', 'Recruiter', 'Job', 'Review']
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'inappropriate_content', 
      'fraudulent_activity', 
      'counterfeit_product',
      'misrepresentation',
      'harassment',
      'other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  evidence: [String], // URLs to images or documents
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String
  },
  resolutionDetails: {
    type: String
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("Report", ReportSchema);