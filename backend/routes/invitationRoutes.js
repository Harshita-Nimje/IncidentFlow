const express = require("express");
const {
    authenticateToken,
    requireOrganizationAdmin
} = require("../middleware/authMiddleware");
const {
    createInvitation,
    acceptInvitation,
    getOrganizationInvitations,
    revokeInvitation,
    createJoinToken,
    getOrganizationJoinTokens,
    validateJoinToken
} = require("../controllers/invitationController");

const router = express.Router();

router.post(
    "/",
    authenticateToken,
    requireOrganizationAdmin,
    createInvitation
);
router.post("/accept", authenticateToken, acceptInvitation);

router.get(
    "/organization/:organizationId",
    authenticateToken,
    getOrganizationInvitations
);

// Create organization join token
router.post(
    "/join-token/:organizationId",
    authenticateToken,
    requireOrganizationAdmin,
    createJoinToken
);

// Get organization join tokens
router.get(
    "/join-tokens/:organizationId",
    authenticateToken,
    requireOrganizationAdmin,
    getOrganizationJoinTokens
);

router.patch(
    "/:invitationId/revoke",
    authenticateToken,
    revokeInvitation
);

// Validate organization join token
router.post(
    "/validate-join-token",
    authenticateToken,
    validateJoinToken
);
module.exports = router;