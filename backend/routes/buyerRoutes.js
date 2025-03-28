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
const upload = require("../../FUNCTION/uploadSetup")

const router = express.Router(); 

// Configure multer for file upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads/profiles");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });

// const upload = multer({ storage: storage });

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
        if (!product || product.status !== "available") {
            return res.status(404).json({ msg: "Product not available" });
        }

        product.status = "pending";
        await product.save();

        const order = new Order({ buyerId: req.user._id, productId: product._id });
        await order.save();

        res.json({ msg: "Purchase request submitted", order });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all purchased products
router.get("/my-orders", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const orders = await Order.find({ buyerId: req.user._id }).populate("productId");
        res.json(orders);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Apply for a job
// router.post("/apply-job", authMiddleware(["buyer", "applicant"]), async (req, res) => {
//     try {
//         const { jobId, skills, experience, resume } = req.body;
//         const job = await Job.findById(jobId);

//         if (!job) return res.status(404).json({ msg: "Job not found" });

//         // Create current date in YYYY-MM-DD format
//         const today = new Date();
//         const appliedDate = today.toISOString().split('T')[0];

//         const application = new Application({ 
//             userId: req.user.id, 
//             jobId, 
//             skills, 
//             experience, 
//             resume, 
//             status: "pending",
//             appliedDate,
//             isViewed: 1,
//             isSaved: 0
//         });
//         await application.save();

//         res.json({ msg: "Job application submitted successfully", application });
//     } catch (error) {
//         res.status(500).json({ msg: "Server error", error });
//     }
// });

router.post("/apply-job", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const { jobId, skills, experience, resume } = req.body;
        if (!jobId || !skills || !experience || !resume) {
            return res.status(400).json({ msg: "Missing required fields" });
        }

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ msg: "Job not found" });

        const today = new Date();
        const appliedDate = today.toISOString().split("T")[0];

        const application = new Application({
            userId: req.user._id,
            jobId,
            skills,
            experience,
            resume,
            status: "pending",
            appliedDate,
            isViewed: 1,
            isSaved: 0,
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
        const applications = await Application.find({ userId: req.user._id }).populate("jobId");
        res.json(applications);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// NEW API CALLS BASED ON FIRST EXAMPLE

// 📌 Get home page data
router.get("/home", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        console.log("Session in /home:", req.session);
        console.log("User from middleware:", req.user);

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        console.log("User found:", user);

        // Get top 6 jobs by application count
        const topJobs = await Application.aggregate([
            { $group: { _id: "$jobId", applicationCount: { $sum: 1 } } },
            { $sort: { applicationCount: -1 } },
            { $limit: 6 }
        ]);
        
        console.log("Top Jobs:", topJobs);

        const topJobIds = topJobs.map(job => job._id);
        const popularJobs = await Job.find({ _id: { $in: topJobIds } });
        
        console.log("Popular Jobs:", popularJobs);

        // Get notifications
        const notifications = await Application.find({
            userId: req.user._id,
            isViewed: 1,
            status: { $ne: "pending" }
        }).populate("jobId");

        console.log("Notifications:", notifications);
        
        // ✅ Render the `applicant_homepage.ejs` file with necessary data
        res.render("applicant/applicant_homepage", {
            userId: user._id,
            profilePic: user.profilePic || "user.png",
            isLogged: true,  // Since user is authenticated
            r2: popularJobs,
            notifications
        });

    } catch (error) {
        console.error("Error loading applicant homepage:", error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get job list
router.get("/job-list", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        // Ensure user is authenticated and available
        if (!req.user) {
            return res.status(401).json({ msg: "Unauthorized: User not found" });
        }

        // Get all jobs
        const jobs = await Job.find();
        
        // Get notifications
        const notifications = await Application.find({
            userId: req.user._id,
            isViewed: 1,
            status: { $ne: "pending" }
        }).populate("jobId");

        // Render the page
        res.render("applicant/jobList", { 
            userId: req.user._id,   // Use req.user instead of undefined user
            profilePic: req.user.profilePic || "user.png",
            isLogged: true,
            jobs, 
            notifications,
            toastNotification: req.query.toastNotification
        });
    } catch (error) {
        console.error("Error in /job-list route:", error);
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
            userId: req.user._id,
            isViewed: 1,
            status: { $ne: "pending" }
        }).populate("jobId");
        
        // Check if user has applied for this job
        const hasApplied = await Application.exists({ 
            userId: req.user._id,
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
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // Parse skills if they exist
        const userWithParsedSkills = {
            ...user.toObject(),
            skills: user.skills ? user.skills.split(',') : []
        };
        
        // Get user's applications with job details
        const applications = await Application.find({ userId: req.user._id })
            .populate('jobId')
            .sort({ _id: -1 });
        
        // Get unique job roles from user's applications
        const uniqueJobs = await Application.aggregate([
            { $match: { userId: req.user._id } },
            { $lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', as: 'jobDetails' } },
            { $unwind: '$jobDetails' },
            { $group: { _id: '$jobDetails.jobRole' } },
            { $project: { jobRole: '$_id', _id: 0 } }
        ]);
        
        res.json({
            user: user,
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
        // Check if req.user exists
        if (!req.user || !req.user._id) {
            return res.status(401).json({ msg: "Unauthorized: User not found in session" });
        }

        console.log("User ID:", req.user._id); // Debugging

        // Get user data
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        console.log("Fetched User:", user); // Debugging

        // Ensure skills is an array
        const userWithParsedSkills = {
            ...user.toObject(),
            skills: Array.isArray(user.skills) ? user.skills : []  // FIXED
        };

        console.log("Parsed User Data:", userWithParsedSkills); // Debugging

        // Get notifications
        const notifications = await Application.find({
            userId: req.user._id,
            isViewed: 1,
            status: { $ne: "pending" }
        }).populate("jobId");

        console.log("Notifications:", notifications); // Debugging

        // Render the dashboard
        res.render("applicant/applicant_dashboard", {
            userId: req.user._id,
            profilePic: user.profilePic || "user.png",
            isLogged: true,
            user: user,
            notifications
        });
    } catch (error) {
        console.error("Error in /applicant-dashboard:", error);
        res.status(500).json({ msg: "Server error", error: error.message });
    }
});

// 📌 Get user profile for editing
router.get("/edit-profile", authMiddleware(["buyer", "applicant"]), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // Get notifications
        const notifications = await Application.find({
            userId: req.user._id,
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
            { userId: req.user._id, jobId: req.params.jobId },
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
        const user = await User.findById(req.user._id);
        if (!user || !user.profilePic) return res.status(404).json({ msg: "No profile picture found" });
        
        // Delete file from filesystem
        const filePath = path.join(__dirname, `../public/uploads/profile_images/${user.profilePic}`);
        fs.unlink(filePath, async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: "Error deleting file", error: err });
            }
            
            // Update user record
            user.profilePic = null;
            await user.save();
            
            res.json({ msg: "Profile picture deleted successfully" });
        });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Update user profile
router.post(
    "/upload-profile",
    authMiddleware(["buyer", "applicant"]),
    upload.fields([
        { name: "profilePic", maxCount: 1 },
        { name: "resume", maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            console.log("Session User:", req.session.user); // Debugging

            if (!req.session.user || !req.session.user._id) {
                return res.redirect("/api/auth/login");
            }

            if (!req.files || (!req.files.profilePic && !req.files.resume)) {
                return res.status(400).json({ msg: "No files uploaded" });
            }

            const { first_name, last_name, age, mobile_no, email, exp, gender, skills } = req.body;

            const profilePic = req.files.profilePic ? req.files.profilePic[0].filename : null;
            const resumePath = req.files.resume ? req.files.resume[0].filename : null;

            const updatedUser = await User.findOneAndUpdate(
                { _id: req.session.user._id }, // ✅ Fixed
                {
                    firstName: first_name,
                    lastName: last_name,
                    age,
                    mobileNo: mobile_no,
                    emailId: email,
                    exp: exp,
                    gender,
                    skills,
                    ...(profilePic && { profilePic: profilePic }),
                    ...(resumePath && { resumeFileName: resumePath })
                },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ msg: "User not found" });
            }

            console.log("Profile updated successfully");

            // Destroy session and redirect to login
            req.session.destroy((err) => {
                if (err) {
                    console.error("Session Destroy Error:", err);
                    return res.status(500).json({ msg: "Server error" });
                }
                res.redirect("/api/auth/login"); // Redirecting to the login page
            });
        } catch (error) {
            console.error("Profile Update Error:", error);
            res.status(500).json({ msg: "Server error", error: error.message });
        }
    }
);


module.exports = router;
