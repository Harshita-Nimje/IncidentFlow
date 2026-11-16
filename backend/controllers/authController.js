const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { createNotification } = require("./notificationController");
const { getIO } = require("../socket");


const registerUser = async (req, res) => {
    const client = await pool.connect();


    try {
        const { name, email, password } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Name is required"
            });
        }

        if (!email?.trim()) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "Password is required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await client.query(
            `SELECT id
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        await client.query("BEGIN");
        const hashedPassword = await bcrypt.hash(password, 10);
        const {
            invitationToken,
            organizationName,
            requestOrganizationId
        } = req.body;

        if (
            !invitationToken?.trim() &&
            !organizationName?.trim() &&
            !requestOrganizationId
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Please provide an organization name or select an organization to request access"
            });
        }

        let invitation = null;

        if (invitationToken?.trim()) {
            const tokenHash = crypto
                .createHash("sha256")
                .update(invitationToken.trim())
                .digest("hex");

            const invitationResult = await client.query(
                `SELECT *
         FROM organization_invitations
         WHERE token_hash = $1
           AND invitation_type = 'join_token'
         FOR UPDATE`,
                [tokenHash]
            );

            if (invitationResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Invalid invitation token"
                });
            }

            invitation = invitationResult.rows[0];

            if (invitation.status !== "pending") {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "This invitation token is no longer available"
                });
            }

            if (new Date(invitation.expires_at) <= new Date()) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "This invitation token has expired"
                });
            }

            if (
                invitation.max_uses !== null &&
                invitation.used_count >= invitation.max_uses
            ) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "This invitation token has reached its usage limit"
                });
            }
        }

        let requestedOrganization = null;

        if (requestOrganizationId) {
            const organizationId = Number(requestOrganizationId);

            if (!Number.isInteger(organizationId) || organizationId <= 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Invalid organization selection"
                });
            }

            const organizationResult = await client.query(
                `SELECT id, name
                 FROM organizations
                 WHERE id = $1`,
                [organizationId]
            );

            if (organizationResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    message: "Selected organization not found"
                });
            }

            requestedOrganization = organizationResult.rows[0];
        }

        const result = await client.query(
            `INSERT INTO users
             (name, email, password, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, role`,
            [
                name.trim(),
                normalizedEmail,
                hashedPassword,
                "user"
            ]
        );

        const user = result.rows[0];
        let organization;

        if (invitation) {
            // Add user to the existing organization
            await client.query(
                `INSERT INTO organization_members
         (organization_id, user_id, role)
         VALUES ($1, $2, 'member')`,
                [invitation.organization_id, user.id]
            );

            // Increment token usage
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

            const organizationResult = await client.query(
                `SELECT id, name
         FROM organizations
         WHERE id = $1`,
                [invitation.organization_id]
            );

            organization = organizationResult.rows[0];

        } else if (requestedOrganization) {
            // Create a pending join request
            await client.query(
                `INSERT INTO organization_join_requests
                 (organization_id, user_id)
                 VALUES ($1, $2)`,
                [requestedOrganization.id, user.id]
            );

            organization = requestedOrganization;

        } else {
            // Create a new organization
            const organizationResult = await client.query(
                `INSERT INTO organizations (name)
         VALUES ($1)
         RETURNING id, name, created_at`,
                [organizationName.trim()]
            );

            organization = organizationResult.rows[0];

            // Make the new user an organization admin
            await client.query(
                `INSERT INTO organization_members
         (organization_id, user_id, role)
         VALUES ($1, $2, 'admin')`,
                [organization.id, user.id]
            );
        }

        await client.query("COMMIT");
        if (invitation) {
            try {
                const adminsResult = await pool.query(
                    `SELECT DISTINCT u.id AS user_id
             FROM users u
             LEFT JOIN organization_members om
                ON om.user_id = u.id
                AND om.organization_id = $1
             WHERE u.role = 'platform_admin'
                OR om.role = 'admin'`,
                    [invitation.organization_id]
                );

                for (const admin of adminsResult.rows) {
                    const notification = await createNotification(
                        admin.user_id,
                        null,
                        "member_joined",
                        `${user.name} joined your organization using an invitation token.`,
                        invitation.organization_id
                    );

                    getIO().to(`user_${admin.user_id}`).emit(
                        "notification_created",
                        {
                            userId: admin.user_id,
                            organizationId: invitation.organization_id,
                            notification
                        }
                    );
                }
            } catch (notificationError) {
                console.error(
                    "Error sending member joined notifications:",
                    notificationError
                );
            }
        }

        if (requestedOrganization) {
            const adminsResult = await pool.query(
                `SELECT DISTINCT u.id AS user_id
     FROM users u
     LEFT JOIN organization_members om
        ON om.user_id = u.id
        AND om.organization_id = $1
     WHERE u.role = 'platform_admin'
        OR om.role = 'admin'`,
                [requestedOrganization.id]
            );


            try {
                const adminsResult = await pool.query(
                    `SELECT DISTINCT u.id AS user_id
             FROM users u
             LEFT JOIN organization_members om
                ON om.user_id = u.id
                AND om.organization_id = $1
             WHERE u.role = 'platform_admin'
                OR om.role = 'admin'`,
                    [requestedOrganization.id]
                );

                for (const admin of adminsResult.rows) {
                    const notification = await createNotification(
                        admin.user_id,
                        null,
                        "join_request",
                        `${user.name} requested access to ${requestedOrganization.name}.`,
                        requestedOrganization.id,
                    );

                    getIO().to(`user_${admin.user_id}`).emit(
                        "notification_created",
                        {
                            userId: admin.user_id,
                            organizationId: requestedOrganization.id,
                            notification
                        }
                    );
                }


            } catch (notificationError) {
                console.error(
                    "Error sending join request notifications:",
                    notificationError
                );
            }
        }

        res.status(201).json({
            message: requestedOrganization
                ? "Registration successful. Your join request is pending admin approval."
                : "User registered successfully",
            user,
            organization,
            joinRequestPending: Boolean(requestedOrganization)
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    } finally {
        client.release();
    }
};


const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, name, email, password, role
             FROM users
             WHERE email = $1`,
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured");

            return res.status(500).json({
                message: "Server configuration error"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
    registerUser,
    loginUser,
    createNotification
};