
const pool = require("../config/db");

const requireAssignmentPermission = async (req, res, next) => {
    try {
        const organizationId = Number(
            req.body?.organization_id || req.query?.organization_id
        );

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Valid organization ID is required"
            });
        }

        // Platform Admin can manage assignments across organizations.
        if (req.user.role === "platform_admin") {
            req.organizationId = organizationId;
            return next();
        }

        // Other users must be Organization Admins.
        const result = await pool.query(
            `SELECT role
             FROM organization_members
             WHERE organization_id = $1
             AND user_id = $2`,
            [organizationId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this organization"
            });
        }

        if (result.rows[0].role !== "admin") {
            return res.status(403).json({
                message: "Only Organization Admins and Platform Admins can manage incident assignments"
            });
        }

        req.organizationId = organizationId;
        return next();

    } catch (error) {
        console.error("Assignment permission error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = requireAssignmentPermission;
