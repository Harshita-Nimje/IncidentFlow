const pool = require("../config/db");
const { getIO } = require("../socket");

const notifyAllExcept = async (userId, incidentId, type, message) => {
    const users = await pool.query(
        `SELECT id
         FROM users
         WHERE id != $1`,
        [userId]
    );

    const notifications = [];

    for (const user of users.rows) {
        const notification = await createNotification(
            user.id,
            incidentId,
            type,
            message
        );
        const io = getIO();

        io.emit("notification_created", {
            userId: user.id,
            notification
        });

        notifications.push(notification);
    }

    return notifications;
};
const createNotification = async (userId, incidentId, type, message) => {
    const result = await pool.query(
        `INSERT INTO notifications
         (user_id, incident_id, type, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, incidentId, type, message]
    );

    return result.rows[0];
};

const getNotifications = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM notifications
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json({
            notifications: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.id]
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
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const clearReadNotifications = async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM notifications
             WHERE user_id = $1
             AND is_read = TRUE`,
            [req.user.id]
        );

        res.json({
            message: "Read notifications cleared successfully"
        });

    } catch (error) {
        console.error(error);

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