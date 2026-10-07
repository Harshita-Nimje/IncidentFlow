const pool = require("../config/db");
const { getIO } = require("../socket");
const { io } = require("../server");
const { notifyAllExcept } = require("./notificationController");

// const getIncidents = async (req, res) => {
//     try {
//         const result = await pool.query(
//             `SELECT *
//              FROM incidents
//              ORDER BY created_at DESC`
//         );

//         res.json({
//             incidents: result.rows
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };

const getIncidents = async (req, res) => {
    try {
        const page = Math.max(
            parseInt(req.query.page) || 1,
            1
        );

        const limit = Math.min(
            Math.max(
                parseInt(req.query.limit) || 20,
                1
            ),
            100
        );

        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT *
             FROM incidents
             ORDER BY created_at DESC
             LIMIT $1
             OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM incidents`
        );

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
        const { id } = req.params;
        const { status } = req.body;
        if (req.user.role !== "admin" && req.user.role !== "lead") {
            return res.status(403).json({
                message: "Only admins and leads can update incident status"
            });
        }
        const currentIncident = await pool.query(
            `SELECT status FROM incidents WHERE id = $1`,
            [id]
        );
        if (currentIncident.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }
        const oldStatus = currentIncident.rows[0].status;

        const allowedStatuses = [
            "INVESTIGATING",
            "IDENTIFIED",
            "MITIGATING",
            "MONITORING",
            "RESOLVED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status."
            });
        }

        const result = await pool.query(
            `UPDATE incidents
             SET status = $1,
                 resolved_at = CASE
                    WHEN $1::VARCHAR = 'RESOLVED' THEN CURRENT_TIMESTAMP
                     ELSE resolved_at
                 END
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }
        await pool.query(
            `INSERT INTO incident_timeline
     (incident_id, user_id, event_type, message)
     VALUES ($1, $2, $3, $4)`,
            [
                id,
                req.user.id,
                "STATUS_CHANGED",
                `Status changed from ${oldStatus} to ${status}`
            ]
        );

        const notificationInfo = await pool.query(
            `SELECT
        incidents.title AS incident_title,
        users.name AS user_name
     FROM incidents
     JOIN users ON users.id = $2
     WHERE incidents.id = $1`,
            [id, req.user.id]
        );
        await notifyAllExcept(
            req.user.id,
            id,
            "STATUS_CHANGED",
            `${notificationInfo.rows[0].user_name} changed "${notificationInfo.rows[0].incident_title}" from ${oldStatus} to ${status}`
        );

        const io = getIO();

        // io.emit("incident_status_updated", {
        //     incident: result.rows[0],
        //     incidentId: id,
        //     oldStatus,
        //     newStatus: status
        // });

        io.to(`incident_${id}`).emit("incident_status_updated", {
            incident: result.rows[0],
            incidentId: id,
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
        const { id } = req.params;
        const incidentId = Number(id);

        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({
                message: "Invalid incident ID"
            });
        }

        const result = await pool.query(
            `SELECT
        incidents.*,
        users.name AS creator_name,
        users.email AS creator_email
     FROM incidents
     JOIN users ON incidents.created_by = users.id
     WHERE incidents.id = $1`,
            [incidentId]
        );

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
        const { id } = req.params;
        const incidentId = Number(id);

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
                incident_timeline.*,
                users.name AS user_name,
                users.email AS user_email
             FROM incident_timeline
             LEFT JOIN users ON incident_timeline.user_id = users.id
             WHERE incident_timeline.incident_id = $1
             ORDER BY incident_timeline.created_at ASC`,
            [incidentId]
        );

        res.json({
            incident_id: incidentId,
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
        const { id } = req.params;

        const incidentId = Number(id);

        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({
                message: "Invalid incident ID"
            });
        }

        const result = await pool.query(
            `DELETE FROM incidents
             WHERE id = $1
             RETURNING *`,
            [incidentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Incident not found"
            });
        }

        res.json({
            message: "Incident deleted successfully",
            incident: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
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