const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Job = require("../models/Job");
const Application = require("../models/Application");

const router = express.Router();

// 📌 Create a new job (Only for Recruiters)
router.post("/create-job", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { title, description, salary, skillsRequired } = req.body;
        const recruiterId = req.user.id;

        const job = new Job({ recruiterId, title, description, salary, skillsRequired });
        await job.save();

        res.status(201).json({ msg: "Job posted successfully", job });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get recruiter dashboard data
router.get("/dashboard", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const recruiterId = req.user.id;
        const jobs = await Job.find({ recruiterId });

        let applicationsReceived = 0;
        for (const job of jobs) {
            const applications = await Application.find({ jobId: job._id });
            applicationsReceived += applications.length;
        }

        res.json({ jobsPosted: jobs.length, applicationsReceived });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all applications for a specific job
router.get("/applications/:jobId", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { jobId } = req.params;
        const recruiterId = req.user.id;

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ msg: "Job not found" });
        if (job.recruiterId.toString() !== recruiterId) return res.status(403).json({ msg: "Unauthorized" });

        const applications = await Application.find({ jobId }).populate("userId", "name email");
        res.json(applications);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Update job application status
router.put("/update-status", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { applicationId, status } = req.body;

        const application = await Application.findById(applicationId);
        if (!application) return res.status(404).json({ msg: "Application not found" });

        application.status = status;
        await application.save();

        res.json({ msg: "Application status updated", application });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Save an application for further processing
router.post("/save-application", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { applicationId } = req.body;

        const application = await Application.findById(applicationId);
        if (!application) return res.status(404).json({ msg: "Application not found" });

        application.saved = true;
        await application.save();

        res.json({ msg: "Application saved for further processing", application });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

module.exports = router;
