const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
    getIncidentsBySeverity,
    getIncidentStats,
    getIncidentTrends,
    getIncidentsByService
} = require("../controllers/analyticsController");

router.get(
    "/incidents-by-severity",
    authenticateToken,
    getIncidentsBySeverity
);

router.get(
    "/stats",
    authenticateToken,
    getIncidentStats
);

router.get(
    "/incident-trends",
    authenticateToken,
    getIncidentTrends
);

router.get(
    "/incidents-by-service",
    authenticateToken,
    getIncidentsByService
);

module.exports = router;