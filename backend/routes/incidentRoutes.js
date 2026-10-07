const express = require("express");

const {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncidentStatus,
    getIncidentTimeline,
    deleteIncident
} = require("../controllers/incidentController");

const authenticateToken = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", authenticateToken, getIncidents);
router.get("/:id", authenticateToken, getIncidentById);
router.post("/", authenticateToken, createIncident);
router.patch("/:id/status", authenticateToken, updateIncidentStatus);
router.delete("/:id", authenticateToken, requireAdmin, deleteIncident);
router.get("/:id/timeline", authenticateToken, getIncidentTimeline);

module.exports = router;