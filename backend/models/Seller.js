const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["seller"], default: "seller" },

    // Seller Dashboard
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    totalEarnings: { type: Number, default: 0 }
});

// Hash password before saving
SellerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to check password
SellerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Seller", SellerSchema);
