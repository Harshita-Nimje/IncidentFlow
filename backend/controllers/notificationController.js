const pool = require("../config/db");
const { getIO } = require("../socket");

const notifyAllExcept = async (userId, incidentId, type, message) => {
    const users = await pool.query(
        `SELECT om.user_id, i.organization_id
 FROM organization_members om
 INNER JOIN incidents i
    ON i.organization_id = om.organization_id
 WHERE i.id = $1
 AND om.user_id != $2`,
        [incidentId, userId]
    );

    const notifications = [];

    for (const user of users.rows) {
        const notification = await createNotification(
            user.user_id,
            incidentId,
            type,
            message,
            user.organization_id
        );

        const io = getIO();

        io.to(`user_${user.user_id}`).emit("notification_created", {
            userId: user.user_id,
            organizationId: user.organization_id,
            notification
        });

        notifications.push(notification);
    }

    return notifications;
};
const createNotification = async (
    userId,
    incidentId,
    type,
    message,
    organizationId
) => {
    const result = await pool.query(
        `INSERT INTO notifications
         (user_id, incident_id, type, message, organization_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, incidentId, type, message, organizationId]
    );

    return result.rows[0];
};

const getNotifications = async (req, res) => {
    try {
        const organizationId = req.query.organization_id
            ? Number(req.query.organization_id)
            : null;

        if (
            organizationId !== null &&
            (!Number.isInteger(organizationId) || organizationId <= 0)
        ) {
            return res.status(400).json({
                message: "Invalid organization_id"
            });
        }

        if (organizationId === null && req.user.role !== "platform_admin") {
            return res.status(400).json({
                message: "Valid organization_id is required"
            });
        }

        let result;

        if (req.user.role === "platform_admin") {
            result = await pool.query(
                `SELECT *
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
                [req.user.id]
            );
        } else {
            const membership = await pool.query(
                `SELECT id
         FROM organization_members
         WHERE organization_id = $1
         AND user_id = $2`,
                [organizationId, req.user.id]
            );

            if (membership.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this organization"
                });
            }

            result = await pool.query(
                `SELECT *
         FROM notifications
         WHERE user_id = $1
         AND organization_id = $2
         ORDER BY created_at DESC`,
                [req.user.id, organizationId]
            );
        }

        res.json({
            notifications: result.rows
        });
        console.log("NOTIFICATION DEBUG:", {
            userId: req.user.id,
            role: req.user.role,
            count: result.rows.length,
            latestNotifications: result.rows.slice(0, 5)
        });

    } catch (error) {
        console.error("Get notifications error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const organizationId = req.query.organization_id
            ? Number(req.query.organization_id)
            : null;

        if (
            organizationId !== null &&
            (!Number.isInteger(organizationId) || organizationId <= 0)
        ) {
            return res.status(400).json({
                message: "Invalid organization_id"
            });
        }

        if (req.user.role === "platform_admin") {
            const result = await pool.query(
                `UPDATE notifications
                 SET is_read = TRUE
                 WHERE id = $1
                 AND user_id = $2
                 AND organization_id IS NOT DISTINCT FROM $3
                 RETURNING *`,
                [id, req.user.id, organizationId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Notification not found"
                });
            }

            return res.json({
                message: "Notification marked as read",
                notification: result.rows[0]
            });
        }

        if (organizationId === null) {
            return res.status(400).json({
                message: "Valid organization_id is required"
            });
        }

        const result = await pool.query(
            `UPDATE notifications n
             SET is_read = TRUE
             FROM organization_members om
             WHERE n.id = $1
             AND n.user_id = $2
             AND n.organization_id = $3
             AND om.organization_id = $3
             AND om.user_id = $2
             RETURNING n.*`,
            [id, req.user.id, organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        res.json({
            message: "Notification marked as read",
            notification: result.rows[0]
        });

    } catch (error) {
        console.error("Mark notification as read error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const clearReadNotifications = async (req, res) => {
    try {
        const organizationId = req.query.organization_id
            ? Number(req.query.organization_id)
            : null;

        if (
            organizationId !== null &&
            (!Number.isInteger(organizationId) || organizationId <= 0)
        ) {
            return res.status(400).json({
                message: "Invalid organization_id"
            });
        }

        if (req.user.role === "platform_admin") {
            if (organizationId === null) {
                await pool.query(
                    `DELETE FROM notifications
                     WHERE user_id = $1
                     AND organization_id IS NULL
                     AND is_read = TRUE`,
                    [req.user.id]
                );
            } else {
                await pool.query(
                    `DELETE FROM notifications
                     WHERE user_id = $1
                     AND is_read = TRUE
                     AND (
                        organization_id = $2
                        OR organization_id IS NULL
                     )`,
                    [req.user.id, organizationId]
                );
            }
        } else {
            if (organizationId === null) {
                return res.status(400).json({
                    message: "Valid organization_id is required"
                });
            }

            const membership = await pool.query(
                `SELECT id
                 FROM organization_members
                 WHERE organization_id = $1
                 AND user_id = $2`,
                [organizationId, req.user.id]
            );

            if (membership.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this organization"
                });
            }

            await pool.query(
                `DELETE FROM notifications
                 WHERE user_id = $1
                 AND organization_id = $2
                 AND is_read = TRUE`,
                [req.user.id, organizationId]
            );
        }

        res.json({
            message: "Read notifications cleared successfully"
        });

    } catch (error) {
        console.error("Clear read notifications error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getNotifications,
    createNotification,
    notifyAllExcept,
    markNotificationAsRead,
    clearReadNotifications
};