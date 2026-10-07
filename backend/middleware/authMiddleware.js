const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    const parts = authHeader.split(" ");

    if (
        parts.length !== 2 ||
        parts[0].toLowerCase() !== "bearer" ||
        !parts[1]
    ) {
        return res.status(401).json({
            message: "Invalid authorization header"
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");

        return res.status(500).json({
            message: "Server configuration error"
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authenticateToken;