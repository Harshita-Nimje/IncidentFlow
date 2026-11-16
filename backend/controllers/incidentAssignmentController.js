const pool = require("../config/db");
const { getIO } = require("../socket");
const { createNotification } = require("./notificationController");


const assignUserToIncident = async (req, res) => {
    try {
        const { incident_id, user_id, role, organization_id } = req.body;

        const incidentId = Number(incident_id);
        const userId = Number(user_id);
        const organizationId = Number(organization_id);

        if (
            !Number.isInteger(incidentId) || incidentId <= 0 ||
            !Number.isInteger(userId) || userId <= 0 ||
            !Number.isInteger(organizationId) || organizationId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid incident ID, user ID, or organization ID"
            });
        }

        // Verify incident belongs to the requested organization.
        const incidentCheck = await pool.query(
            `SELECT id, title
             FROM incidents
             WHERE id = $1
             AND organization_id = $2`,
            [incidentId, organizationId]
        );

        if (incidentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found in this organization"
            });
        }

        // Platform Admin can assign users across organizations.
        // Other users must be Organization Admins.
        if (req.user.role !== "platform_admin") {
            const requesterCheck = await pool.query(
                `SELECT role
                 FROM organization_members
                 WHERE organization_id = $1
                 AND user_id = $2`,
                [organizationId, req.user.id]
            );

            if (requesterCheck.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this organization"
                });
            }

            if (requesterCheck.rows[0].role !== "admin") {
                return res.status(403).json({
                    message: "Only Organization Admins and Platform Admins can assign users"
                });
            }
        }

        // Assigned user must belong to the incident's organization.
        const userCheck = await pool.query(
            `SELECT u.id, u.name
             FROM users u
             JOIN organization_members om ON om.user_id = u.id
             WHERE u.id = $1
             AND om.organization_id = $2`,
            [userId, organizationId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(400).json({
                message: "Assigned user is not a member of this organization"
            });
        }

        const assignmentRole = role
            ? role.trim().toUpperCase()
            : "RESPONDER";

        const allowedRoles = ["LEAD", "OBSERVER", "RESPONDER"];

        if (!allowedRoles.includes(assignmentRole)) {
            return res.status(400).json({
                message: "Invalid assignment role. Use LEAD, OBSERVER, or RESPONDER."
            });
        }

        // Prevent duplicate assignments.
        const existingAssignment = await pool.query(
            `SELECT id
             FROM incident_assignments
             WHERE incident_id = $1
             AND user_id = $2`,
            [incidentId, userId]
        );

        if (existingAssignment.rows.length > 0) {
            return res.status(400).json({
                message: "User is already assigned to this incident"
            });
        }

        const result = await pool.query(
            `INSERT INTO incident_assignments
             (incident_id, user_id, role)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [incidentId, userId, assignmentRole]
        );

        // Add assignment event to incident timeline.
        await pool.query(
            `INSERT INTO incident_timeline
             (incident_id, user_id, event_type, message)
             VALUES ($1, $2, $3, $4)`,
            [
                incidentId,
                req.user.id,
                "USER_ASSIGNED",
                `${userCheck.rows[0].name} was assigned as ${assignmentRole}`
            ]
        );

        const notification = await createNotification(
            userId,
            incidentId,
            "USER_ASSIGNED",
            `You were assigned to "${incidentCheck.rows[0].title}" as ${assignmentRole}`
        );

        const io = getIO();

        io.to(`incident_${incidentId}`).emit("user_assigned", {
            assignment: result.rows[0],
            incidentId,
            userName: userCheck.rows[0].name
        });

        io.to(`user_${userId}`).emit("notification_created", {
            userId,
            organizationId,
            notification
        });

        return res.status(201).json({
            message: "User assigned successfully",
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error("Assign user error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


const getIncidentAssignments = async (req, res) => {
    try {
        const incidentId = Number(req.params.incident_id);
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

        if (req.user.role !== "platform_admin" && organizationId === null) {
            return res.status(400).json({
                message: "Valid organization ID is required"
            });
        }

        // Verify incident belongs to the requested organization.
        let incidentCheck;

        if (organizationId !== null) {
            incidentCheck = await pool.query(
                `SELECT id
         FROM incidents
         WHERE id = $1
         AND organization_id = $2`,
                [incidentId, organizationId]
            );
        } else {
            incidentCheck = await pool.query(
                `SELECT id
         FROM incidents
         WHERE id = $1`,
                [incidentId]
            );
        }

        if (incidentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found in this organization"
            });
        }

        // Platform Admin can view assignments across organizations.
        // Other users must belong to the organization.
        if (req.user.role !== "platform_admin") {
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

        // Return assignments only for users belonging to this organization.
        const result = await pool.query(
            `SELECT
        ia.id,
        ia.incident_id,
        ia.user_id,
        u.name AS user_name,
        u.email,
        ia.role,
        ia.assigned_at
     FROM incident_assignments ia
     JOIN users u ON ia.user_id = u.id
     JOIN incidents i ON i.id = ia.incident_id
     JOIN organization_members om
        ON om.user_id = ia.user_id
        AND om.organization_id = i.organization_id
     WHERE ia.incident_id = $1
     ORDER BY ia.assigned_at DESC`,
            [incidentId]
        );

        return res.json({
            incident_id: incidentId,
            assignments: result.rows
        });

    } catch (error) {
        console.error("Get incident assignments error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const removeUserFromIncident = async (req, res) => {
    try {
        const assignmentId = Number(req.params.id);
        const organizationId = Number(
            req.body?.organization_id || req.query?.organization_id
        );

        if (
            !Number.isInteger(assignmentId) || assignmentId <= 0 ||
            !Number.isInteger(organizationId) || organizationId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid assignment ID or organization ID"
            });
        }

        // Verify assignment belongs to an incident in this organization.
        const assignmentCheck = await pool.query(
            `SELECT
                ia.id,
                ia.incident_id,
                ia.user_id,
                i.title
             FROM incident_assignments ia
             JOIN incidents i ON i.id = ia.incident_id
             WHERE ia.id = $1
             AND i.organization_id = $2`,
            [assignmentId, organizationId]
        );

        if (assignmentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found in this organization"
            });
        }

        const assignment = assignmentCheck.rows[0];

        // Platform Admin can remove assignments across organizations.
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
                    message: "Only Organization Admins and Platform Admins can remove incident assignments"
                });
            }
        }

        // Get assigned user's details.
        const userCheck = await pool.query(
            `SELECT name
             FROM users
             WHERE id = $1`,
            [assignment.user_id]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Assigned user not found"
            });
        }

        // Remove only the verified assignment.
        const result = await pool.query(
            `DELETE FROM incident_assignments
             WHERE id = $1
             AND incident_id = $2
             RETURNING *`,
            [assignmentId, assignment.incident_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        // Add incident timeline event.
        await pool.query(
            `INSERT INTO incident_timeline
             (incident_id, user_id, event_type, message)
             VALUES ($1, $2, $3, $4)`,
            [
                assignment.incident_id,
                req.user.id,
                "USER_UNASSIGNED",
                `${userCheck.rows[0].name} was removed from the incident`
            ]
        );

        // Notify the removed user.
        const notification = await createNotification(
            assignment.user_id,
            assignment.incident_id,
            "USER_UNASSIGNED",
            `You were removed from "${assignment.title}"`
        );

        // Emit real-time events.
        const io = getIO();

        io.to(`incident_${assignment.incident_id}`).emit("user_unassigned", {
            assignmentId,
            incidentId: assignment.incident_id,
            userName: userCheck.rows[0].name
        });

        io.to(`user_${assignment.user_id}`).emit("notification_created", {
            userId: assignment.user_id,
            organizationId,
            notification
        });

        return res.json({
            message: "User unassigned successfully",
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error("Remove assignment error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    assignUserToIncident,
    getIncidentAssignments,
    removeUserFromIncident
};