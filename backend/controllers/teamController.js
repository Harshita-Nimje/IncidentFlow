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

        res.status(201).json({
            message: "Team created successfully",
            team: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createTeam
};