const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Report = require("../models/Report");

const router = express.Router();

// 📌 Get all users  
router.get("/users", authMiddleware(["admin"]), async (req, res) => {
    try {
        const users = await User.find({}, "name email role status");
        res.json(users);
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

// 📌 Get all reported users or products
router.get("/reports", authMiddleware(["admin"]), async (req, res) => {
    try {
        const reports = await Report.find().populate("reportedBy", "name email");
        res.json(reports);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Remove a fraudulent user
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

module.exports = router;
