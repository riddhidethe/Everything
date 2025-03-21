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
        let pendingApplications = 0;
        let interviewScheduled = 0;

        for (const job of jobs) {
            const applications = await Application.find({ jobId: job._id });
            applicationsReceived += applications.length;
            
            // Count applications by status
            for (const app of applications) {
                if (app.status === 'Pending') pendingApplications++;
                if (app.status === 'Selected for interview') interviewScheduled++;
            }
        }

        res.json({ 
            jobsPosted: jobs.length, 
            totalApplications: applicationsReceived,
            pendingApplications,
            interviewScheduled
        });
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

// 📌 Get all applications for all jobs by the recruiter
router.get("/applications", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const recruiterId = req.user.id;
        
        // Find all jobs by this recruiter
        const jobs = await Job.find({ recruiterId });
        const jobIds = jobs.map(job => job._id);
        
        // Find all applications for these jobs and populate with applicant and job details
        const applications = await Application.find({ jobId: { $in: jobIds } })
            .populate("userId", "name email profilePhoto experience")
            .populate("jobId", "title");
            
        const data = {
            rows: applications.map(app => ({
                applicant_id: app.userId._id,
                name: app.userId.name,
                email_id: app.userId.email,
                profile_photo: app.userId.profilePhoto,
                exp_level: app.userId.experience,
                job_role: app.jobId.title,
                application_id: app._id,
                isSaved: app.saved || false
            }))
        };
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get filtered applications by job role
router.post("/filteredApplications", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { job_role } = req.body;
        const recruiterId = req.user.id;
        
        if (!job_role) {
            return res.redirect("/applications");
        }
        
        // Find the job with the specified role created by this recruiter
        const jobs = await Job.find({ recruiterId, title: job_role });
        const jobIds = jobs.map(job => job._id);
        
        // Find applications for these jobs
        const applications = await Application.find({ jobId: { $in: jobIds } })
            .populate("userId", "name email profilePhoto experience")
            .populate("jobId", "title");
            
        const data = {
            rows: applications.map(app => ({
                applicant_id: app.userId._id,
                name: app.userId.name,
                email_id: app.userId.email,
                profile_photo: app.userId.profilePhoto,
                exp_level: app.userId.experience,
                job_role: app.jobId.title,
                application_id: app._id,
                isSaved: app.saved || false
            }))
        };
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get applicant details
router.get("/applicantDetails", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { applicant_id, application_id } = req.query;
        
        // Get applicant details
        const application = await Application.findById(application_id)
            .populate("userId")
            .populate("jobId");
            
        if (!application) return res.status(404).json({ msg: "Application not found" });
        
        // Mark application as viewed
        application.isViewed = true;
        await application.save();
        
        res.json({
            applicant: application.userId,
            jobRole: application.jobId.title,
            application_id: application._id
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Update application status
router.post("/applicantDetails", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { application_id, status, applicant_id } = req.body;
        
        // Update application status
        const application = await Application.findById(application_id);
        if (!application) return res.status(404).json({ msg: "Application not found" });
        
        application.status = status;
        await application.save();
        
        // Get application details for email
        const populatedApp = await Application.findById(application_id)
            .populate("userId", "email")
            .populate("jobId", "title company");
            
        // Send status email
        // Note: Implementation depends on your email service
        // This is a placeholder for the email functionality
        await sendStatusEmail(
            populatedApp.userId.email,
            status,
            populatedApp.jobId.title,
            populatedApp.jobId.company
        );
        
        res.json({ msg: "Application status updated successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Save or unsave an application
router.get("/saveUnsaveTheApplication", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { isSaved, application_id } = req.query;
        
        // Toggle the saved status
        const newSavedStatus = isSaved == 0 ? true : false;
        
        // Update the application
        const application = await Application.findByIdAndUpdate(
            application_id,
            { saved: newSavedStatus },
            { new: true }
        );
        
        if (!application) return res.status(404).json({ msg: "Application not found" });
        
        res.json({ msg: "Application saved status updated", application });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all saved applications
router.get("/allSavedApplications", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const recruiterId = req.user.id;
        
        // Find all jobs by this recruiter
        const jobs = await Job.find({ recruiterId });
        const jobIds = jobs.map(job => job._id);
        
        // Find all saved applications for these jobs
        const applications = await Application.find({ 
            jobId: { $in: jobIds },
            saved: true 
        })
        .populate("userId", "name email profilePhoto experience")
        .populate("jobId", "title");
        
        const data = {
            rows: applications.map(app => ({
                applicant_id: app.userId._id,
                name: app.userId.name,
                email_id: app.userId.email,
                profile_photo: app.userId.profilePhoto,
                exp_level: app.userId.experience,
                job_role: app.jobId.title,
                application_id: app._id,
                isSaved: app.saved
            }))
        };
        
        res.json(data);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Delete an application
router.get("/deleteApplication", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { application_id } = req.query;
        
        // Get application details for email before deletion
        const application = await Application.findById(application_id)
            .populate("userId", "email")
            .populate("jobId", "title company");
            
        if (!application) return res.status(404).json({ msg: "Application not found" });
        
        // Send rejection email
        await sendStatusEmail(
            application.userId.email,
            "Rejected",
            application.jobId.title,
            application.jobId.company
        );
        
        // Delete the application
        await Application.findByIdAndDelete(application_id);
        
        res.json({ msg: "Application deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get chart data for applications by job role
router.get("/charts", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const recruiterId = req.user.id;
        
        // Find all jobs by this recruiter
        const jobs = await Job.find({ recruiterId });
        
        // Create a map to store job role and application count
        const jobRoleMap = new Map();
        
        // Count applications for each job
        for (const job of jobs) {
            const applications = await Application.countDocuments({ jobId: job._id });
            jobRoleMap.set(job.title, applications);
        }
        
        // Convert to chart data format
        const jobRole = Array.from(jobRoleMap.keys());
        const count = Array.from(jobRoleMap.values());
        
        res.json({ jobRole, count });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Update job (Only for Recruiters)
router.put("/update-job/:jobId", authMiddleware(["recruiter"]), async (req, res) => {
    try {
        const { jobId } = req.params;
        const recruiterId = req.user.id;
        const updates = req.body;

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ msg: "Job not found" });
        if (job.recruiterId.toString() !== recruiterId) return res.status(403).json({ msg: "Unauthorized" });

        const updatedJob = await Job.findByIdAndUpdate(jobId, updates, { new: true });
        res.json({ msg: "Job updated successfully", job: updatedJob });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// Helper function for sending status emails (placeholder)
async function sendStatusEmail(email, status, jobRole, company) {
    // This would be implemented with your email service
    console.log(`Email sent to ${email} about ${status} for ${jobRole} at ${company}`);
    return { success: true };
}

module.exports = router;