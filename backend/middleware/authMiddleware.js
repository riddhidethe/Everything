const User = require("../models/User");
const Seller = require("../models/Seller");
const Recruiter = require("../models/Recruiter");

const authMiddleware = (roles = []) => async (req, res, next) => {
    try {
        console.log("Session Data:", req.session); // Debugging
        console.log("User Data:", req.session.user); // Debugging

        // Allow public access to opening pages
        if (req.path === "/" || req.path === "/homepage") {
            req.user = null;
            return next();
        }

        // Ensure session and user exist
        if (!req.session || !req.session.user) {
            return res.status(401).json({ msg: "Access denied. No user session found." });
        }

        const userId = req.session.user._id; // Use "id" instead of "userId"

        if (!userId) {
            return res.status(400).json({ msg: "User ID is missing from session." });
        }
        
        // Validate userId format
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ msg: "Invalid user ID format." });
        }

        const user = await User.findById(userId) || await Seller.findById(userId) || await Recruiter.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: "User not found." });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                blocked: true,
                msg: "Your account has been blocked by the admin."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ msg: "Internal Server Error." });
    }
};

module.exports = authMiddleware;


// const User = require("../models/User");

// const authMiddleware = (roles = []) => async (req, res, next) => {
//     try {
//         console.log("Session Data:", req.session); // Debugging
//         console.log("User Data:", req.session.user); // Debugging

//         // Allow public access to opening pages
//         if (req.path === "/" || req.path === "/homepage") {
//             req.user = null;
//             return next();
//         }

//         // ✅ Redirect to login page if no session or user
//         if (!req.session || !req.session.user) {
//             console.log("No session found. Redirecting to login...");
//             return res.redirect("/api/auth/login"); // Change to your actual login page route
//         }

//         const userId = req.session.user.id; // Use "id" instead of "userId"

//         if (!userId) {
//             return res.redirect("/api/auth/login");
//         }
        
//         // Validate userId format
//         if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
//             return res.redirect("/api/auth/login");
//         }

//         const user = await User.findById(userId);

//         if (!user) {
//             return res.redirect("/api/auth/login");
//         }

//         if (user.isBlocked) {
//             return res.status(403).json({
//                 success: false,
//                 blocked: true,
//                 msg: "Your account has been blocked by the admin."
//             });
//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         console.error("Authentication error:", error);
//         return res.status(500).json({ msg: "Internal Server Error." });
//     }
// };

// module.exports = authMiddleware;
