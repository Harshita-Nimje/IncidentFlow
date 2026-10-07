const express = require("express");

const authenticateToken = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/adminMiddleware");

const {
    createOrganization,
    getOrganizations,
    updateOrganization,
    deleteOrganization
} = require("../controllers/organizationController");

const router = express.Router();

router.post(
    "/",
    authenticateToken,
    requireAdmin,
    createOrganization
);

router.get(
    "/",
    authenticateToken,
    getOrganizations
);

router.patch(
    "/:id",
    authenticateToken,
    requireAdmin,
    updateOrganization
);

router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    deleteOrganization
);
module.exports = router;