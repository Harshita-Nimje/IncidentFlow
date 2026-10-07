const pool = require("../config/db");

const createService = async (req, res) => {
    try {
        const { name, description, organization_id } = req.body;

        const organizationId = Number(organization_id);

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Service name is required"
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
            `INSERT INTO services
             (name, description, organization_id)
             VALUES ($1, $2, $3)
             RETURNING id, name, description, organization_id, created_at`,
            [
                name.trim(),
                description?.trim() || null,
                organizationId
            ]
        );

        res.status(201).json({
            message: "Service created successfully",
            service: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const getServices = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                name,
                description,
                organization_id,
                created_at
             FROM services
             ORDER BY created_at ASC`
        );

        res.json({
            services: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, organization_id } = req.body;

        const serviceId = Number(id);
        const organizationId = Number(organization_id);

        if (!Number.isInteger(serviceId) || serviceId <= 0) {
            return res.status(400).json({
                message: "Invalid service ID"
            });
        }

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Service name is required"
            });
        }

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        const serviceCheck = await pool.query(
            `SELECT id
             FROM services
             WHERE id = $1`,
            [serviceId]
        );

        if (serviceCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Service not found"
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
            `UPDATE services
             SET name = $1,
                 description = $2,
                 organization_id = $3
             WHERE id = $4
             RETURNING id, name, description, organization_id, created_at`,
            [
                name.trim(),
                description?.trim() || null,
                organizationId,
                serviceId
            ]
        );

        res.json({
            message: "Service updated successfully",
            service: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        const serviceId = Number(id);

        if (!Number.isInteger(serviceId) || serviceId <= 0) {
            return res.status(400).json({
                message: "Invalid service ID"
            });
        }

        const serviceCheck = await pool.query(
            `SELECT id, name
             FROM services
             WHERE id = $1`,
            [serviceId]
        );

        if (serviceCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        const result = await pool.query(
            `DELETE FROM services
             WHERE id = $1
             RETURNING id, name`,
            [serviceId]
        );

        res.json({
            message: "Service deleted successfully",
            service: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createService,
    getServices,
    updateService,
    deleteService
};