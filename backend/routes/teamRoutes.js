const express = require("express");

const { createTeam } = require("../controllers/teamController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticateToken,
    createTeam
);

module.exports = router;