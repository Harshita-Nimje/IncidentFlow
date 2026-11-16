
const pool = require("../config/db");
const { createNotification } = require("./notificationController");
const { getIO } = require("../socket");

// Create organization - Platform Admin only (protected in routes)
const createOrganization = async (req, res) => {
    const client = await pool.connect();

    try {
        const { name } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Organization name is required"
            });
        }

        await client.query("BEGIN");

        const result = await client.query(
            `INSERT INTO organizations (name)
             VALUES ($1)
             RETURNING id, name, created_at`,
            [name.trim()]
        );

        const organization = result.rows[0];

        // Make the creator an admin of the new organization
        await client.query(
            `INSERT INTO organization_members
             (organization_id, user_id, role)
             VALUES ($1, $2, $3)`,
            [organization.id, req.user.id, "admin"]
        );

        await client.query("COMMIT");

        // Notify all platform admins
        const platformAdmins = await pool.query(
            `SELECT id FROM users
     WHERE role = 'platform_admin'`
        );

        for (const admin of platformAdmins.rows) {
            const notification = await createNotification(
                admin.id,
                null,
                "organization_created",
                `A new organization "${organization.name}" has been created.`,
                null
            );

            getIO().to(`user_${admin.id}`).emit("notification_created", {
                userId: admin.id,
                organizationId: null,
                notification
            });
        }

        res.status(201).json({
            message: "Organization created successfully",
            organization
        });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Create organization error:", error);

        res.status(500).json({
            message: "Server error"
        });

    } finally {
        client.release();
    }
};


// Get organizations
const getOrganizations = async (req, res) => {
    try {
        let result;
        let pendingJoinRequests = [];

        if (req.user.role === "platform_admin") {
            // Platform Admin can see every organization
            result = await pool.query(
                `SELECT
                    o.id,
                    o.name,
                    o.created_at,
                    om.role
                 FROM organizations o
                 LEFT JOIN organization_members om
                    ON om.organization_id = o.id
                    AND om.user_id = $1
                 ORDER BY o.name ASC`,
                [req.user.id]
            );

            const pendingResult = await pool.query(
                `SELECT
        jr.id,
        jr.organization_id,
        o.name AS organization_name,
        jr.user_id,
        u.name AS user_name,
        u.email AS user_email,
        jr.status,
        jr.requested_at
     FROM organization_join_requests jr
     JOIN organizations o
        ON o.id = jr.organization_id
     JOIN users u
        ON u.id = jr.user_id
     WHERE jr.status = 'pending'
     ORDER BY jr.requested_at DESC`
            );

            pendingJoinRequests = pendingResult.rows;

        } else {
            // Other users can see only their organizations
            result = await pool.query(
                `SELECT
                    o.id,
                    o.name,
                    o.created_at,
                    om.role
                 FROM organizations o
                 JOIN organization_members om
                    ON om.organization_id = o.id
                 WHERE om.user_id = $1
                 ORDER BY o.name ASC`,
                [req.user.id]
            );

            const pendingResult = await pool.query(
                `SELECT
        jr.id,
        jr.organization_id,
        o.name AS organization_name,
        jr.status,
        jr.requested_at
     FROM organization_join_requests jr
     JOIN organizations o
        ON o.id = jr.organization_id
     WHERE jr.user_id = $1
        AND jr.status = 'pending'
     ORDER BY jr.requested_at DESC`,
                [req.user.id]
            );

            pendingJoinRequests = pendingResult.rows;
        }

        res.status(200).json({
            organizations: result.rows,
            pendingJoinRequests
        });

    } catch (error) {
        console.error("Get organizations error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get one organization by ID
const getOrganizationById = async (req, res) => {
    try {
        const organizationId = Number(req.params.id);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        if (req.user.role !== "platform_admin") {
            const membershipCheck = await pool.query(
                `SELECT id
                 FROM organization_members
                 WHERE organization_id = $1
                 AND user_id = $2`,
                [organizationId, req.user.id]
            );

            if (membershipCheck.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this organization"
                });
            }
        }

        const result = await pool.query(
            `SELECT id, name, created_at
             FROM organizations
             WHERE id = $1`,
            [organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        res.status(200).json({
            organization: result.rows[0]
        });

    } catch (error) {
        console.error("Get organization by ID error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Get organization members
const getOrganizationMembers = async (req, res) => {
    try {
        const organizationId = Number(req.params.id);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        // Platform Admin can access all organizations.
        // Other users must belong to the requested organization.
        if (req.user.role !== "platform_admin") {
            const membershipCheck = await pool.query(
                `SELECT id
                 FROM organization_members
                 WHERE organization_id = $1
                 AND user_id = $2`,
                [organizationId, req.user.id]
            );

            if (membershipCheck.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this organization"
                });
            }
        }

        const result = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                om.role,
                om.joined_at
             FROM organization_members om
             JOIN users u ON u.id = om.user_id
             WHERE om.organization_id = $1
             ORDER BY om.joined_at DESC`,
            [organizationId]
        );

        res.status(200).json({
            organization_id: organizationId,
            members: result.rows
        });

    } catch (error) {
        console.error("Get organization members error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Update organization
const updateOrganization = async (req, res) => {
    try {
        const organizationId = Number(req.params.id);
        const { name } = req.body;

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        if (!name?.trim()) {
            return res.status(400).json({
                message: "Organization name is required"
            });
        }

        // Organization Admin can update only their own organization.
        // Platform Admin can update any organization.
        if (req.user.role !== "platform_admin") {
            const membershipCheck = await pool.query(
                `SELECT id
                 FROM organization_members
                 WHERE organization_id = $1
                 AND user_id = $2
                 AND role = 'admin'`,
                [organizationId, req.user.id]
            );

            if (membershipCheck.rows.length === 0) {
                return res.status(403).json({
                    message: "Only the organization admin or platform admin can update this organization"
                });
            }
        }

        const result = await pool.query(
            `UPDATE organizations
             SET name = $1
             WHERE id = $2
             RETURNING id, name, created_at`,
            [name.trim(), organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        res.status(200).json({
            message: "Organization updated successfully",
            organization: result.rows[0]
        });

    } catch (error) {
        console.error("Update organization error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// Delete organization - Platform Admin only
const deleteOrganization = async (req, res) => {
    try {
        const organizationId = Number(req.params.id);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        if (req.user.role !== "platform_admin") {
            return res.status(403).json({
                message: "Only Platform Admin can delete organizations"
            });
        }

        const result = await pool.query(
            `DELETE FROM organizations
             WHERE id = $1
             RETURNING id, name`,
            [organizationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        res.status(200).json({
            message: "Organization deleted successfully",
            organization: result.rows[0]
        });

    } catch (error) {
        console.error("Delete organization error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// Create organization join request
const createJoinRequest = async (req, res) => {
    try {
        const organizationId = Number(req.body.organizationId);
        const userId = req.user.id;

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

        const organizationResult = await pool.query(
            `SELECT id, name
             FROM organizations
             WHERE id = $1`,
            [organizationId]
        );

        if (organizationResult.rows.length === 0) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }

        const membershipResult = await pool.query(
            `SELECT id
             FROM organization_members
             WHERE organization_id = $1
             AND user_id = $2`,
            [organizationId, userId]
        );

        if (membershipResult.rows.length > 0) {
            return res.status(400).json({
                message: "You are already a member of this organization"
            });
        }

        const existingRequest = await pool.query(
            `SELECT id
             FROM organization_join_requests
             WHERE organization_id = $1
             AND user_id = $2
             AND status = 'pending'`,
            [organizationId, userId]
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({
                message: "You already have a pending request for this organization"
            });
        }

        const result = await pool.query(
            `INSERT INTO organization_join_requests
             (organization_id, user_id)
             VALUES ($1, $2)
             RETURNING id, organization_id, user_id, status, requested_at`,
            [organizationId, userId]
        );

        // Create notifications for organization admins and platform admins.
        try {
            const requesterResult = await pool.query(
                `SELECT name
                 FROM users
                 WHERE id = $1`,
                [userId]
            );

            const requesterName = requesterResult.rows[0]?.name || "A user";
            const organizationName = organizationResult.rows[0].name;

            const adminsResult = await pool.query(
                `SELECT DISTINCT u.id AS user_id
                 FROM users u
                 LEFT JOIN organization_members om
                    ON om.user_id = u.id
                    AND om.organization_id = $1
                 WHERE u.role = 'platform_admin'
                    OR om.role = 'admin'`,
                [organizationId]
            );

            const io = getIO();

            for (const admin of adminsResult.rows) {
                const notification = await createNotification(
                    admin.user_id,
                    null,
                    "join_request",
                    `${requesterName} requested access to ${organizationName}.`,
                    organizationId
                );

                io.to(`user_${admin.user_id}`).emit("notification_created", {
                    userId: admin.user_id,
                    organizationId,
                    notification
                });
            }

        } catch (notificationError) {
            console.error("Join request notification error:", notificationError);
        }

        res.status(201).json({
            message: "Join request submitted successfully",
            request: result.rows[0]
        });

    } catch (error) {
        console.error("Create join request error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// Get organization join requests - Organization Admin / Platform Admin
const getOrganizationJoinRequests = async (req, res) => {
    try {
        const organizationId = Number(req.params.id);

        if (!Number.isInteger(organizationId) || organizationId <= 0) {
            return res.status(400).json({
                message: "Invalid organization ID"
            });
        }

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
                    message: "Only organization admins can view join requests"
                });
            }
        }

        const result = await pool.query(
            `SELECT
                jr.id,
                jr.organization_id,
                jr.user_id,
                jr.status,
                jr.requested_at,
                u.name,
                u.email
             FROM organization_join_requests jr
             JOIN users u ON u.id = jr.user_id
             WHERE jr.organization_id = $1
             AND jr.status = 'pending'
             ORDER BY jr.requested_at DESC`,
            [organizationId]
        );

        res.status(200).json({
            organization_id: organizationId,
            requests: result.rows
        });

    } catch (error) {
        console.error("Get organization join requests error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// Approve or reject organization join request
const reviewOrganizationJoinRequest = async (req, res) => {
    const client = await pool.connect();

    try {
        const organizationId = Number(req.params.id);
        const requestId = Number(req.params.requestId);
        const { status } = req.body;

        if (
            !Number.isInteger(organizationId) ||
            organizationId <= 0 ||
            !Number.isInteger(requestId) ||
            requestId <= 0
        ) {
            return res.status(400).json({
                message: "Invalid organization or request ID"
            });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be approved or rejected"
            });
        }

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
                return res.status(403).json({
                    message: "Only organization admins can review join requests"
                });
            }
        }

        await client.query("BEGIN");

        const requestResult = await client.query(
            `SELECT *
             FROM organization_join_requests
             WHERE id = $1
             AND organization_id = $2
             FOR UPDATE`,
            [requestId, organizationId]
        );

        if (requestResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Join request not found"
            });
        }

        const joinRequest = requestResult.rows[0];

        if (joinRequest.status !== "pending") {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "This join request has already been reviewed"
            });
        }

        if (status === "approved") {
            await client.query(
                `INSERT INTO organization_members
                 (organization_id, user_id, role)
                 VALUES ($1, $2, 'member')`,
                [organizationId, joinRequest.user_id]
            );
        }

        await client.query(
            `UPDATE organization_join_requests
             SET status = $1,
                 reviewed_at = CURRENT_TIMESTAMP,
                 reviewed_by = $2
             WHERE id = $3`,
            [status, req.user.id, requestId]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: `Join request ${status} successfully`
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Review organization join request error:", error);

        res.status(500).json({
            message: "Server error"
        });
    } finally {
        client.release();
    }
};

// Search organizations for registration
const searchOrganizationsForJoin = async (req, res) => {
    try {
        const searchTerm = req.query.search?.trim();

        if (!searchTerm) {
            return res.status(200).json({
                organizations: []
            });
        }

        const result = await pool.query(
            `SELECT id, name
             FROM organizations
             WHERE name ILIKE $1
             ORDER BY name ASC
             LIMIT 10`,
            [`%${searchTerm}%`]
        );

        res.status(200).json({
            organizations: result.rows
        });

    } catch (error) {
        console.error("Search organizations error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


module.exports = {
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
};
