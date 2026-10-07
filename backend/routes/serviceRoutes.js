const express = require("express");

const {
    createService,
    getServices,
    updateService,
    deleteService
} = require("../controllers/serviceController");

const authenticateToken = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/", authenticateToken, requireAdmin, createService);

router.get("/", authenticateToken, getServices);

router.patch(
    "/:id",
    authenticateToken,
    requireAdmin,
    updateService
);

router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    deleteService
);

module.exports = router;