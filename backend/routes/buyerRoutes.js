const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Application = require("../models/Application");
const Job = require("../models/Job");

const router = express.Router();

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

        const application = new Application({ userId: req.user.id, jobId, skills, experience, resume, status: "pending" });
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

module.exports = router;
