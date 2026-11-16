const pool = require("../config/db");
const crypto = require("crypto");
const { createNotification } = require("./authController");
const { getIO } = require("../socket");


const createInvitation = async (req, res) => {

    const client = await pool.connect();

    try {
        const { organization_id, email, role } = req.body;

        const organizationId = Number(organization_id);
        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedRole = role?.trim().toLowerCase();

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        if (
            !normalizedEmail ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            return res.status(400).json({
                message: "A valid email address is required"
            });
        }

        if (normalizedRole !== "member") {
            return res.status(400).json({
                message: "Invitations can only assign the Member role"
            });
        }

        if (!process.env.FRONTEND_URL) {
            return res.status(500).json({
                message: "Frontend URL is not configured"
            });
        }

        await client.query("BEGIN");

        // Verify that the organization exists.
        const organizationCheck = await client.query(
            `SELECT id
             FROM organizations
             WHERE id = $1`,
            [organizationId]
        );

        if (organizationCheck.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Organization not found"
            });
        }

        // Platform Admin can invite members across organizations.
        // Other users must be Organization Admins.
        if (req.user.role !== "platform_admin") {
            const adminCheck = await client.query(
                `SELECT id
                 FROM organization_members
                 WHERE organization_id = $1
                 AND user_id = $2
                 AND role = 'admin'`,
                [organizationId, req.user.id]
            );

            if (adminCheck.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(403).json({
                    message: "Only Organization Admins and Platform Admins can invite members"
                });
            }
        }

        // Check whether the invited email already belongs to this organization.
        const existingMember = await client.query(
            `SELECT om.id
             FROM organization_members om
             JOIN users u ON u.id = om.user_id
             WHERE om.organization_id = $1
             AND LOWER(u.email) = $2`,
            [organizationId, normalizedEmail]
        );

        if (existingMember.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "This user is already a member of the organization"
            });
        }

        // Check for an existing pending invitation.
        const existingInvitation = await client.query(
            `SELECT id, expires_at
             FROM organization_invitations
             WHERE organization_id = $1
             AND LOWER(email) = $2
             AND status = 'pending'`,
            [organizationId, normalizedEmail]
        );

        if (existingInvitation.rows.length > 0) {
            const invitation = existingInvitation.rows[0];

            if (new Date(invitation.expires_at) > new Date()) {
                await client.query("ROLLBACK");

                return res.status(409).json({
                    message: "A pending invitation already exists for this email"
                });
            }

            await client.query(
                `UPDATE organization_invitations
                 SET status = 'expired'
                 WHERE id = $1`,
                [invitation.id]
            );
        }

        // Generate a secure token and store only its hash.
        const rawToken = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        const result = await client.query(
            `INSERT INTO organization_invitations
                (organization_id, email, role, token_hash, invited_by, expires_at)
             VALUES
                ($1, $2, $3, $4, $5, NOW() + INTERVAL '48 hours')
             RETURNING id, email, role, status, expires_at`,
            [
                organizationId,
                normalizedEmail,
                normalizedRole,
                tokenHash,
                req.user.id
            ]
        );

        await client.query("COMMIT");

        const invitationLink =
            `${process.env.FRONTEND_URL}/invite/${rawToken}`;

        return res.status(201).json({
            message: "Invitation created successfully",
            invitation: result.rows[0],
            invitationLink
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Create invitation error:", error);

        return res.status(500).json({
            message: "Server error while creating invitation"
        });

    } finally {
        client.release();
    }
};


const acceptInvitation = async (req, res) => {
    const client = await pool.connect();

    try {
        const { token } = req.body;

        if (!token || typeof token !== "string") {
            return res.status(400).json({
                message: "Invitation token is required"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        await client.query("BEGIN");

        // Get the logged-in user's current email from the database
        const userResult = await client.query(
            `SELECT id, email
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = userResult.rows[0];

        // Lock the invitation to prevent simultaneous acceptance
        const invitationResult = await client.query(
            `SELECT *
             FROM organization_invitations
             WHERE token_hash = $1
             FOR UPDATE`,
            [tokenHash]
        );

        if (invitationResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                message: "Invalid invitation token"
            });
        }

        const invitation = invitationResult.rows[0];

        if (invitation.status !== "pending") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "This invitation is no longer available"
            });
        }

        if (
            invitation.invitation_type === "join_token" &&
            invitation.max_uses !== null &&
            invitation.used_count >= invitation.max_uses
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "This join token has reached its usage limit"
            });
        }
        // {
        //     await client.query(
        //         `UPDATE organization_invitations
        //  SET status = 'accepted'
        //  WHERE id = $1`,
        //         [invitation.id]
        //     );

        //     await client.query("COMMIT");

        //     return res.status(400).json({
        //         message: "This join token has reached its usage limit"
        //     });
        // }

        if (new Date(invitation.expires_at) <= new Date()) {
            await client.query(
                `UPDATE organization_invitations
         SET status = 'expired'
         WHERE id = $1`,
                [invitation.id]
            );

            await client.query("COMMIT");

            return res.status(400).json({
                message: "This invitation has expired"
            });
        }

        if (
            invitation.invitation_type !== "join_token" &&
            user.email.toLowerCase() !== invitation.email.toLowerCase()
        ) {
            await client.query("ROLLBACK");
            return res.status(403).json({
                message: "This invitation was sent to a different email address"
            });
        }

        if (invitation.role !== "member") {
            await client.query("ROLLBACK");
            return res.status(400).json({
                message: "Invalid invitation role"
            });
        }

        // Add the user to the organization
        const membershipResult = await client.query(
            `INSERT INTO organization_members
        (organization_id, user_id, role)
     VALUES ($1, $2, 'member')
     ON CONFLICT (organization_id, user_id) DO NOTHING
     RETURNING id`,
            [invitation.organization_id, user.id]
        );

        if (membershipResult.rowCount === 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                message: "You are already a member of this organization"
            });
        }

        // Handle reusable organization join tokens
        if (invitation.invitation_type === "join_token") {
            await client.query(
                `UPDATE organization_invitations
         SET used_count = used_count + 1,
             status = CASE
                 WHEN max_uses IS NOT NULL
                      AND used_count + 1 >= max_uses
                 THEN 'accepted'
                 ELSE 'pending'
             END
         WHERE id = $1`,
                [invitation.id]
            );
        } else {
            // Handle normal email invitations
            await client.query(
                `UPDATE organization_invitations
         SET status = 'accepted',
             accepted_by = $1,
             accepted_at = NOW()
         WHERE id = $2`,
                [user.id, invitation.id]
            );
        }

        // await client.query("COMMIT");
        let notificationsResult = { rows: [] };

        if (invitation.invitation_type === "join_token") {
            notificationsResult = await client.query(
                `INSERT INTO notifications
        (user_id, organization_id, type, message)
     SELECT DISTINCT
        u.id,
        $1,
        'member_joined',
        $2 || ' joined ' || o.name || ' using an invitation token.'
     FROM users u
     CROSS JOIN organizations o
     WHERE o.id = $1
       AND (
           u.role = 'platform_admin'
           OR EXISTS (
               SELECT 1
               FROM organization_members om
               WHERE om.user_id = u.id
                 AND om.organization_id = $1
                 AND om.role = 'admin'
           )
       )
     RETURNING id, user_id, organization_id, type, message, is_read, created_at`,
                [
                    invitation.organization_id,
                    user.email
                ]
            );
        }

        await client.query("COMMIT");

        for (const notification of notificationsResult.rows) {
            getIO().to(`user_${notification.user_id}`).emit(
                "notification_created",
                {
                    userId: notification.user_id,
                    organizationId: invitation.organization_id,
                    notification
                }
            );
        }

        return res.status(200).json({
            message: "Invitation accepted successfully",
            organization_id: invitation.organization_id,
            role: "member"
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Accept invitation error:", error);

        return res.status(500).json({
            message: "Server error while accepting invitation"
        });

    } finally {
        client.release();
    }
};

const getOrganizationInvitations = async (req, res) => {
    try {
        const organizationId = Number(req.params.organizationId);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        // Platform Admin can view invitations across organizations.
        if (req.user.role !== "platform_admin") {
            const adminCheck = await pool.query(
                `SELECT id
                 FROM organization_members
                 WHERE organization_id = $1
                   AND user_id = $2
                   AND role = 'admin'`,
                [organizationId, req.user.id]
            );

            if (adminCheck.rows.length === 0) {
                return res.status(403).json({
                    message: "Organization Admin privileges required"
                });
            }
        }

        await pool.query(
            `UPDATE organization_invitations
     SET status = 'expired'
     WHERE organization_id = $1
       AND status = 'pending'
       AND expires_at <= NOW()`,
            [organizationId]
        );

        const result = await pool.query(
            `SELECT
                oi.id,
                oi.organization_id,
                oi.email,
                oi.role,
                oi.status,
                oi.invited_by,
                inviter.name AS invited_by_name,
                oi.accepted_by,
                accepted_user.name AS accepted_by_name,
                oi.expires_at,
                oi.accepted_at,
                oi.created_at
             FROM organization_invitations oi
             LEFT JOIN users inviter
                ON inviter.id = oi.invited_by
             LEFT JOIN users accepted_user
                ON accepted_user.id = oi.accepted_by
             WHERE oi.organization_id = $1
             ORDER BY oi.created_at DESC`,
            [organizationId]
        );

        return res.status(200).json({
            invitations: result.rows
        });

    } catch (error) {
        console.error("Get organization invitations error:", error);

        return res.status(500).json({
            message: "Server error while fetching invitations"
        });
    }
};

const revokeInvitation = async (req, res) => {
    const client = await pool.connect();

    try {
        const invitationId = Number(req.params.invitationId);

        if (!Number.isInteger(invitationId) || invitationId <= 0) {
            return res.status(400).json({
                message: "Invalid invitation ID"
            });
        }

        await client.query("BEGIN");

        const invitationResult = await client.query(
            `SELECT id, organization_id, status, expires_at
             FROM organization_invitations
             WHERE id = $1
             FOR UPDATE`,
            [invitationId]
        );

        if (invitationResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Invitation not found"
            });
        }

        const invitation = invitationResult.rows[0];

        // Only Platform Admins or the organization's Admin can revoke.
        if (req.user.role !== "platform_admin") {
            const adminCheck = await client.query(
                `SELECT id
                 FROM organization_members
                 WHERE organization_id = $1
                   AND user_id = $2
                   AND role = 'admin'`,
                [invitation.organization_id, req.user.id]
            );

            if (adminCheck.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(403).json({
                    message: "Organization Admin privileges required"
                });
            }
        }

        if (invitation.status !== "pending") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Only pending invitations can be revoked"
            });
        }

        if (new Date(invitation.expires_at) <= new Date()) {
            await client.query(
                `UPDATE organization_invitations
                 SET status = 'expired'
                 WHERE id = $1`,
                [invitationId]
            );

            await client.query("COMMIT");

            return res.status(400).json({
                message: "This invitation has expired"
            });
        }

        await client.query(
            `UPDATE organization_invitations
             SET status = 'revoked'
             WHERE id = $1`,
            [invitationId]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Invitation revoked successfully"
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Revoke invitation error:", error);

        return res.status(500).json({
            message: "Server error while revoking invitation"
        });

    } finally {
        client.release();
    }
};

const createJoinToken = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const { expires_in_hours, max_uses } = req.body;

        const expiryHours = Number(expires_in_hours || 48);
        const maxUses = max_uses === null || max_uses === undefined || max_uses === ""
            ? null
            : Number(max_uses);

        if (!Number.isInteger(expiryHours) || expiryHours <= 0) {
            return res.status(400).json({
                message: "Expiry must be a positive number of hours"
            });
        }

        if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
            return res.status(400).json({
                message: "Maximum uses must be a positive number"
            });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        const result = await pool.query(
            `INSERT INTO organization_invitations
    (organization_id, email, role, token_hash, invited_by, expires_at, invitation_type, max_uses)
 VALUES ($1, $2, 'member', $3, $4, $5, 'join_token', $6)
 RETURNING id, organization_id, role, status, expires_at, invitation_type, max_uses, used_count, created_at`,
            [
                organizationId,
                `join-token-${crypto.randomUUID()}@incidentflow.local`,
                tokenHash,
                req.user.id,
                expiresAt,
                maxUses
            ]
        );

        // Notify organization admins and platform admins
        const adminsResult = await pool.query(
            `SELECT DISTINCT
        u.id AS user_id,
        o.name AS organization_name
     FROM users u
     CROSS JOIN organizations o
     LEFT JOIN organization_members om
        ON om.user_id = u.id
        AND om.organization_id = o.id
     WHERE o.id = $1
       AND (
           u.role = 'platform_admin'
           OR om.role = 'admin'
       )`,
            [organizationId]
        );

        for (const admin of adminsResult.rows) {
            const notification = await createNotification(
                admin.user_id,
                null,
                "join_token_created",
                `A new invitation token has been generated for ${admin.organization_name} organization.`,
                organizationId
            );

            getIO().to(`user_${admin.user_id}`).emit(
                "notification_created",
                {
                    userId: admin.user_id,
                    organizationId,
                    notification
                }
            );
        }

        return res.status(201).json({
            message: "Join token created successfully",
            token: rawToken,
            invitation: result.rows[0],
            max_uses: maxUses
        });

    } catch (error) {
        console.error("Create join token error:", error);

        return res.status(500).json({
            message: "Server error while creating join token"
        });
    }
};


const getOrganizationJoinTokens = async (req, res) => {
    try {
        const organizationId = req.organizationId;

        const result = await pool.query(
            `SELECT
    id,
    organization_id,
    status,
    invitation_type,
    max_uses,
    used_count,
    expires_at,
    created_at,
    invited_by
 FROM organization_invitations
 WHERE organization_id = $1
   AND invitation_type = 'join_token'
 ORDER BY created_at DESC`,
            [organizationId]
        );

        return res.status(200).json({
            tokens: result.rows
        });

    } catch (error) {
        console.error("Get organization join tokens error:", error);

        return res.status(500).json({
            message: "Server error while fetching join tokens"
        });
    }
};

const validateJoinToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token || typeof token !== "string") {
            return res.status(400).json({
                message: "Please enter a valid invitation token"
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token.trim())
            .digest("hex");

        const result = await pool.query(
            `SELECT
                oi.id,
                oi.organization_id,
                oi.status,
                oi.expires_at,
                oi.max_uses,
                oi.used_count,
                o.name AS organization_name
             FROM organization_invitations oi
             JOIN organizations o
                ON o.id = oi.organization_id
             WHERE oi.token_hash = $1
               AND oi.invitation_type = 'join_token'`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Invalid invitation token"
            });
        }

        const invitation = result.rows[0];

        if (invitation.status === "revoked") {
            return res.status(400).json({
                message: "This invitation token has been revoked"
            });
        }

        if (new Date(invitation.expires_at) <= new Date()) {
            return res.status(400).json({
                message: "This invitation token has expired"
            });
        }

        if (invitation.status !== "pending") {
            return res.status(400).json({
                message: "This invitation token is no longer available"
            });
        }

        if (
            invitation.max_uses !== null &&
            invitation.used_count >= invitation.max_uses
        ) {
            return res.status(400).json({
                message: "This invitation token has reached its usage limit"
            });
        }

        return res.status(200).json({
            message: "Invitation token is valid",
            organization: {
                id: invitation.organization_id,
                name: invitation.organization_name
            }
        });

    } catch (error) {
        console.error("Validate join token error:", error);

        return res.status(500).json({
            message: "Server error while validating invitation token"
        });
    }
};

module.exports = {
    createInvitation,
    acceptInvitation,
    getOrganizationInvitations,
    revokeInvitation,
    createJoinToken,
    getOrganizationJoinTokens,
    validateJoinToken,
    createNotification
};