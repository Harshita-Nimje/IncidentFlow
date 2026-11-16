const pool = require("../config/db");
const { getIO } = require("../socket");
// const { io } = require("../server");
const {
    notifyAllExcept,
    createNotification
} = require("./notificationController");

const getIncidents = async (req, res) => {
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

        // Organization users must specify an organization they belong to.
        if (req.user.role !== "platform_admin") {
            if (organizationId === null) {
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
        }

        const page = Math.max(
            parseInt(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(parseInt(req.query.limit) || 20, 1),
            100
        );

        const offset = (page - 1) * limit;

        let result;
        let countResult;

        if (organizationId !== null) {
            result = await pool.query(
                `SELECT *
                 FROM incidents
                 WHERE organization_id = $1
                 ORDER BY created_at DESC
                 LIMIT $2
                 OFFSET $3`,
                [organizationId, limit, offset]
            );

            countResult = await pool.query(
                `SELECT COUNT(*)
                 FROM incidents
                 WHERE organization_id = $1`,
                [organizationId]
            );

        } else {
            // Platform Admin can view incidents across all organizations.
            result = await pool.query(
                `SELECT *
                 FROM incidents
                 ORDER BY created_at DESC
                 LIMIT $1
                 OFFSET $2`,
                [limit, offset]
            );

            countResult = await pool.query(
                `SELECT COUNT(*)
                 FROM incidents`
            );
        }

        const total = Number(countResult.rows[0].count);

        res.json({
            incidents: result.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const createIncident = async (req, res) => {
    try {
        const {
            title,
            description,
            severity,
            environment,
            organization_id,
            service_id
        } = req.body;

        const allowedSeverities = ["SEV-1", "SEV-2", "SEV-3", "SEV-4"];

        if (
            !title?.trim() ||
            !description?.trim() ||
            !severity ||
            !environment?.trim() ||
            !organization_id ||
            !service_id
        ) {
            return res.status(400).json({
                message: "All incident fields are required"
            });
        }

        if (!allowedSeverities.includes(severity)) {
            return res.status(400).json({
                message: "Invalid severity. Use SEV-1, SEV-2, SEV-3, or SEV-4."
            });
        }

        // Organization users must belong to the selected organization.
        if (req.user.role !== "platform_admin") {
            const membershipCheck = await pool.query(
                `SELECT id
         FROM organization_members
         WHERE organization_id = $1
         AND user_id = $2`,
                [organization_id, req.user.id]
            );

            if (membershipCheck.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this organization"
                });
            }
        }

        // Check whether the selected service belongs to the organization
        const serviceCheck = await pool.query(
            `SELECT id
             FROM services
             WHERE id = $1
             AND organization_id = $2`,
            [service_id, organization_id]
        );

        if (serviceCheck.rows.length === 0) {
            return res.status(400).json({
                message: "Selected service does not belong to the selected organization"
            });
        }

        // Create the incident
        const result = await pool.query(
            `INSERT INTO incidents
            (title, description, severity, environment, organization_id, service_id, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                title,
                description,
                severity,
                environment,
                organization_id,
                service_id,
                req.user.id
            ]
        );

        const userResult = await pool.query(
            `SELECT name FROM users WHERE id = $1`,
            [req.user.id]
        );

        await notifyAllExcept(
            req.user.id,
            result.rows[0].id,
            "INCIDENT_CREATED",
            `${userResult.rows[0].name} created a new ${severity} incident: ${title}`
        );

        // Emit the newly created incident to all organization members
        const io = getIO();

        const membersResult = await pool.query(
            `SELECT user_id
     FROM organization_members
     WHERE organization_id = $1`,
            [organization_id]
        );

        membersResult.rows.forEach((member) => {
            io.to(`user_${member.user_id}`).emit("incident_created", {
                incident: result.rows[0],
                incidentId: result.rows[0].id,
                organizationId: Number(organization_id)
            });
        });

        res.status(201).json({
            message: "Incident created successfully",
            incident: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const updateIncidentStatus = async (req, res) => {
    try {
        const incidentId = Number(req.params.id);
        const { status } = req.body;
        const organizationId = Number(req.body.organization_id);

        const allowedStatuses = [
            "INVESTIGATING",
            "IDENTIFIED",
            "MITIGATING",
            "MONITORING",
            "RESOLVED"
        ];

        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({
                message: "Invalid incident ID"
            });
        }

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Valid organization ID is required"
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status."
            });
        }

        // Verify incident belongs to the requested organization.
        const currentIncident = await pool.query(
            `SELECT id, status, organization_id
             FROM incidents
             WHERE id = $1
             AND organization_id = $2`,
            [incidentId, organizationId]
        );

        if (currentIncident.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found in this organization"
            });
        }

        const incident = currentIncident.rows[0];
        const oldStatus = incident.status;

        // Platform Admin can update incidents across organizations.
        if (req.user.role !== "platform_admin") {
            const membershipResult = await pool.query(
                `SELECT role
                 FROM organization_members
                 WHERE organization_id = $1
                 AND user_id = $2`,
                [organizationId, req.user.id]
            );

            if (membershipResult.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this organization"
                });
            }

            if (membershipResult.rows[0].role !== "admin") {
                return res.status(403).json({
                    message: "Only Organization Admins and Platform Admins can update incident status"
                });
            }
        }

        // Update status within the verified organization.
        const result = await pool.query(
            `UPDATE incidents
             SET status = $1,
                 resolved_at = CASE
                    WHEN $1::VARCHAR = 'RESOLVED'
                    THEN CURRENT_TIMESTAMP
                    ELSE resolved_at
                 END
             WHERE id = $2
             AND organization_id = $3
             RETURNING *`,
            [status, incidentId, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found in this organization"
            });
        }

        // Add status change to timeline.
        await pool.query(
            `INSERT INTO incident_timeline
             (incident_id, user_id, event_type, message)
             VALUES ($1, $2, $3, $4)`,
            [
                incidentId,
                req.user.id,
                "STATUS_CHANGED",
                `Status changed from ${oldStatus} to ${status}`
            ]
        );

        // Get notification information within the organization.
        const notificationInfo = await pool.query(
            `SELECT
                i.title AS incident_title,
                u.name AS user_name
             FROM incidents i
             JOIN users u ON u.id = $2
             WHERE i.id = $1
             AND i.organization_id = $3`,
            [incidentId, req.user.id, organizationId]
        );

        if (notificationInfo.rows.length > 0) {
            await notifyAllExcept(
                req.user.id,
                incidentId,
                "STATUS_CHANGED",
                `${notificationInfo.rows[0].user_name} changed "${notificationInfo.rows[0].incident_title}" from ${oldStatus} to ${status}`
            );
        }

        // Emit real-time update to the incident room.
        const io = getIO();

        io.to(`incident_${incidentId}`).emit("incident_status_updated", {
            incident: result.rows[0],
            incidentId,
            oldStatus,
            newStatus: status
        });

        res.json({
            message: "Incident status updated successfully",
            incident: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getIncidentById = async (req, res) => {
    try {
        const incidentId = Number(req.params.id);
        const organizationId = req.query.organization_id
            ? Number(req.query.organization_id)
            : null;

        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({
                message: "Invalid incident ID"
            });
        }

        if (
            organizationId !== null &&
            (!Number.isInteger(organizationId) || organizationId <= 0)
        ) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        let result;

        if (req.user.role === "platform_admin") {
            if (organizationId !== null) {
                result = await pool.query(
                    `SELECT
                        i.*,
                        u.name AS creator_name,
                        u.email AS creator_email
                     FROM incidents i
                     JOIN users u ON i.created_by = u.id
                     WHERE i.id = $1
                     AND i.organization_id = $2`,
                    [incidentId, organizationId]
                );
            } else {
                result = await pool.query(
                    `SELECT
                        i.*,
                        u.name AS creator_name,
                        u.email AS creator_email
                     FROM incidents i
                     JOIN users u ON i.created_by = u.id
                     WHERE i.id = $1`,
                    [incidentId]
                );
            }

        } else {
            if (organizationId === null) {
                return res.status(400).json({
                    message: "Valid organization ID is required"
                });
            }

            result = await pool.query(
                `SELECT
                    i.*,
                    u.name AS creator_name,
                    u.email AS creator_email
                 FROM incidents i
                 JOIN users u ON i.created_by = u.id
                 INNER JOIN organization_members om
                    ON om.organization_id = i.organization_id
                 WHERE i.id = $1
                 AND i.organization_id = $2
                 AND om.user_id = $3`,
                [incidentId, organizationId, req.user.id]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        res.json({
            incident: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getIncidentTimeline = async (req, res) => {
    try {
        const incidentId = Number(req.params.id);
        const organizationId = req.query.organization_id
            ? Number(req.query.organization_id)
            : null;

        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({
                message: "Invalid incident ID"
            });
        }

        if (
            organizationId !== null &&
            (!Number.isInteger(organizationId) || organizationId <= 0)
        ) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        let result;

        if (req.user.role === "platform_admin") {
            if (organizationId !== null) {
                result = await pool.query(
                    `SELECT it.*
                     FROM incident_timeline it
                     INNER JOIN incidents i ON i.id = it.incident_id
                     WHERE it.incident_id = $1
                     AND i.organization_id = $2
                     ORDER BY it.created_at ASC`,
                    [incidentId, organizationId]
                );
            } else {
                result = await pool.query(
                    `SELECT it.*
                     FROM incident_timeline it
                     INNER JOIN incidents i ON i.id = it.incident_id
                     WHERE it.incident_id = $1
                     ORDER BY it.created_at ASC`,
                    [incidentId]
                );
            }

        } else {
            if (organizationId === null) {
                return res.status(400).json({
                    message: "Valid organization ID is required"
                });
            }

            result = await pool.query(
                `SELECT it.*
                 FROM incident_timeline it
                 INNER JOIN incidents i ON i.id = it.incident_id
                 INNER JOIN organization_members om
                    ON om.organization_id = i.organization_id
                 WHERE it.incident_id = $1
                 AND i.organization_id = $2
                 AND om.user_id = $3
                 ORDER BY it.created_at ASC`,
                [incidentId, organizationId, req.user.id]
            );
        }

        if (result.rows.length === 0) {
            const incidentCheck = await pool.query(
                `SELECT id, organization_id
         FROM incidents
         WHERE id = $1
         ${organizationId !== null ? "AND organization_id = $2" : ""}`,
                organizationId !== null
                    ? [incidentId, organizationId]
                    : [incidentId]
            );

            if (incidentCheck.rows.length === 0) {
                return res.status(404).json({
                    message: "Incident not found"
                });
            }

            if (req.user.role !== "platform_admin") {
                const membershipCheck = await pool.query(
                    `SELECT id
             FROM organization_members
             WHERE organization_id = $1
             AND user_id = $2`,
                    [incidentCheck.rows[0].organization_id, req.user.id]
                );

                if (membershipCheck.rows.length === 0) {
                    return res.status(403).json({
                        message: "You are not authorized to view this incident"
                    });
                }
            }
        }

        res.json({
            timeline: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const deleteIncident = async (req, res) => {
    try {
        const incidentId = Number(req.params.id);
        const organizationId = req.query.organization_id
            ? Number(req.query.organization_id)
            : null;

        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({
                message: "Invalid incident ID"
            });
        }

        if (
            organizationId !== null &&
            (!Number.isInteger(organizationId) || organizationId <= 0)
        ) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        if (
            organizationId === null &&
            req.user.role !== "platform_admin"
        ) {
            return res.status(400).json({
                message: "Valid organization ID is required"
            });
        }

        // 1. Verify incident exists in the requested organization.
        let incidentResult;

        if (organizationId !== null) {
            incidentResult = await pool.query(
                `SELECT id, organization_id, title
                 FROM incidents
                 WHERE id = $1
                 AND organization_id = $2`,
                [incidentId, organizationId]
            );
        } else {
            incidentResult = await pool.query(
                `SELECT id, organization_id, title
                 FROM incidents
                 WHERE id = $1`,
                [incidentId]
            );
        }

        if (incidentResult.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        const incident = incidentResult.rows[0];
        const activeOrganizationId = incident.organization_id;

        // 2. Platform Admin bypasses organization membership checks.
        if (req.user.role !== "platform_admin") {
            const membershipResult = await pool.query(
                `SELECT role
                 FROM organization_members
                 WHERE organization_id = $1
                 AND user_id = $2`,
                [activeOrganizationId, req.user.id]
            );

            const requesterRole =
                membershipResult.rows[0]?.role?.toLowerCase();

            if (requesterRole !== "admin") {
                return res.status(403).json({
                    message: "Only Organization Admins and Platform Admins can delete incidents"
                });
            }
        }

        // 3. Fetch organization members before deletion.
        const membersResult = await pool.query(
            `SELECT user_id
             FROM organization_members
             WHERE organization_id = $1
             AND user_id != $2`,
            [activeOrganizationId, req.user.id]
        );

        // 4. Delete the incident.
        const result = await pool.query(
            `DELETE FROM incidents
             WHERE id = $1
             AND organization_id = $2
             RETURNING *`,
            [incidentId, activeOrganizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        // 5. Send real-time deletion events.
        const io = getIO();

        const allOrganizationMembers = [
            req.user.id,
            ...membersResult.rows.map((member) => member.user_id)
        ];

        allOrganizationMembers.forEach((userId) => {
            io.to(`user_${userId}`).emit("incident_deleted", {
                incidentId,
                organizationId: activeOrganizationId
            });
        });

        // Notify other organization members.
        const notificationResults = await Promise.allSettled(
            membersResult.rows.map(async (member) => {
                const notification = await createNotification(
                    member.user_id,
                    null,
                    "INCIDENT_DELETED",
                    `Incident "${incident.title}" was deleted from your organization`,
                    activeOrganizationId
                );

                io.to(`user_${member.user_id}`).emit(
                    "notification_created",
                    {
                        userId: member.user_id,
                        organizationId: activeOrganizationId,
                        incidentId,
                        notification
                    }
                );

                return notification;
            })
        );

        const failedNotifications = notificationResults.filter(
            (item) => item.status === "rejected"
        );

        if (failedNotifications.length > 0) {
            console.error(
                "Some incident deletion notifications failed:",
                failedNotifications
            );
        }

        const notificationsCreated =
            notificationResults.length - failedNotifications.length;

        // 6. Return success response.
        return res.json({
            message: "Incident deleted successfully",
            incident: result.rows[0],
            notifications_created: notificationsCreated
        });

    } catch (error) {
        console.error("Delete incident error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};
module.exports = {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncidentStatus,
    getIncidentTimeline,
    deleteIncident
};