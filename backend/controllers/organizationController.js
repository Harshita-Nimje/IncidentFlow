const pool = require("../config/db");

const createOrganization = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Organization name is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO organizations (name)
             VALUES ($1)
             RETURNING id, name, created_at`,
            [name.trim()]
        );

        const organization = result.rows[0];

        await pool.query(
            `INSERT INTO organization_members
             (organization_id, user_id, role)
             VALUES ($1, $2, $3)`,
            [
                organization.id,
                req.user.id,
                "admin"
            ]
        );

        res.status(201).json({
            message: "Organization created successfully",
            organization
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const getOrganizations = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, created_at
             FROM organizations
             ORDER BY created_at ASC`
        );

        res.json({
            organizations: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const organizationId = Number(id);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Organization name is required"
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
            `UPDATE organizations
             SET name = $1
             WHERE id = $2
             RETURNING id, name, created_at`,
            [
                name.trim(),
                organizationId
            ]
        );

        res.json({
            message: "Organization updated successfully",
            organization: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;

        const organizationId = Number(id);

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
            `DELETE FROM organizations
             WHERE id = $1
             RETURNING id, name`,
            [organizationId]
        );

        res.json({
            message: "Organization deleted successfully",
            organization: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createOrganization,
    getOrganizations,
    updateOrganization,
    deleteOrganization
};