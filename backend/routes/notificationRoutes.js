const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
    getNotifications,
    markNotificationAsRead,
    clearReadNotifications
} = require("../controllers/notificationController");

router.get("/", authenticateToken, getNotifications);
router.patch("/:id/read", authenticateToken, markNotificationAsRead);
router.delete("/clear-read", authenticateToken, clearReadNotifications);

module.exports = router;