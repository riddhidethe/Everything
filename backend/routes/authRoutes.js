// // const express = require("express");
// // const bcrypt = require("bcryptjs");
// // const jwt = require("jsonwebtoken");
// // const User = require("../models/User");
// // const Seller = require("../models/Seller");
// // const Recruiter = require("../models/Recruiter");
// // const Admin = require("../models/Admin");
// // const authMiddleware = require("../middleware/authMiddleware");
// // const sendMail = require("../../FUNCTION/mailSetup"); // Equivalent to mailFunc in your first code

// // const router = express.Router();

// // // Add this to your auth routes
// // router.get("/check-auth", authMiddleware(), (req, res) => {
// //     // If the request reaches here, the middleware verified the JWT in cookies
// //     res.status(200).json({ 
// //       isAuthenticated: true,
// //       user: {
// //         id: req.user.id,
// //         role: req.user.role,
// //         profilePic: req.user.profilePic
// //       }
// //     });
// //   });

// // router.post("/protected", authMiddleware, (req, res) => {
// //     res.json({ message: "Access granted", user: req.user });
// // });

// // router.get('/register', (req, res) => {
// //     res.render('Form/applicant_registration', { errorMsg: null });
// // });

// // // 📌 Register a new user
// // router.post("/register", async (req, res) => {
// //     try {
// //         const { name, email, password, confirmPassword, role } = req.body;

// //         // Check if email exists in blocked list (ex_applicants equivalent)
// //         // Implementation depends on your model structure
// //         const isBlocked = await User.findOne({ email, isBlocked: true });
// //         if (isBlocked) {
// //             return res.status(400).json({ msg: "Email is blocked" });
// //         }

// //         // Check if email already exists
// //         const existingUser = await User.findOne({ email }) || 
// //                             await Seller.findOne({ email }) || 
// //                             await Recruiter.findOne({ email }) ||
// //                             await Admin.findOne({ email });
        
// //         if (existingUser) {
// //             return res.status(400).json({ msg: "Email already exists" });
// //         }

// //         // Check if passwords match
// //         if (password !== confirmPassword) {
// //             return res.status(400).json({ msg: "Passwords do not match" });
// //         }

// //         // Hash password
// //         const hashedPassword = await bcrypt.hash(password, 10);

// //         let user;
// //         if (role === "seller") user = new Seller({ name, email, password: hashedPassword });
// //         else if (role === "recruiter") user = new Recruiter({ name, email, password: hashedPassword });
// //         else if (role === "applicant") user = new User({ name, email, password: hashedPassword, isActive: true });
// //         else user = new User({ name, email, password: hashedPassword }); // Default to buyer

// //         await user.save();
        
// //         // If applicant, redirect to complete profile form
// //         if (role === "applicant") {
// //             // Create session or token for form completion
// //             const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", { expiresIn: "1d" });
// //             return res.render('form/complete_form', { msg: "Registration started", token });
// //         }
        
// //         res.render('/VIEWS/applicant/applicant_homepage', { msg: "User registered successfully!" });
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ msg: "Server error" });
// //     }
// // });

// // // route to open the login form
// // router.get('/login', (req, res) => {
// //     res.render('form/login_via_password', { errorMsg: null, display: null });
// // });

// // // 📌 Login
// // router.post("/login", async (req, res) => {
// //     try {
// //         const { email, password } = req.body;
        
// //         let user = await User.findOne({ email }) || 
// //                     await Seller.findOne({ email }) || 
// //                     await Recruiter.findOne({ email });

// //         if (!user) return res.status(400).json({ msg: "Invalid credentials" });

// //         // Check if applicant or buyer is active
// //         if ((user.role === "applicant" || user.role === "buyer") && user.isActive) {
// //             return res.status(403).json({ msg: "Account is inactive" });
// //         }        

// //         const isMatch = await bcrypt.compare(password, user.password);
// //         if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

// //         // Generate JWT token
// //         const token = jwt.sign({ id: user._id.toString(), role: user.role, profilePic: user.profile_pic_code }, "SECRET_KEY", { expiresIn: "7d" });

// //         // Send token and user data in response
// //         res.json({
// //             success: true,
// //             msg: "Logged in successfully",
// //             token,  // Send JWT in response instead of setting it in a cookie
// //             userId: user._id, 
// //             role: user.role,
// //             profilePic: user.profile_pic_code,
// //             redirect: `/homepage?msg=Logged in successfully&role=${user.role}&profilePic=${user.profile_pic_code}`
// //         });

// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ msg: "Server error" });
// //     }
// // });

// // // 📌 Login via OTP
// // router.post("/login-via-otp", async (req, res) => {
// //     try {
// //         const { email } = req.body;
        
// //         let user = await User.findOne({ email }) || 
// //                   await Seller.findOne({ email }) || 
// //                   await Recruiter.findOne({ email }) || 
// //                   await Admin.findOne({ email });

// //         if (!user) return res.status(400).json({ msg: "Email not found" });

// //         // Check if applicant is active
// //         if (user.role === "applicant" && !user.isActive) {
// //             return res.status(403).json({ msg: "Account is inactive" });
// //         }

// //         // Generate and send OTP
// //         const otp = Math.floor(100000 + Math.random() * 900000).toString();
// //         const otpExpiry = new Date();
// //         otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes
        
// //         // Store OTP in user document
// //         user.otp = otp;
// //         user.otpExpiry = otpExpiry;
// //         await user.save();
        
// //         // Send OTP email
// //         await sendMail({
// //             to: email,
// //             subject: "Login OTP",
// //             text: `Your OTP for login is: ${otp}`
// //         });
        
// //         res.json({ msg: "OTP sent successfully", userId: user._id });
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ msg: "Server error" });
// //     }
// // });

// // // 📌 Verify OTP
// // router.post("/verify-otp", async (req, res) => {
// //     try {
// //         const { email, otp } = req.body;
        
// //         let user = await User.findOne({ email }) || 
// //                   await Seller.findOne({ email }) || 
// //                   await Recruiter.findOne({ email }) || 
// //                   await Admin.findOne({ email });

// //         if (!user) return res.status(400).json({ msg: "User not found" });

// //         // Check if OTP matches and is not expired
// //         if (user.otp !== otp) {
// //             return res.status(400).json({ msg: "Invalid OTP" });
// //         }
        
// //         if (user.otpExpiry < new Date()) {
// //             return res.status(400).json({ msg: "OTP expired" });
// //         }

// //         // Clear OTP fields
// //         user.otp = undefined;
// //         user.otpExpiry = undefined;
// //         await user.save();

// //         // Generate token
// //         const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", { expiresIn: "7d" });
// //         res.render('/applicant/applicant_homepage', { msg: "Logged in successfully", role: user.role, token });
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ msg: "Server error" });
// //     }
// // });

// // // 📌 Request Password Reset
// // router.post("/forgot-password", async (req, res) => {
// //     try {
// //         const { email } = req.body;
        
// //         let user = await User.findOne({ email }) || 
// //                   await Seller.findOne({ email }) || 
// //                   await Recruiter.findOne({ email }) || 
// //                   await Admin.findOne({ email });

// //         if (!user) return res.status(400).json({ msg: "Email not found" });

// //         // Generate and send OTP
// //         const otp = Math.floor(100000 + Math.random() * 900000).toString();
// //         const otpExpiry = new Date();
// //         otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes
        
// //         // Store OTP in user document
// //         user.resetOtp = otp;
// //         user.resetOtpExpiry = otpExpiry;
// //         await user.save();
        
// //         // Send OTP email
// //         await sendMail({
// //             to: email,
// //             subject: "Password Reset OTP",
// //             text: `Your OTP for password reset is: ${otp}`
// //         });
        
// //         res.json({ msg: "OTP sent successfully", email });
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ msg: "Server error" });
// //     }
// // });

// // // 📌 Verify Reset OTP
// // router.post("/verify-reset-otp", async (req, res) => {
// //     try {
// //         const { email, otp } = req.body;
        
// //         let user = await User.findOne({ email }) || 
// //                   await Seller.findOne({ email }) || 
// //                   await Recruiter.findOne({ email }) || 
// //                   await Admin.findOne({ email });

// //         if (!user) return res.status(400).json({ msg: "User not found" });

// //         // Check if OTP matches and is not expired
// //         if (user.resetOtp !== otp) {
// //             return res.status(400).json({ msg: "Invalid OTP" });
// //         }
        
// //         if (user.resetOtpExpiry < new Date()) {
// //             return res.status(400).json({ msg: "OTP expired" });
// //         }

// //         // Generate temporary token for password reset
// //         const resetToken = jwt.sign({ id: user._id, email: user.email }, "RESET_SECRET_KEY", { expiresIn: "15m" });
// //         res.json({ msg: "OTP verified", resetToken });
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ msg: "Server error" });
// //     }
// // });

// // // 📌 Reset Password
// // router.post("/reset-password", async (req, res) => {
// //     try {
// //         const { resetToken, password, confirmPassword } = req.body;
        
// //         if (password !== confirmPassword) {
// //             return res.status(400).json({ msg: "Passwords do not match" });
// //         }

// //         // Verify token
// //         const decoded = jwt.verify(resetToken, "RESET_SECRET_KEY");
// //         const email = decoded.email;
        
// //         let user = await User.findOne({ email }) || 
// //                   await Seller.findOne({ email }) || 
// //                   await Recruiter.findOne({ email }) || 
// //                   await Admin.findOne({ email });

// //         if (!user) return res.status(400).json({ msg: "User not found" });

// //         // Hash new password
// //         const hashedPassword = await bcrypt.hash(password, 10);
        
// //         // Update password and clear reset fields
// //         user.password = hashedPassword;
// //         user.resetOtp = undefined;
// //         user.resetOtpExpiry = undefined;
// //         await user.save();
        
// //         res.json({ msg: "Password reset successfully" });
// //     } catch (error) {
// //         console.error(error);
// //         if (error.name === "JsonWebTokenError") {
// //             return res.status(401).json({ msg: "Invalid or expired token" });
// //         }
// //         res.status(500).json({ msg: "Server error" });
// //     }
// // });

// // // 📌 Change Password
// // router.post("/change-password", authMiddleware(["buyer", "applicant", "seller", "recruiter", "admin"]), async (req, res) => {
// //     try {
// //         const { currentPassword, newPassword, confirmPassword } = req.body;
        
// //         if (newPassword !== confirmPassword) {
// //             return res.status(400).json({ msg: "New passwords do not match" });
// //         }

// //         const userId = req.user.id;
// //         const userRole = req.user.role;
        
// //         // Find the user in the appropriate collection based on role
// //         let Model;
// //         if (userRole === "buyer" || "applicant") Model = User;
// //         else if (userRole === "seller") Model = Seller;
// //         else if (userRole === "recruiter") Model = Recruiter;
// //         else if (userRole === "admin") Model = Admin;
        
// //         const user = await Model.findById(userId);
// //         if (!user) return res.status(404).json({ msg: "User not found" });

// //         // Verify current password
// //         const isMatch = await bcrypt.compare(currentPassword, user.password);
// //         if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });

// //         // Hash new password
// //         const hashedPassword = await bcrypt.hash(newPassword, 10);
// //         user.password = hashedPassword;
// //         await user.save();
        
// //         res.json({ msg: "Password changed successfully" });
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ msg: "Server error" });
// //     }
// // });

// // // 📌 Get Profile
// // router.get("/profile", authMiddleware(["buyer", "applicant", "seller", "recruiter", "admin"]), async (req, res) => {
// //     try {
// //         const userId = req.user.id;
// //         const userRole = req.user.role;
        
// //         // Find the user in the appropriate collection based on role
// //         let Model;
// //         if (userRole === "buyer" || "applicant") Model = User;
// //         else if (userRole === "seller") Model = Seller;
// //         else if (userRole === "recruiter") Model = Recruiter;
// //         else if (userRole === "admin") Model = Admin;
        
// //         const user = await Model.findById(userId).select("-password -otp -otpExpiry -resetOtp -resetOtpExpiry");
// //         if (!user) return res.status(404).json({ msg: "User not found" });
        
// //         res.json(user);
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ msg: "Server error" });
// //     }
// // });

// // // 📌 Logout (JWT-based auth doesn't need server-side logout,
// // // but we can add a blacklist for tokens if needed)
// // router.post("/logout", (req, res) => {
// //     res.json({ success: true, msg: "Logged out successfully" });
// // });


// // module.exports = router;



// const express = require("express");
// const bcrypt = require("bcryptjs");
// const session = require("express-session");
// const MongoStore = require("connect-mongo");
// const mongoose = require("mongoose");
// const User = require("../models/User");
// const Seller = require("../models/Seller");
// const Recruiter = require("../models/Recruiter");
// const Admin = require("../models/Admin");
// const sendMail = require("../../FUNCTION/mailSetup");

// const router = express.Router();

// // 📌 SESSION CONFIGURATION
// router.use(
//     session({
//         secret: "your_secret_key",  // Change this to a strong secret
//         resave: false,
//         saveUninitialized: false,
//         store: MongoStore.create({
//             mongoUrl: mongoose.connection._connectionString, // Use your MongoDB connection
//             collectionName: "sessions",
//         }),
//         cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day expiration
//     })
// );

// // 📌 Middleware to Check Session Authentication
// const sessionAuth = (req, res, next) => {
//     if (!req.session.userId) {
//         return res.status(401).json({ msg: "Unauthorized. Please log in." });
//     }
//     next();
// };

// // 📌 Check Authentication
// router.get("/check-auth", (req, res) => {
//     if (!req.session.userId) {
//         return res.json({ isAuthenticated: false });
//     }
//     res.json({
//         isAuthenticated: true,
//         user: {
//             id: req.session.userId,
//             role: req.session.role,
//             profilePic: req.session.profilePic,
//         },
//     });
// });


// // 📌 Register User
// router.post("/register", async (req, res) => {
//     try {
//         const { name, email, password, confirmPassword, role } = req.body;

//         // Check if email exists
//         const existingUser = await User.findOne({ email }) ||
//             await Seller.findOne({ email }) ||
//             await Recruiter.findOne({ email }) ||
//             await Admin.findOne({ email });

//         if (existingUser) {
//             return res.status(400).json({ msg: "Email already exists" });
//         }

//         if (password !== confirmPassword) {
//             return res.status(400).json({ msg: "Passwords do not match" });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         let user;
//         if (role === "seller") user = new Seller({ name, email, password: hashedPassword });
//         else if (role === "recruiter") user = new Recruiter({ name, email, password: hashedPassword });
//         else user = new User({ name, email, password: hashedPassword });

//         await user.save();
//         res.json({ msg: "User registered successfully!" });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ msg: "Server error" });
//     }
// });

// // 📌 Login User (Stores session)
// router.post("/login", async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         let user = await User.findOne({ email }) ||
//             await Seller.findOne({ email }) ||
//             await Recruiter.findOne({ email }) ||
//             await Admin.findOne({ email });

//         if (!user) {
//             return res.status(400).json({ msg: "Invalid credentials" });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ msg: "Invalid credentials" });
//         }

//         // Store user details in session
//         req.session.userId = user._id;
//         req.session.role = user.role;
//         req.session.profilePic = user.profilePic;

//         res.redirect(`/applicant/applicant_homepage?userId=${user._id}`);

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ msg: "Server error" });
//     }
// });

// // 📌 Protected Route Example
// router.post("/protected", sessionAuth, (req, res) => {
//     res.json({ message: "Access granted", userId: req.session.userId });
// });

// // 📌 Logout (Destroys session)
// router.post("/logout", (req, res) => {
//     req.session.destroy((err) => {
//         if (err) {
//             return res.status(500).json({ msg: "Logout failed" });
//         }
//         res.json({ msg: "Logged out successfully" });
//     });
// });

// module.exports = router;


const express = require("express");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const mongoose = require("mongoose");
const MongoDBStore = require("connect-mongo");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Recruiter = require("../models/Recruiter");
const Admin = require("../models/Admin");
const sendMail = require("../../FUNCTION/mailSetup");
const authMiddleware = require("../middleware/authMiddleware")

const router = express.Router();

// const store = new MongoDBStore({
//     uri: "mongodb://localhost:27017/yourDB",
//     collection: "sessions"
// });
// // Session setup
// router.use(session({
//     secret: "your_secret_key",
//     resave: false,
//     saveUninitialized: false,
//     store: store,  // Persistent session storage
//     cookie: { secure: false }  // Set to true if using HTTPS
// }));

// Middleware to check session authentication
// const authMiddleware = (req, res, next) => {
//     if (req.session.user) {
//         return next();
//     } else {
//         return res.status(401).json({ msg: "Unauthorized" });
//     }
// };

// Check authentication
router.get("/check-auth", authMiddleware, (req, res) => {
    if (req.user) {
        return res.json({
            isAuthenticated: true,
            user: {
                id: req.user._id,
                profilePic: req.user.profilePic || null
            }
        });
    } else {
        return res.json({ isAuthenticated: false });
    }
});

router.get('/register', (req, res) => {
    res.render('form/applicant_registration', { errorMsg: null });
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password, confirmPassword, role } = req.body;
        
        if (password !== confirmPassword) {
            return res.status(400).json({ msg: "Passwords do not match" });
        }
        
        const existingUser = await User.findOne({ email }) || 
                              await Seller.findOne({ email }) || 
                              await Recruiter.findOne({ email }) ||
                              await Admin.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ msg: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let user;
        
        if (role === "seller") user = new Seller({ name, email, password: hashedPassword, role, isActive: true });
        else if (role === "recruiter") user = new Recruiter({ name, email, password: hashedPassword, role, isActive: true });
        else user = new User({ name, email, password: hashedPassword, role, isActive: true });

        await user.save();

        // ✅ Store user in session
        req.session.user = user;

        // Redirect based on role
        if (role === "applicant") {
            return res.render('form/complete_form', { msg: "Registration started" });
        }
        
        res.redirect('/api/auth/login'); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// route to open the login form
router.get('/login', (req, res) => {
    res.render('form/login_via_password', { errorMsg: null, display: null });
});

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log("Session Data:", req.session);        
        
        let user = await User.findOne({ email }) || 
                    await Seller.findOne({ email }) || 
                    await Recruiter.findOne({ email });

        if (!user) return res.status(400).json({ msg: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        req.session.user = {
            _id: user._id,
            role: user.role,
            profilePic: user.profilePic || "user.png"
        };

        // Save session explicitly before redirecting
        req.session.save((err) => {
            if (err) {
                console.error("Session Save Error:", err);
                return res.status(500).json({ msg: "Session error" });
            }
        
            console.log("Session After Login:", req.session); // Check if session is updated
            res.setHeader('Content-Type', 'application/json');
            res.json({ 
                success: true, 
                userId: user._id, 
                redirectUrl: getRedirectUrl(user.role, user._id),
                profilePic: user.profilePic
            });
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// Function to get redirect URL based on role
function getRedirectUrl(role, userId) {
    console.log("Redirect Role:", role);
    if (role === "seller") return `/seller/dashboard?userId=${userId}`;
    else if (role === "recruiter") return `/recruiter/dashboard?userId=${userId}`;
    else if (role === "buyer" || role === "applicant") return `/applicant/applicant_homepage?userId=${userId}`;
    else return "/form/login_via_password";
}

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ msg: "Error logging out" });
        }
        res.redirect("/homepage");
    });
});

module.exports = router;
