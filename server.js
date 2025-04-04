// Load environment variables
require("dotenv").config();
// require("dotenv").config({ path: "./config.env" });
// console.log("Mongo URI:", process.env.MONGO_URI);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const authMiddleware = require('./backend/middleware/authMiddleware');
const session = require("express-session");

// Import Models
const Job = require("./backend/models/Job");
const User = require("./backend/models/User");
const Notification = require("./backend/models/Notification");

const app = express();

// ✅ Apply Essential Middlewares BEFORE Routes
// const allowedOrigins = [*];
// app.use(cors({
//     origin: (origin, callback) => {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error("Not allowed by CORS"));
//         }
//     },
//     credentials: true
// }));

app.use(cors({
    origin: ["*"], // ✅ Change to your frontend URL
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: ["Content-Type"], 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Static Files & View Engine Setup
app.use('/function', express.static(path.join(__dirname, 'FUNCTION')));
app.use('/public', express.static(path.join(__dirname, 'PUBLIC')));
app.set('views', path.join(__dirname, 'VIEWS'));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SESSION_SECRET || "default-secret",
    resave: false,
    saveUninitialized: false,  // ✅ Fix: Prevents empty sessions
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        maxAge: 24 * 60 * 60 * 1000 // 1 Day
    }
}));

// ✅ Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000 // ⏳ Increased timeout for slow network
        });
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
};

connectDB();

// ✅ Load Routes AFTER Middleware
app.use("/api/auth", require("./backend/routes/authRoutes"));
app.use("/api/buyer", require("./backend/routes/buyerRoutes"));
app.use("/api/seller", require("./backend/routes/sellerRoutes"));
app.use("/api/recruiter", require("./backend/routes/recruiterRoutes"));
app.use("/api/admin", require("./backend/routes/adminRoutes"));
app.use("/api/profile", require("./backend/routes/profileRoutes"));

// ✅ Serve Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'VIEWS', 'applicant', 'openningPage.html'));
});

// ✅ Protected Homepage Route (Requires Authentication)
app.get('/homepage', async (req, res) => {
    try {
        let profilePic = null; 
        let notiResult = [];
        let r2 = []; 

        // ✅ Fetch Popular Jobs Data
        const popularJobs = await Job.find().sort({ 'applications.length': -1 }).limit(6);
        r2 = popularJobs || []; // ✅ Prevent undefined error

        if (req.user) {
            const userProfile = await User.findById(req.user._id).select('profilePic');
            profilePic = userProfile?.profilePic || null; // ✅ Assign value if exists
            notiResult = await Notification.find({ userId: req.user._id });
        }

        // ✅ Render Homepage
        res.render('applicant/applicant_homepage', { 
            r2, 
            isLogged: !!req.user, 
            profilePic,
            notiResult,
            toastNotification: req.query.notification || null
        });

    } catch (err) {
        console.error("Homepage Route Error:", err);
        res.status(500).send('Server error');
    }
});

// ✅ Server Listener
const PORT = 5000;

// if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
// }

// ✅ Handle Graceful Shutdown
process.on("SIGINT", async () => {
    console.log("🛑 Shutting down server...");
    await mongoose.connection.close();
    process.exit(0);
});

module.exports = app; // ✅ Export the app