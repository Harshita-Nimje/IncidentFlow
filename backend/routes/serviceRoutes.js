const express = require("express");

const {
    createService,
    getServices,
    updateService,
    deleteService
} = require("../controllers/serviceController");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticateToken, createService);

router.get("/", authenticateToken, getServices);

router.patch("/:id", authenticateToken, updateService);

router.delete("/:id", authenticateToken, deleteService);

module.exports = router;