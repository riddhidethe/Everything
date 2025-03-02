const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Product = require("../models/Product");

const router = express.Router();

// 📌 Add a new product (Only for Sellers)
router.post("/add-product", authMiddleware(["seller"]), async (req, res) => {
    try {
        const { title, price, description, category } = req.body;
        const sellerId = req.user.id;

        const product = new Product({ sellerId, title, price, description, category, status: "available" });
        await product.save();

        res.status(201).json({ msg: "Product added successfully", product });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get seller dashboard data
router.get("/dashboard", authMiddleware(["seller"]), async (req, res) => {
    try {
        const sellerId = req.user.id;
        const soldProducts = await Product.find({ sellerId, status: "sold" });
        const pendingRequests = await Product.find({ sellerId, status: "pending" });

        res.json({ soldProductsCount: soldProducts.length, pendingRequestsCount: pendingRequests.length });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Get all products added by the seller
router.get("/my-products", authMiddleware(["seller"]), async (req, res) => {
    try {
        const sellerId = req.user.id;
        const products = await Product.find({ sellerId });
        res.json(products);
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Update product details
router.put("/update-product/:id", authMiddleware(["seller"]), async (req, res) => {
    try {
        const { title, price, description, category } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ msg: "Product not found" });
        if (product.sellerId.toString() !== req.user.id) return res.status(403).json({ msg: "Unauthorized" });

        product.title = title || product.title;
        product.price = price || product.price;
        product.description = description || product.description;
        product.category = category || product.category;

        await product.save();
        res.json({ msg: "Product updated successfully", product });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

// 📌 Delete a product
router.delete("/delete-product/:id", authMiddleware(["seller"]), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ msg: "Product not found" });
        if (product.sellerId.toString() !== req.user.id) return res.status(403).json({ msg: "Unauthorized" });

        await Product.findByIdAndDelete(req.params.id);
        res.json({ msg: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ msg: "Server error", error });
    }
});

module.exports = router;
