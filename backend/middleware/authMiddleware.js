const jwt = require("jsonwebtoken");

const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        const token = req.cookies.jwt; // Extract token from cookies

        if (!token) {
            return res.status(401).redirect('/api/auth/login');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Attach user data to `req`

            // Check if user role is authorized
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ msg: "Access denied" });
            }

            next();
        } catch (error) {
            return res.status(401).redirect('/api/auth/login');
        }
    };
};

module.exports = authMiddleware;
