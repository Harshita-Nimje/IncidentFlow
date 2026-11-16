const pool = require("../config/db");
const { createNotification } = require("./notificationController");
const { getIO } = require("../socket");

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

        if (req.user.role !== "platform_admin") {
            const adminCheck = await pool.query(
                `SELECT id
         FROM organization_members
         WHERE organization_id = $1
         AND user_id = $2
         AND role = 'admin'`,
                [organizationId, req.user.id]
            );

            if (adminCheck.rows.length === 0) {
                return res.status(403).json({
                    message: "Only Organization Admins and Platform Admins can create services"
                });
            }
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

        // Notify organization members and platform admins
        const recipients = await pool.query(

            `SELECT user_id
             FROM organization_members
             WHERE organization_id = $1

             UNION

             SELECT id AS user_id
             FROM users
             WHERE role = 'platform_admin'`,
            [organizationId]
        );
        console.log("SERVICE NOTIFICATION RECIPIENTS:", recipients.rows);


        for (const recipient of recipients.rows) {
            console.log("CREATING NOTIFICATION FOR:", recipient.user_id);

            const notification = await createNotification(
                recipient.user_id,
                null,
                "service_created",
                `A new service "${result.rows[0].name}" has been created.`,
                organizationId
            );

            console.log("NOTIFICATION CREATED:", notification);

            getIO().to(`user_${recipient.user_id}`).emit("notification_created", {
                userId: recipient.user_id,
                organizationId,
                notification
            });
        }

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
        const organizationId = req.query.organization_id
            ? Number(req.query.organization_id)
            : null;

        if (
            organizationId !== null &&
            (!Number.isInteger(organizationId) || organizationId <= 0)
        ) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        // Platform Admin can view services across all organizations.
        if (req.user.role === "platform_admin") {
            let result;

            if (organizationId !== null) {
                result = await pool.query(
                    `SELECT id, name, description, organization_id, created_at
                     FROM services
                     WHERE organization_id = $1
                     ORDER BY created_at DESC`,
                    [organizationId]
                );
            } else {
                result = await pool.query(
                    `SELECT id, name, description, organization_id, created_at
                     FROM services
                     ORDER BY created_at DESC`
                );
            }

            return res.json({
                services: result.rows
            });
        }

        // Organization Admins and Members can only view their own organizations.
        if (organizationId !== null) {
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
                `SELECT id, name, description, organization_id, created_at
                 FROM services
                 WHERE organization_id = $1
                 ORDER BY created_at DESC`,
                [organizationId]
            );

            return res.json({
                services: result.rows
            });
        }

        // Return services from all organizations the user belongs to.
        const result = await pool.query(
            `SELECT
                s.id,
                s.name,
                s.description,
                s.organization_id,
                s.created_at
             FROM services s
             INNER JOIN organization_members om
                ON om.organization_id = s.organization_id
             WHERE om.user_id = $1
             ORDER BY s.created_at DESC`,
            [req.user.id]
        );

        res.json({
            services: result.rows
        });

    } catch (error) {
        console.error("Error fetching services:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const organizationId = Number(req.body.organization_id);

        const serviceId = Number(id);

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
            `SELECT id, organization_id
             FROM services
             WHERE id = $1`,
            [serviceId]
        );

        if (serviceCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        if (serviceCheck.rows[0].organization_id !== organizationId) {
            return res.status(403).json({
                message: "Service does not belong to this organization"
            });
        }

        if (req.user.role !== "platform_admin") {
            const adminCheck = await pool.query(
                `SELECT id
         FROM organization_members
         WHERE organization_id = $1
         AND user_id = $2
         AND role = 'admin'`,
                [organizationId, req.user.id]
            );

            if (adminCheck.rows.length === 0) {
                return res.status(403).json({
                    message: "Only Organization Admins and Platform Admins can update services"
                });
            }
        }

        const result = await pool.query(
            `UPDATE services
             SET name = $1,
                 description = $2
             WHERE id = $3
             AND organization_id = $4
             RETURNING id, name, description, organization_id, created_at`,
            [
                name.trim(),
                description?.trim() || null,
                serviceId,
                organizationId
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
            `SELECT id, name, organization_id
             FROM services
             WHERE id = $1`,
            [serviceId]
        );

        if (serviceCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Service not found"
            });
        }

        const organizationId = serviceCheck.rows[0].organization_id;

        if (req.user.role !== "platform_admin") {
            const adminCheck = await pool.query(
                `SELECT id
         FROM organization_members
         WHERE organization_id = $1
         AND user_id = $2
         AND role = 'admin'`,
                [organizationId, req.user.id]
            );

            if (adminCheck.rows.length === 0) {
                return res.status(403).json({
                    message: "Only Organization Admins and Platform Admins can delete services"
                });
            }
        }

        const result = await pool.query(
            `DELETE FROM services
             WHERE id = $1
             AND organization_id = $2
             RETURNING id, name, organization_id`,
            [serviceId, organizationId]
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