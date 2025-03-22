require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require('path');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const ejs = require('ejs'); // Make sure to install this

const app = express();

// CORS configuration
const corsOptions = {
    origin: ["http://localhost:3000"], 
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Setup static files - following the pattern from your reference code
app.use('/function', express.static(path.join(__dirname, 'FUNCTION')));
app.use('/public', express.static(path.join(__dirname, 'PUBLIC')));

// Setup viewing engine - make sure you have EJS installed
app.set('views', path.join(__dirname, 'VIEWS'));
app.set('view engine', 'ejs');

// JWT Token middleware to check authentication
const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1] || req.query.token;
    
    if (!token) {
        req.isAuthenticated = false;
        return next();
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret', (err, user) => {
        if (err) {
            req.isAuthenticated = false;
            return next();
        }
        req.user = user;
        req.isAuthenticated = true;
        next();
    });
};

// Apply authentication middleware to all routes
app.use(authenticateToken);

// Database Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true
            // Removed deprecated useUnifiedTopology option
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
app.use("/api/profile", require("./backend/routes/profileRoutes"));

// Serve opening page on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'VIEWS', 'applicant', 'openningPage.html'));
});

// Homepage route with data fetching - modified to match your template
app.get('/homepage', async (req, res) => {
    try {
        // Using Mongoose to fetch popular jobs
        const Job = mongoose.model('Job'); // Assuming you have a Job model
        
        // Get the user's profile pic if authenticated
        let profilePic = null;
        if (req.isAuthenticated) {
            const User = mongoose.model('User');
            const userProfile = await User.findById(req.user.id).select('profilePic');
            if (userProfile) {
                profilePic = userProfile.profilePic;
            }
        }
        
        // Get notifications if authenticated
        let notiResult = [];
        if (req.isAuthenticated) {
            const Notification = mongoose.model('Notification');
            notiResult = await Notification.find({ userId: req.user.id });
        }
        
        // Get popular jobs
        const popularJobs = await Job.find()
            .sort({'applications.length': -1})
            .limit(6);
        
        res.render('applicant/applicant_homepage', { 
            r2: popularJobs, 
            isLogged: req.isAuthenticated, 
            profilePic: profilePic,
            notiResult: notiResult,
            toastNotification: req.query.notification || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Graceful Shutdown Handling
process.on("SIGINT", async () => {
    console.log("🛑 Shutting down server...");
    await mongoose.connection.close();
    process.exit(0);
});