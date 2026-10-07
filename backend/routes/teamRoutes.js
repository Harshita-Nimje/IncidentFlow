const express = require("express");

const { createTeam } = require("../controllers/teamController");

const authenticateToken = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticateToken,
    requireAdmin,
    createTeam
);

module.exports = router;