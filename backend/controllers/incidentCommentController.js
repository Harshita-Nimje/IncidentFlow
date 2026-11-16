// const pool = require("../config/db");
// const { getIO } = require("../socket");
// const { notifyAllExcept } = require("./notificationController");

// const addComment = async (req, res) => {
//     try {
//         const { incident_id, message } = req.body;

//         const incidentId = Number(incident_id);

//         if (!Number.isInteger(incidentId) || incidentId <= 0) {
//             return res.status(400).json({
//                 message: "Invalid incident ID"
//             });
//         }

//         if (!message?.trim()) {
//             return res.status(400).json({
//                 message: "Comment message is required"
//             });
//         }

//         const incidentCheck = await pool.query(
//             `SELECT i.id, i.title
//              FROM incidents i
//              INNER JOIN organization_members om
//                 ON om.organization_id = i.organization_id
//              WHERE i.id = $1
//              AND om.user_id = $2`,
//             [incidentId, req.user.id]
//         );

//         if (incidentCheck.rows.length === 0) {
//             return res.status(404).json({
//                 message: "Incident not found"
//             });
//         }

//         const result = await pool.query(
//             `INSERT INTO incident_comments
//              (incident_id, user_id, message)
//              VALUES ($1, $2, $3)
//              RETURNING *`,
//             [incidentId, req.user.id, message.trim()]
//         );

//         const userResult = await pool.query(
//             `SELECT name
//              FROM users
//              WHERE id = $1`,
//             [req.user.id]
//         );

//         await notifyAllExcept(
//             req.user.id,
//             incidentId,
//             "COMMENT_ADDED",
//             `${userResult.rows[0].name} added a comment to "${incidentCheck.rows[0].title}"`
//         );

//         const io = getIO();

//         io.to(`incident_${incidentId}`).emit("comment_added", {
//             comment: {
//                 ...result.rows[0],
//                 user_name: userResult.rows[0].name
//             },
//             incidentId: incidentId
//         });

//         res.status(201).json({
//             message: "Comment added successfully",
//             comment: result.rows[0]
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };

// const getComments = async (req, res) => {
//     try {
//         const { incident_id } = req.params;
//         const incidentId = Number(incident_id);

//         if (!Number.isInteger(incidentId) || incidentId <= 0) {
//             return res.status(400).json({
//                 message: "Invalid incident ID"
//             });
//         }

//         const incidentCheck = await pool.query(
//             `SELECT i.id
//              FROM incidents i
//              INNER JOIN organization_members om
//                 ON om.organization_id = i.organization_id
//              WHERE i.id = $1
//              AND om.user_id = $2`,
//             [incidentId, req.user.id]
//         );

//         if (incidentCheck.rows.length === 0) {
//             return res.status(404).json({
//                 message: "Incident not found"
//             });
//         }

//         const result = await pool.query(
//             `SELECT
//                 incident_comments.id,
//                 incident_comments.incident_id,
//                 incident_comments.user_id,
//                 users.name AS user_name,
//                 incident_comments.message,
//                 incident_comments.created_at
//              FROM incident_comments
//              JOIN users
//                 ON incident_comments.user_id = users.id
//              WHERE incident_comments.incident_id = $1
//              ORDER BY incident_comments.created_at ASC`,
//             [incidentId]
//         );

//         res.json({
//             incident_id: incidentId,
//             comments: result.rows
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };

// const deleteComment = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const commentId = Number(id);

//         if (!Number.isInteger(commentId) || commentId <= 0) {
//             return res.status(400).json({
//                 message: "Invalid comment ID"
//             });
//         }

//         const result = await pool.query(
//             `SELECT
//                 ic.id,
//                 ic.user_id,
//                 ic.incident_id,
//                 i.organization_id
//              FROM incident_comments ic
//              INNER JOIN incidents i
//                 ON ic.incident_id = i.id
//              INNER JOIN organization_members om
//                 ON om.organization_id = i.organization_id
//              WHERE ic.id = $1
//              AND om.user_id = $2`,
//             [commentId, req.user.id]
//         );

//         if (result.rows.length === 0) {
//             return res.status(404).json({
//                 message: "Comment not found"
//             });
//         }

//         const comment = result.rows[0];

//         const membershipResult = await pool.query(
//             `SELECT role
//              FROM organization_members
//              WHERE organization_id = $1
//              AND user_id = $2`,
//             [comment.organization_id, req.user.id]
//         );

//         const organizationRole = membershipResult.rows[0].role;

//         if (
//             Number(comment.user_id) !== Number(req.user.id) &&
//             organizationRole !== "admin"
//         ) {
//             return res.status(403).json({
//                 message: "You can only delete your own comments"
//             });
//         }

//         await pool.query(
//             `DELETE FROM incident_comments
//              WHERE id = $1
//              AND incident_id = $2`,
//             [commentId, comment.incident_id]
//         );

//         const io = getIO();

//         io.to(`incident_${comment.incident_id}`).emit("comment_deleted", {
//             commentId: commentId,
//             incidentId: comment.incident_id
//         });

//         res.json({
//             message: "Comment deleted successfully"
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };

// module.exports = {
//     addComment,
//     getComments,
//     deleteComment
// };


const pool = require("../config/db");
const { getIO } = require("../socket");
const { notifyAllExcept } = require("./notificationController");


const addComment = async (req, res) => {
    try {
        const { incident_id, message } = req.body;
        const incidentId = Number(incident_id);
        const organizationId = Number(req.body.organization_id);

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

        if (!message?.trim()) {
            return res.status(400).json({
                message: "Comment message is required"
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

        // Platform Admin can comment across organizations.
        // Other users must be members of the organization.
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

        // Insert comment.
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

        await notifyAllExcept(
            req.user.id,
            incidentId,
            "COMMENT_ADDED",
            `${userResult.rows[0].name} added a comment to "${incidentCheck.rows[0].title}"`
        );

        // Emit real-time update to the incident room.
        const io = getIO();

        io.to(`incident_${incidentId}`).emit("comment_added", {
            comment: {
                ...result.rows[0],
                user_name: userResult.rows[0].name
            },
            incidentId
        });

        return res.status(201).json({
            message: "Comment added successfully",
            comment: result.rows[0]
        });

    } catch (error) {
        console.error("Add comment error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const getComments = async (req, res) => {
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

        // Platform Admin can view comments across organizations.
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

        // Fetch comments only for the verified incident.
        const result = await pool.query(
            `SELECT
                ic.id,
                ic.incident_id,
                ic.user_id,
                users.name AS user_name,
                ic.message,
                ic.created_at
             FROM incident_comments ic
             JOIN users
                ON ic.user_id = users.id
             WHERE ic.incident_id = $1
             ORDER BY ic.created_at ASC`,
            [incidentId]
        );

        return res.json({
            incident_id: incidentId,
            comments: result.rows
        });

    } catch (error) {
        console.error("Get comments error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};


const deleteComment = async (req, res) => {
    try {
        const commentId = Number(req.params.id);
        const organizationId = Number(req.query.organization_id);

        if (!Number.isInteger(commentId) || commentId <= 0) {
            return res.status(400).json({
                message: "Invalid comment ID"
            });
        }

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Valid organization ID is required"
            });
        }

        // Verify comment belongs to an incident in the requested organization.
        const result = await pool.query(
            `SELECT
                ic.id,
                ic.user_id,
                ic.incident_id,
                i.organization_id
             FROM incident_comments ic
             INNER JOIN incidents i
                ON ic.incident_id = i.id
             WHERE ic.id = $1
             AND i.organization_id = $2`,
            [commentId, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Comment not found in this organization"
            });
        }

        const comment = result.rows[0];

        // Platform Admin can delete comments across organizations.
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

            // Members can delete their own comments.
            // Organization Admins can delete any comment.
            if (
                Number(comment.user_id) !== Number(req.user.id) &&
                membershipResult.rows[0].role !== "admin"
            ) {
                return res.status(403).json({
                    message: "You can only delete your own comments"
                });
            }
        }

        // Delete only the verified comment.
        const deleteResult = await pool.query(
            `DELETE FROM incident_comments
             WHERE id = $1
             AND incident_id = $2
             RETURNING id`,
            [commentId, comment.incident_id]
        );

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        // Emit real-time update to the incident room.
        const io = getIO();

        io.to(`incident_${comment.incident_id}`).emit("comment_deleted", {
            commentId,
            incidentId: comment.incident_id
        });

        return res.json({
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error("Delete comment error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};



module.exports = {
    addComment,
    getComments,
    deleteComment
};
