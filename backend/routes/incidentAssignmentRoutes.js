const express = require("express");

const {
    assignUserToIncident,
    getIncidentAssignments,
    removeUserFromIncident
} = require("../controllers/incidentAssignmentController");
const requireAssignmentPermission = require("../middleware/assignmentMiddleware");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticateToken,
    requireAssignmentPermission,
    assignUserToIncident
);
router.delete(
    "/:id",
    authenticateToken,
    requireAssignmentPermission,
    removeUserFromIncident
);
router.get("/:incident_id", authenticateToken, getIncidentAssignments);

module.exports = router;