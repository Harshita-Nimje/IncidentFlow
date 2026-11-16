const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");

const {
    getIncidentsBySeverity,
    getIncidentStats,
    getIncidentTrends,
    getIncidentsByService,
    getGlobalStats,
    getOrganizationComparison
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

router.get(
    "/global-stats",
    authenticateToken,
    getGlobalStats
);

router.get(
    "/organization-comparison",
    authenticateToken,
    getOrganizationComparison
);

module.exports = router;