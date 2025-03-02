const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Recruiter = require("../models/Recruiter");
const Admin = require("../models/Admin");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Register a new user
router.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    if (role === "seller") user = new Seller({ name, email, password: hashedPassword });
    else if (role === "recruiter") user = new Recruiter({ name, email, password: hashedPassword });
    else user = new User({ name, email, password: hashedPassword, role: "buyer" }); // Default to buyer

    await user.save();
    res.status(201).json({ msg: "User registered successfully!" });
});

// 📌 Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    
    let user = await User.findOne({ email }) || await Seller.findOne({ email }) || 
               await Recruiter.findOne({ email }) || await Admin.findOne({ email });

    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", { expiresIn: "7d" });
    res.json({ token, role: user.role });
});

// 📌 Get Profile
router.get("/profile", authMiddleware(["buyer", "applicant", "seller", "recruiter"]), async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
});

module.exports = router;
