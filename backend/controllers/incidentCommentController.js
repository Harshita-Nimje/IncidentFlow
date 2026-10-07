const pool = require("../config/db");
const { getIO } = require("../socket");
const { notifyAllExcept } = require("./notificationController");

const addComment = async (req, res) => {
    try {
        const { incident_id, message } = req.body;

        const incidentId = Number(incident_id);

        if (!Number.isInteger(incidentId) || incidentId <= 0) {
            return res.status(400).json({
                message: "Invalid incident ID"
            });
        }

        if (!message?.trim()) {
            return res.status(400).json({
                message: "Comment message is required"
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
            `INSERT INTO incident_comments
             (incident_id, user_id, message)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [incidentId, req.user.id, message.trim()]
        );

        const userResult = await pool.query(
            `SELECT name
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        const incidentResult = await pool.query(
            `SELECT title
             FROM incidents
             WHERE id = $1`,
            [incidentId]
        );

        await notifyAllExcept(
            req.user.id,
            incidentId,
            "COMMENT_ADDED",
            `${userResult.rows[0].name} added a comment to "${incidentResult.rows[0].title}"`
        );

        const io = getIO();

        // io.emit("comment_added", {
        //     comment: {
        //         ...result.rows[0],
        //         user_name: userResult.rows[0].name
        //     },
        //     incidentId: incidentId
        // });

        io.to(`incident_${incidentId}`).emit("comment_added", {
            comment: {
                ...result.rows[0],
                user_name: userResult.rows[0].name
            },
            incidentId: incidentId
        });

        res.status(201).json({
            message: "Comment added successfully",
            comment: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getComments = async (req, res) => {
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
    incident_comments.id,
    incident_comments.incident_id,
    incident_comments.user_id,
    users.name AS user_name,
    incident_comments.message,
    incident_comments.created_at
FROM incident_comments
JOIN users
    ON incident_comments.user_id = users.id
WHERE incident_comments.incident_id = $1
ORDER BY incident_comments.created_at ASC`,
            [incidentId]
        );

        res.json({
            incident_id: incidentId,
            comments: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const commentId = Number(id);

        if (!Number.isInteger(commentId) || commentId <= 0) {
            return res.status(400).json({
                message: "Invalid comment ID"
            });
        }

        // const result = await pool.query(
        //     `SELECT user_id
        //      FROM incident_comments
        //      WHERE id = $1`,
        //     [commentId]
        // );

        const result = await pool.query(
            `SELECT user_id, incident_id
     FROM incident_comments
     WHERE id = $1`,
            [commentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        const comment = result.rows[0];

        if (
            comment.user_id !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                message: "You can only delete your own comments"
            });
        }

        await pool.query(
            `DELETE FROM incident_comments
             WHERE id = $1`,
            [commentId]
        );

        const io = getIO();

        io.to(`incident_${comment.incident_id}`).emit("comment_deleted", {
            commentId: commentId,
            incidentId: comment.incident_id
        });


        res.json({
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    addComment,
    getComments,
    deleteComment
};