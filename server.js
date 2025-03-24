// // Load environment variables
// require("dotenv").config();

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const path = require('path');
// const bodyParser = require('body-parser');
// const ejs = require('ejs');
// const cookieParser = require("cookie-parser");
// const authMiddleware = require('./backend/middleware/authMiddleware');
// const Notification = require("./backend/models/Notification");

// const app = express();

// // ✅ Apply Essential Middlewares BEFORE Routes
// app.use(cors({
//     origin: ["http://localhost:5000"], // ✅ Ensure your frontend uses this
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//     credentials: true,
//     allowedHeaders: ["Authorization", "Content-Type"], // ✅ Allow Authorization Header
// }));

// app.use(express.json()); // ✅ Ensure JSON bodies are parsed
// app.use(express.urlencoded({ extended: true })); // ✅ Parse URL-encoded bodies
// app.use(bodyParser.json()); // ✅ Ensure request bodies are parsed properly
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser()); // ✅ Enable cookie handling

// // ✅ Ensure Static Files & View Engine Setup
// app.use('/function', express.static(path.join(__dirname, 'FUNCTION')));
// app.use('/public', express.static(path.join(__dirname, 'PUBLIC')));
// app.set('views', path.join(__dirname, 'VIEWS'));
// app.set('view engine', 'ejs');

// // ✅ Database Connection
// const connectDB = async () => {
//     try {
//         await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });
//         console.log("✅ MongoDB Connected");
//     } catch (err) {
//         console.error("❌ MongoDB Connection Error:", err);
//         process.exit(1);
//     }
// };
// connectDB();

// // ✅ Load Routes AFTER Middleware
// app.use("/api/auth", require("./backend/routes/authRoutes"));
// app.use("/api/buyer", require("./backend/routes/buyerRoutes"));
// app.use("/api/seller", require("./backend/routes/sellerRoutes"));
// app.use("/api/recruiter", require("./backend/routes/recruiterRoutes"));
// app.use("/api/admin", require("./backend/routes/adminRoutes"));
// app.use("/api/profile", require("./backend/routes/profileRoutes"));

// // ✅ Serve Home Page
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'VIEWS', 'applicant', 'openningPage.html'));
// });

// // ✅ Protected Homepage Route
// app.get('/homepage', async (req, res) => {
//     try {
//         const Job = mongoose.model('Job'); // Ensure Job model is defined
//         const User = mongoose.model('User');
//         const Notification = mongoose.model('Notification');

//         let profilePic = null;
//         let notiResult = [];

//         // ✅ Fetch Jobs Data (Always)
//         const popularJobs = await Job.find()
//             .sort({ 'applications.length': -1 })
//             .limit(6);

//         if (req.user) {
//             // ✅ Fetch Profile Picture (If Logged In)
//             const userProfile = await User.findById(req.user.id).select('profilePic');
//             if (userProfile) profilePic = userProfile.profilePic;

//             // ✅ Fetch Notifications (If Logged In)
//             notiResult = await Notification.find({ userId: req.user.id });
//         }

//         // ✅ Render Page with Data
//         res.render('applicant/applicant_homepage', { 
//             r2: popularJobs, 
//             isLogged: !!req.user, 
//             profilePic: profilePic,
//             notiResult: notiResult,
//             toastNotification: req.query.notification || null
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server error');
//     }
// });


// // ✅ Server Listener
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// // ✅ Handle Graceful Shutdown
// process.on("SIGINT", async () => {
//     console.log("🛑 Shutting down server...");
//     await mongoose.connection.close();
//     process.exit(0);
// });


// Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const cookieParser = require("cookie-parser");
const authMiddleware = require('./backend/middleware/authMiddleware');

// Import Models
const Job = require("./backend/models/Job");
const User = require("./backend/models/User");
const Notification = require("./backend/models/Notification");

const app = express();

// ✅ Apply Essential Middlewares BEFORE Routes
app.use(cors({
    origin: ["http://localhost:5000"], // ✅ Change based on your frontend URL
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"], 
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

// ✅ Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ MongoDB Connected");
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
app.get('/homepage', authMiddleware, async (req, res) => {
    try {
        let profilePic = null;
        let notiResult = [];

        // ✅ Fetch Jobs Data (Always)
        const popularJobs = await Job.find()
            .sort({ 'applications.length': -1 })
            .limit(6);

        if (req.user) {
            // ✅ Fetch Profile Picture (If Logged In)
            const userProfile = await User.findById(req.user.id).select('profilePic');
            if (userProfile) profilePic = userProfile.profilePic;

            // ✅ Fetch Notifications (If Logged In)
            notiResult = await Notification.find({ userId: req.user.id });
        }

        // ✅ Render Page with Data
        res.render('applicant/applicant_homepage', { 
            r2: popularJobs, 
            isLogged: !!req.user, 
            profilePic: profilePic,
            notiResult: notiResult,
            toastNotification: req.query.notification || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// ✅ Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Handle Graceful Shutdown
process.on("SIGINT", async () => {
    console.log("🛑 Shutting down server...");
    await mongoose.connection.close();
    process.exit(0);
});

