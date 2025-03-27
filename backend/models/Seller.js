const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")

const SellerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["seller"], default: "seller" },

    // Profile picture field (newly added)
    profilePic: { type: String},
    
    // Seller Dashboard
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    totalEarnings: { type: Number, default: 0 }
});

module.exports = mongoose.model("Seller", SellerSchema);
