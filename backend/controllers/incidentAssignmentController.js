const pool = require("../config/db");
const { getIO } = require("../socket");
const { createNotification } = require("./notificationController");

const assignUserToIncident = async (req, res) => {
    try {
        const { incident_id, user_id, role } = req.body;

        const incidentId = Number(incident_id);
        const userId = Number(user_id);

        if (
            !Number.isInteger(incidentId) ||
            incidentId <= 0 ||
            !Number.isInteger(userId) ||
            userId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid incident ID or user ID"
            });
        }

        const assignmentRole = role
            ? role.trim().toUpperCase()
            : "RESPONDER";

        const allowedRoles = [
            "LEAD",
            "OBSERVER",
            "RESPONDER"
        ];

        if (!allowedRoles.includes(assignmentRole)) {
            return res.status(400).json({
                message: "Invalid assignment role. Use LEAD, OBSERVER, or RESPONDER."
            });
        }

        const userCheck = await pool.query(
            `SELECT id, name
             FROM users
             WHERE id = $1`,
            [userId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const incidentCheck = await pool.query(
            `SELECT id,  title
             FROM incidents
             WHERE id = $1`,
            [incidentId]
        );

        if (incidentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

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
            [
                incidentId,
                userId,
                assignmentRole
            ]
        );

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

        // io.emit("user_assigned", {
        //     assignment: result.rows[0],
        //     incidentId: incidentId,
        //     userName: userCheck.rows[0].name
        // });

        io.to(`incident_${incidentId}`).emit("user_assigned", {
            assignment: result.rows[0],
            incidentId: incidentId,
            userName: userCheck.rows[0].name
        });

        io.emit("notification_created", {
            userId: userId,
            notification
        });

        res.status(201).json({
            message: "User assigned successfully",
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getIncidentAssignments = async (req, res) => {
    try {
        const { incident_id } = req.params;

        const incidentId = Number(incident_id);

        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({
                message: "Invalid incident ID"
            });
        }

        const incidentCheck = await pool.query(
            `SELECT id
             FROM incidents
             WHERE id = $1`,
            [incidentId]
        );

        if (incidentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

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
             WHERE ia.incident_id = $1
             ORDER BY ia.assigned_at DESC`,
            [incidentId]
        );

        res.json({
            incident_id: incidentId,
            assignments: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const removeUserFromIncident = async (req, res) => {
    try {
        const { id } = req.params;

        const assignmentId = Number(id);

        if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
            return res.status(400).json({
                message: "Invalid assignment ID"
            });
        }

        const assignmentCheck = await pool.query(
            `SELECT id, incident_id, user_id
             FROM incident_assignments
             WHERE id = $1`,
            [assignmentId]
        );

        if (assignmentCheck.rows.length === 0) {
            return res.status(404).json({
                message: "Assignment not found"
            });
        }

        const assignment = assignmentCheck.rows[0];
        const incidentCheck = await pool.query(
            `SELECT title
     FROM incidents
     WHERE id = $1`,
            [assignment.incident_id]
        );
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

        const result = await pool.query(
            `DELETE FROM incident_assignments
             WHERE id = $1
             RETURNING *`,
            [assignmentId]
        );

        const notification = await createNotification(
            assignment.user_id,
            assignment.incident_id,
            "USER_UNASSIGNED",
            `You were removed from "${incidentCheck.rows[0].title}"`
        );
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

        const io = getIO();

        // io.emit("user_unassigned", {
        //     assignmentId: assignmentId,
        //     incidentId: assignment.incident_id,
        //     userName: userCheck.rows[0].name
        // });

        io.to(`incident_${assignment.incident_id}`).emit("user_unassigned", {
            assignmentId: assignmentId,
            incidentId: assignment.incident_id,
            userName: userCheck.rows[0].name
        });

        io.emit("notification_created", {
            userId: assignment.user_id,
            notification
        });


        res.json({
            message: "User unassigned successfully",
            assignment: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    assignUserToIncident,
    getIncidentAssignments,
    removeUserFromIncident
};