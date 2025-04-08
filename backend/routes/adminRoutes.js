const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Admin = require("../models/Admin");
const Recruiter = require("../models/Recruiter");
const User = require("../models/User");
const Report = require("../models/Report");
const bcrypt = require("bcrypt");

const router = express.Router();

// Middleware
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// 📌 Admin dashboard route
router.get('/', authMiddleware(["admin"]), (req, res) => {
    res.render('admin/admin_home', { 
        // username: req.session.admin.name, 
        toastNotification: req.query.toastNotification 
    });
});

// 📌 Login page render
router.get('/login', (req, res) => {
    res.render('admin/admin_login_form', { errorMsg: null });
});

// 📌 Admin login authentication with SESSION
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email, role: "admin" });

        if (!admin) {
            return res.render('admin/admin_login_form', { errorMsg: "Email ID not found" });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.render('admin/admin_login_form', { errorMsg: "Wrong Password" });
        }

        // Store user in session
        req.session.admin = {
            id: admin._id,
            name: admin.name,
            role: admin.role
        };

        res.redirect('/api/admin?toastNotification=Logged In Successfully!!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// Route: GET /api/admin/admin_recruiter_details
router.get('/admin_recruiter_details', async (req, res) => {
    try {
      const recruiters = await Recruiter.find().sort({ createdAt: -1 });
      res.render('admin/admin_recruiter_details', { recruiters });  // Rendering the view with data
    } catch (error) {
      console.error("Error fetching recruiter details:", error);
      res.status(500).send("Server Error");
    }
  });  
  
// Route: GET /api/admin/admin_applicant_page
router.get('/admin_applicant_page', async (req, res) => {
    try {
      const applicants = await User.find().sort({ createdAt: -1 });
      res.render('admin/admin_applicant_page', { applicants }); // Render view with data
    } catch (error) {
      console.error("Error fetching applicant details:", error);
      res.status(500).send("Server Error");
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

// 📌 Alternative block/unblock via query
router.get('/take-action', authMiddleware(["admin"]), async (req, res) => {
    try {
        const { user_id, isActive } = req.query;

        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        user.status = isActive === "1" ? "active" : "blocked";
        await user.save();

        res.redirect('/api/admin?toastNotification=Status Updated Successfully!!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all reports
router.get("/reports", authMiddleware(["admin"]), async (req, res) => {
    try {
        const reports = await Report.find().populate("reportedBy", "name email");
        res.json(reports);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Delete user (API)
router.delete("/remove-user/:id", authMiddleware(["admin"]), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        await User.findByIdAndDelete(req.params.id);

        res.json({ msg: "User removed successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Delete user (GET alternative)
router.get('/delete-user', authMiddleware(["admin"]), async (req, res) => {
    try {
        const { user_id } = req.query;

        const user = await User.findById(user_id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        await User.findByIdAndDelete(user_id);

        res.redirect('/api/admin?toastNotification=Deleted Successfully!!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get user details
router.get('/user-details/:id', authMiddleware(["admin"]), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        res.json({ userData: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Update user details
router.post('/update-user/:id', authMiddleware(["admin"]), async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, password, status, role } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: "User not found" });

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) {
            const saltRounds = 10;
            user.password = await bcrypt.hash(password, saltRounds);
        }
        if (status) user.status = status;
        if (role) user.role = role;

        await user.save();

        res.redirect('/api/admin?toastNotification=Updated Successfully!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Delete job
router.get('/delete-job', authMiddleware(["admin"]), async (req, res) => {
    try {
        const { job_id } = req.query;

        const job = await Job.findById(job_id);
        if (!job) return res.status(404).json({ msg: "Job not found" });

        await Job.findByIdAndDelete(job_id);

        res.redirect('/api/admin?toastNotification=Job Deleted Successfully!!');
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Logout route - destroy session
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Logout error:", err);
        }
        res.redirect('/api/admin/login');
    });
});

module.exports = router;
