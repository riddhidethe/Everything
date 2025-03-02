const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },  // Image URL
    category: { type: String },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Product", ProductSchema);
