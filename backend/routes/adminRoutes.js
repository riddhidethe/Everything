const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Report = require("../models/Report");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const { Jobs } = require("openai/resources/fine-tuning/jobs/jobs.mjs");

const router = express.Router();

// Middleware
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// 📌 Admin dashboard route
router.get('/', authMiddleware(["admin"]), (req, res) => {
    res.render('admin/admin_home', { 
        username: req.user.name, 
        toastNotification: req.query.toastNotification 
    });
});

// 📌 Login page render
router.get('/login', (req, res) => {
    res.render('admin/admin_login_form', { errorMsg: null });
});

// 📌 Admin login authentication with JWT
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const admin = await User.findOne({ email, role: "admin" });
        
        if (!admin) {
            return res.render('admin/admin_login_form', { errorMsg: "Email ID not found" });
        }
        
        // Compare hashed password
        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.render('admin/admin_login_form', { errorMsg: "Wrong Password" });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        // Set token in cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        
        res.redirect('/admin?toastNotification=Logged In Successfully!!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all users
router.get("/users", authMiddleware(["admin"]), async (req, res) => {
    try {
        const users = await User.find({}, "name email role status");
        res.json(users);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get filtered users 
router.post('/filter-users', authMiddleware(["admin"]), async (req, res) => {
    try {
        const { role, status } = req.body;
        let query = {};
        
        if (role) query.role = role;
        if (status) query.status = status;
        
        const users = await User.find(query, "name email role status");
        res.json({ rows: users });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Block or unblock a user
router.put("/block-user/:id", authMiddleware(["admin"]), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        user.status = user.status === "active" ? "blocked" : "active";
        await user.save();

        res.json({ msg: `User ${user.status} successfully`, user });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Alternative route for blocking/unblocking (GET method from original code)
router.get('/take-action', authMiddleware(["admin"]), async (req, res) => {
    try {
        const { user_id, isActive } = req.query;
        
        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        user.status = isActive === "1" ? "active" : "blocked";
        await user.save();
        
        res.redirect('/admin?toastNotification=Status Updated Successfully!!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all reported users or products
router.get("/reports", authMiddleware(["admin"]), async (req, res) => {
    try {
        const reports = await Report.find().populate("reportedBy", "name email");
        res.json(reports);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Remove a user (API style)
router.delete("/remove-user/:id", authMiddleware(["admin"]), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        // Store email in ex_users collection if needed
        const email = user.email;
        
        await User.findByIdAndDelete(req.params.id);
        
        // If you need to keep track of deleted emails
        // await ExUser.create({ email });
        
        res.json({ msg: "User removed successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Alternative route for user deletion (GET method from original code)
router.get('/delete-user', authMiddleware(["admin"]), async (req, res) => {
    try {
        const { user_id } = req.query;
        
        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // Store email in ex_users collection if needed
        const email = user.email;
        
        await User.findByIdAndDelete(user_id);
        
        res.redirect('/admin?toastNotification=Deleted Successfully!!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get user details for frontend
router.get('/user-details/:id', authMiddleware(["admin"]), async (req, res) => {
    try {
        const userId = req.params.id;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // You might want to fetch additional data related to this user
        
        res.json({
            userData: user
            // Include any additional data here
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Update user details with bcrypt hashing
router.post('/update-user/:id', authMiddleware(["admin"]), async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, password, status, role } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        // Update user data
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) {
            const saltRounds = 10;
            user.password = await bcrypt.hash(password, saltRounds);
        }
        if (status) user.status = status;
        if (role) user.role = role;
        
        await user.save();
        
        res.redirect('/admin?toastNotification=Updated Successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

router.get('/delete-job', authMiddleware(["admin"]), async (req, res) => {
    try {
        const { job_id } = req.query;  // Extract job_id from query parameters
        
        const job = await Jobs.findById(job_id);
        if (!job) return res.status(404).json({ msg: "Job not found" });

        // Optional: Store deleted job details in another collection if needed

        await Job.findByIdAndDelete(job_id);

        res.redirect('/admin?toastNotification=Job Deleted Successfully!!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});


// 📌 Logout route - clearing JWT cookie
router.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/admin/login');
});

module.exports = router;