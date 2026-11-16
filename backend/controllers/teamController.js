const pool = require("../config/db");



const createTeam = async (req, res) => {
    try {
        const { name, organization_id } = req.body;

        const organizationId = Number(organization_id);

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Team name is required"
            });
        }

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        // Platform Admin can create teams across organizations.
        // Other users must be Organization Admins.
        if (req.user.role !== "platform_admin") {
            const membershipCheck = await pool.query(
                `SELECT role
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

            if (membershipCheck.rows[0].role !== "admin") {
                return res.status(403).json({
                    message: "Only Organization Admins and Platform Admins can create teams"
                });
            }
        }

        // Verify that the organization exists.
        const organizationCheck = await pool.query(
            `SELECT id
             FROM organizations
             WHERE id = $1`,
            [organizationId]
        );

        if (organizationCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        const result = await pool.query(
            `INSERT INTO teams
             (name, organization_id)
             VALUES ($1, $2)
             RETURNING id, name, organization_id, created_at`,
            [
                name.trim(),
                organizationId
            ]
        );

        return res.status(201).json({
            message: "Team created successfully",
            team: result.rows[0]
        });

    } catch (error) {
        console.error("Create team error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};



module.exports = {
    createTeam
};