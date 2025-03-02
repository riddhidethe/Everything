require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json()); 

// CORS configuration
const corsOptions = {
    origin: ["http://localhost:3000"], // Update with frontend URL
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};
app.use(cors(corsOptions));

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB Connected");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
};
connectDB();

// Routes
app.use("/api/auth", require("./backend/routes/authRoutes"));
app.use("/api/buyer", require("./backend/routes/buyerRoutes"));
app.use("/api/seller", require("./backend/routes/sellerRoutes"));
app.use("/api/recruiter", require("./backend/routes/recruiterRoutes"));
app.use("/api/admin", require("./backend/routes/adminRoutes"));

// Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Graceful Shutdown Handling
process.on("SIGINT", async () => {
    console.log("🛑 Shutting down server...");
    await mongoose.connection.close();
    process.exit(0);
});
