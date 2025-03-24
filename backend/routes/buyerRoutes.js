const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User"); // Added User model
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profiles");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Protect this route with authMiddleware
router.get("/protected-route", authMiddleware, (req, res) => {
    res.json({ msg: "You are authenticated!", user: req.user });
});

// 📌 Get all available products
router.get("/products", async (req, res) => {
    try {
        const products = await Product.find({ status: "available" });
        res.json(products);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Buy a product
router.post("/buy-product/:id", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product || product.status !== "available") return res.status(404).json({ msg: "Product not available" });

        product.status = "pending";
        await product.save();

        const order = new Order({ buyerId: req.user.id, productId: product._id });
        await order.save();

        res.json({ msg: "Purchase request submitted", order });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all purchased products
router.get("/my-orders", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const orders = await Order.find({ buyerId: req.user.id }).populate("productId");
        res.json(orders);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Apply for a job
router.post("/apply-job", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const { jobId, skills, experience, resume } = req.body;
        const job = await Job.findById(jobId);

        if (!job) return res.status(404).json({ msg: "Job not found" });

        // Create current date in YYYY-MM-DD format
        const today = new Date();
        const appliedDate = today.toISOString().split('T')[0];

        const application = new Application({ 
            userId: req.user.id, 
            jobId, 
            skills, 
            experience, 
            resume, 
            status: "pending",
            appliedDate,
            isViewed: 1,
            isSaved: 0
        });
        await application.save();

        res.json({ msg: "Job application submitted successfully", application });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all job applications
router.get("/my-applications", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const applications = await Application.find({ userId: req.user.id }).populate("jobId");
        res.json(applications);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// NEW API CALLS BASED ON FIRST EXAMPLE

// 📌 Get home page data
router.get("/home", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // Get top 6 jobs by application count
        const topJobs = await Application.aggregate([
            { $group: { _id: "$jobId", applicationCount: { $sum: 1 } } },
            { $sort: { applicationCount: -1 } },
            { $limit: 6 }
        ]);
        
        const topJobIds = topJobs.map(job => job._id);
        const popularJobs = await Job.find({ _id: { $in: topJobIds } });
        
        // Get notifications
        const notifications = await Application.find({
            userId: req.user.id,
            isViewed: 1,
            status: { $ne: "pending" }
        }).populate("jobId");
        
        res.json({ 
            user, 
            popularJobs, 
            notifications,
            profilePic: user.profilePicCode
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get job list
router.get("/job-list", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        // Get all jobs
        const jobs = await Job.find();
        
        // Get notifications
        const notifications = await Application.find({
            userId: req.user.id,
            isViewed: 1,
            status: { $ne: "pending" }
        }).populate("jobId");
        
        res.json({ 
            jobs, 
            notifications,
            toastNotification: req.query.toastNotification
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all jobs
router.get("/jobs", async (req, res) => {
    try {
        const jobs = await Job.find();
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Filter jobs
router.post("/filters", async (req, res) => {
    try {
        const { city, skills, jobRole, jobType, company, workType, workMode, sortBy } = req.body;
        
        // Build query object
        const query = {};
        
        if (city) query.city = { $regex: city, $options: 'i' };
        if (skills) query.skillsRequired = { $regex: skills, $options: 'i' };
        if (jobRole) query.jobRole = { $regex: jobRole, $options: 'i' };
        if (jobType) query.jobType = { $regex: jobType, $options: 'i' };
        if (company) query.company = { $regex: company, $options: 'i' };
        if (workType) query.workType = { $regex: workType, $options: 'i' };
        if (workMode) query.workMode = { $regex: workMode, $options: 'i' };
        
        // Apply sorting
        let sort = {};
        if (sortBy === 'salaryHighToLow') {
            sort = { minSalary: -1 };
        } else if (sortBy === 'salaryLowToHigh') {
            sort = { minSalary: 1 };
        }
        
        const jobs = await Job.find(query).sort(sort);
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get job details
router.get("/job-details/:id", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ msg: "Job not found" });
        
        // Find similar jobs with same job role
        const similarJobs = await Job.find({ 
            jobRole: job.jobRole,
            _id: { $ne: job._id }
        });
        
        // Get notifications
        const notifications = await Application.find({
            userId: req.user.id,
            isViewed: 1,
            status: { $ne: "pending" }
        }).populate("jobId");
        
        // Check if user has applied for this job
        const hasApplied = await Application.exists({ 
            userId: req.user.id,
            jobId: req.params.id
        });
        
        res.json({
            job,
            similarJobs,
            notifications,
            isApplied: !!hasApplied
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get user dashboard data
router.get("/dashboard", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        // Get user data
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // Parse skills if they exist
        const userWithParsedSkills = {
            ...user.toObject(),
            skills: user.skills ? user.skills.split(',') : []
        };
        
        // Get user's applications with job details
        const applications = await Application.find({ userId: req.user.id })
            .populate('jobId')
            .sort({ _id: -1 });
        
        // Get unique job roles from user's applications
        const uniqueJobs = await Application.aggregate([
            { $match: { userId: req.user.id } },
            { $lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', as: 'jobDetails' } },
            { $unwind: '$jobDetails' },
            { $group: { _id: '$jobDetails.jobRole' } },
            { $project: { jobRole: '$_id', _id: 0 } }
        ]);
        
        res.json({
            user: userWithParsedSkills,
            applications,
            uniqueJobs
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get applicant dashboard
router.get("/applicant-dashboard", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        // Get user data
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // Parse skills if they exist
        const userWithParsedSkills = {
            ...user.toObject(),
            skills: user.skills ? user.skills.split(',') : []
        };
        
        // Get notifications
        const notifications = await Application.find({
            userId: req.user.id,
            isViewed: 1,
            status: { $ne: "pending" }
        }).populate("jobId");
        
        res.json({
            user: userWithParsedSkills,
            notifications
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get user profile for editing
router.get("/edit-profile", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // Get notifications
        const notifications = await Application.find({
            userId: req.user.id,
            isViewed: 1,
            status: { $ne: "pending" }
        }).populate("jobId");
        
        res.json({
            user,
            notifications
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Delete notification
router.put("/delete-notification/:jobId", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        await Application.findOneAndUpdate(
            { userId: req.user.id, jobId: req.params.jobId },
            { isViewed: 0 }
        );
        
        res.json({ msg: "Notification deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Delete profile picture
router.delete("/delete-profile-pic", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.profilePicCode) return res.status(404).json({ msg: "No profile picture found" });
        
        // Delete file from filesystem
        const filePath = path.join(__dirname, `../public/uploads/profile_images/${user.profilePicCode}`);
        fs.unlink(filePath, async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: "Error deleting file", error: err });
            }
            
            // Update user record
            user.profilePicCode = null;
            await user.save();
            
            res.json({ msg: "Profile picture deleted successfully" });
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Upload user profile
router.post("/upload-profile", authMiddleware(["buyer", "applicant"]), upload.single('prof-pdf'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
        
        const { first_name, last_name, age, mobile_no, email_id, exp, gender, skills } = req.body;
        
        // Create or update profile
        await User.findByIdAndUpdate(req.user.id, {
            firstName: first_name,
            lastName: last_name,
            age,
            mobileNo: mobile_no,
            emailId: email_id,
            experience: exp,
            gender,
            skills,
            profilePicCode: req.file.filename,
            resumeFileName: req.file.originalname
        }, { new: true });
        
        res.json({ msg: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Update user profile
router.put("/update-profile", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const { firstName, lastName, age, mobileNo, emailId, experience, gender, skills } = req.body;
        
        await User.findByIdAndUpdate(req.user.id, {
            firstName,
            lastName,
            age,
            mobileNo,
            emailId,
            experience,
            gender,
            skills
        }, { new: true });
        
        res.json({ msg: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

module.exports = router;
