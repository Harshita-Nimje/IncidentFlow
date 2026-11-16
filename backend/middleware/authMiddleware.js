
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

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

    try {
        const decoded = jwt.verify(
            parts[1],
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


// Platform-wide authorization
const requirePlatformAdmin = (req, res, next) => {
    if (req.user?.role !== "platform_admin") {
        return res.status(403).json({
            message: "Platform Admin privileges required"
        });
    }

    next();
};


// Organization Admin authorization
const requireOrganizationAdmin = async (req, res, next) => {
    try {
        const organizationId = Number(
            req.params.organizationId ||
            req.params.id ||
            req.body.organization_id ||
            req.query.organization_id
        );

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Valid organization ID required"
            });
        }

        // Platform Admin can manage every organization.
        if (req.user?.role === "platform_admin") {
            req.organizationId = organizationId;
            return next();
        }

        const result = await pool.query(
            `SELECT id
             FROM organization_members
             WHERE organization_id = $1
             AND user_id = $2
             AND role = 'admin'`,
            [organizationId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                message: "Organization Admin privileges required"
            });
        }

        req.organizationId = organizationId;
        next();

    } catch (error) {
        console.error("Organization Admin authorization error:", error);

        return res.status(500).json({
            message: "Server error during authorization"
        });
    }
};


module.exports = {
    authenticateToken,
    requirePlatformAdmin,
    requireOrganizationAdmin
};
