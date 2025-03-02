const jwt = require("jsonwebtoken");

// Updated to accept allowed roles as a parameter
const authMiddleware = (allowedRoles = []) => {
    return (req, res, next) => {
        console.log("Request Headers:", req.headers);

        const authHeader = req.headers?.authorization;
        if (!authHeader) {
            console.log("No authorization header found");
            return res.status(401).json({ msg: "No token, authorization denied" });
        }

        console.log("Authorization Header:", authHeader);

        const token = authHeader.split(" ")[1]; // Expecting "Bearer <token>"
        if (!token) {
            return res.status(401).json({ msg: "Invalid token format" });
        }

        try {
            // Make sure to use your actual JWT_SECRET from env
            // For now using the hardcoded value from your login route
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");
            console.log("Decoded Token:", decoded);
            req.user = decoded;
            
            // If specific roles are required and the user doesn't have one of them
            if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
                return res.status(403).json({ msg: "Access denied" });
            }
            
            next();
        } catch (err) {
            console.log("JWT Verification Error:", err);
            return res.status(401).json({ msg: "Invalid token" });
        }
    };
};

module.exports = authMiddleware;