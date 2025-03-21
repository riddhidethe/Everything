const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Recruiter = require("../models/Recruiter");
const Admin = require("../models/Admin");
const authMiddleware = require("../middleware/authMiddleware");
const sendMail = require("../../FUNCTION/mailSetup"); // Equivalent to mailFunc in your first code

const router = express.Router();

// 📌 Register a new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, confirmPassword, role } = req.body;

        // Check if email exists in blocked list (ex_applicants equivalent)
        // Implementation depends on your model structure
        const isBlocked = await User.findOne({ email, isBlocked: true });
        if (isBlocked) {
            return res.status(400).json({ msg: "Email is blocked" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email }) || 
                            await Seller.findOne({ email }) || 
                            await Recruiter.findOne({ email }) ||
                            await Admin.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({ msg: "Email already exists" });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ msg: "Passwords do not match" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        let user;
        if (role === "seller") user = new Seller({ name, email, password: hashedPassword });
        else if (role === "recruiter") user = new Recruiter({ name, email, password: hashedPassword });
        else if (role === "applicant") user = new User({ name, email, password: hashedPassword, isActive: true });
        else user = new User({ name, email, password: hashedPassword }); // Default to buyer

        await user.save();
        
        // If applicant, redirect to complete profile form
        if (role === "applicant") {
            // Create session or token for form completion
            const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", { expiresIn: "1d" });
            return res.status(201).json({ msg: "Registration started", token, completeProfile: true });
        }
        
        res.status(201).json({ msg: "User registered successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// 📌 Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        let user = await User.findOne({ email }) || 
                  await Seller.findOne({ email }) || 
                  await Recruiter.findOne({ email }) || 
                  await Admin.findOne({ email });

        if (!user) return res.status(400).json({ msg: "Invalid credentials" });

        // Check if applicant is active
        if (user.role === "applicant" && !user.isActive) {
            return res.status(403).json({ msg: "Account is inactive" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", { expiresIn: "7d" });
        res.json({ token, role: user.role, msg: "Logged in successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// 📌 Login via OTP
router.post("/login-via-otp", async (req, res) => {
    try {
        const { email } = req.body;
        
        let user = await User.findOne({ email }) || 
                  await Seller.findOne({ email }) || 
                  await Recruiter.findOne({ email }) || 
                  await Admin.findOne({ email });

        if (!user) return res.status(400).json({ msg: "Email not found" });

        // Check if applicant is active
        if (user.role === "applicant" && !user.isActive) {
            return res.status(403).json({ msg: "Account is inactive" });
        }

        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes
        
        // Store OTP in user document
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        
        // Send OTP email
        await sendMail({
            to: email,
            subject: "Login OTP",
            text: `Your OTP for login is: ${otp}`
        });
        
        res.json({ msg: "OTP sent successfully", userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// 📌 Verify OTP
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        let user = await User.findOne({ email }) || 
                  await Seller.findOne({ email }) || 
                  await Recruiter.findOne({ email }) || 
                  await Admin.findOne({ email });

        if (!user) return res.status(400).json({ msg: "User not found" });

        // Check if OTP matches and is not expired
        if (user.otp !== otp) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }
        
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ msg: "OTP expired" });
        }

        // Clear OTP fields
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // Generate token
        const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", { expiresIn: "7d" });
        res.json({ token, role: user.role, msg: "Logged in successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// 📌 Request Password Reset
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        
        let user = await User.findOne({ email }) || 
                  await Seller.findOne({ email }) || 
                  await Recruiter.findOne({ email }) || 
                  await Admin.findOne({ email });

        if (!user) return res.status(400).json({ msg: "Email not found" });

        // Generate and send OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes
        
        // Store OTP in user document
        user.resetOtp = otp;
        user.resetOtpExpiry = otpExpiry;
        await user.save();
        
        // Send OTP email
        await sendMail({
            to: email,
            subject: "Password Reset OTP",
            text: `Your OTP for password reset is: ${otp}`
        });
        
        res.json({ msg: "OTP sent successfully", email });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// 📌 Verify Reset OTP
router.post("/verify-reset-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        let user = await User.findOne({ email }) || 
                  await Seller.findOne({ email }) || 
                  await Recruiter.findOne({ email }) || 
                  await Admin.findOne({ email });

        if (!user) return res.status(400).json({ msg: "User not found" });

        // Check if OTP matches and is not expired
        if (user.resetOtp !== otp) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }
        
        if (user.resetOtpExpiry < new Date()) {
            return res.status(400).json({ msg: "OTP expired" });
        }

        // Generate temporary token for password reset
        const resetToken = jwt.sign({ id: user._id, email: user.email }, "RESET_SECRET_KEY", { expiresIn: "15m" });
        res.json({ msg: "OTP verified", resetToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// 📌 Reset Password
router.post("/reset-password", async (req, res) => {
    try {
        const { resetToken, password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            return res.status(400).json({ msg: "Passwords do not match" });
        }

        // Verify token
        const decoded = jwt.verify(resetToken, "RESET_SECRET_KEY");
        const email = decoded.email;
        
        let user = await User.findOne({ email }) || 
                  await Seller.findOne({ email }) || 
                  await Recruiter.findOne({ email }) || 
                  await Admin.findOne({ email });

        if (!user) return res.status(400).json({ msg: "User not found" });

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        await user.save();
        
        res.json({ msg: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ msg: "Invalid or expired token" });
        }
        res.status(500).json({ msg: "Server error" });
    }
});

// 📌 Change Password
router.post("/change-password", authMiddleware(["buyer", "applicant", "seller", "recruiter", "admin"]), async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ msg: "New passwords do not match" });
        }

        const userId = req.user.id;
        const userRole = req.user.role;
        
        // Find the user in the appropriate collection based on role
        let Model;
        if (userRole === "buyer" || "applicant") Model = User;
        else if (userRole === "seller") Model = Seller;
        else if (userRole === "recruiter") Model = Recruiter;
        else if (userRole === "admin") Model = Admin;
        
        const user = await Model.findById(userId);
        if (!user) return res.status(404).json({ msg: "User not found" });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        
        res.json({ msg: "Password changed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// 📌 Get Profile
router.get("/profile", authMiddleware(["buyer", "applicant", "seller", "recruiter", "admin"]), async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        // Find the user in the appropriate collection based on role
        let Model;
        if (userRole === "buyer" || "applicant") Model = User;
        else if (userRole === "seller") Model = Seller;
        else if (userRole === "recruiter") Model = Recruiter;
        else if (userRole === "admin") Model = Admin;
        
        const user = await Model.findById(userId).select("-password -otp -otpExpiry -resetOtp -resetOtpExpiry");
        if (!user) return res.status(404).json({ msg: "User not found" });
        
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// 📌 Logout (JWT-based auth doesn't need server-side logout,
// but we can add a blacklist for tokens if needed)
router.post("/logout", authMiddleware(["buyer", "applicant", "seller", "recruiter", "admin"]), (req, res) => {
    // Client should delete the token
    res.json({ msg: "Logged out successfully" });
});

module.exports = router;