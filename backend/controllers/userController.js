const pool = require("../config/db");

const getUsers = async (req, res) => {
    try {
        const organizationId = Number(req.query.organization_id);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Valid organization ID is required"
            });
        }

        const membershipCheck = await pool.query(
            `SELECT id
             FROM organization_members
             WHERE organization_id = $1
             AND user_id = $2`,
            [organizationId, req.user.id]
        );

        if (membershipCheck.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this organization"
            });
        }

        const result = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                om.role
             FROM organization_members om
             JOIN users u ON u.id = om.user_id
             WHERE om.organization_id = $1
             ORDER BY u.name ASC`,
            [organizationId]
        );

        res.json({
            users: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getUsers
};