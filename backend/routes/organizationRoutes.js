const express = require("express");

const {
    authenticateToken,
    requirePlatformAdmin,
    requireOrganizationAdmin
} = require("../middleware/authMiddleware");

// const requireAdmin = require("../middleware/adminMiddleware");

const {
    createOrganization,
    getOrganizations,
    getOrganizationById,
    getOrganizationMembers,
    updateOrganization,
    deleteOrganization,
    createJoinRequest,
    getOrganizationJoinRequests,
    reviewOrganizationJoinRequest,
    searchOrganizationsForJoin
} = require("../controllers/organizationController");

const router = express.Router();

// Create organization - Platform Admin only
router.post(
    "/",
    authenticateToken,
    requirePlatformAdmin,
    createOrganization
);

// Get organizations
router.get(
    "/",
    authenticateToken,
    getOrganizations
);
router.get(
    "/search",
    searchOrganizationsForJoin
);

router.get("/:id", authenticateToken, getOrganizationById);
// Get organization members
router.get(
    "/:id/members",
    authenticateToken,
    getOrganizationMembers
);

// Update organization - existing authorization preserved
router.patch(
    "/:id",
    authenticateToken,
    requireOrganizationAdmin,
    updateOrganization
);

// Delete organization - existing authorization preserved
router.delete(
    "/:id",
    authenticateToken,
    requirePlatformAdmin,
    deleteOrganization
);

router.post(
    "/join-requests",
    authenticateToken,
    createJoinRequest
);

router.get(
    "/:id/join-requests",
    authenticateToken,
    getOrganizationJoinRequests
);

router.patch(
    "/:id/join-requests/:requestId",
    authenticateToken,
    reviewOrganizationJoinRequest
);



module.exports = router;