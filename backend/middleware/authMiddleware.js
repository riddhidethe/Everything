const User = require("../models/User"); // Import your User model

const authMiddleware = async (req, res, next) => {
    try {
        // Get userId from query params or headers
        const userId = req.query.userId || req.headers["user-id"];

        if (!userId) {
            return res.status(401).json({ msg: "Access denied. No user ID provided." });
        }

        // Find user in database
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: "User not found." });
        }

        // Check if the account is blocked
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                blocked: true,
                msg: "Your account has been blocked by the admin."
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(500).json({ msg: "Internal Server Error." });
    }
};

module.exports = authMiddleware;
