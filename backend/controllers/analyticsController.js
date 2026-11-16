// const pool = require("../config/db");

// const getIncidentsBySeverity = async (req, res) => {
//     try {
//         const result = await pool.query(
//             `SELECT
//                 severity,
//                 COUNT(*) AS count
//              FROM incidents
//              GROUP BY severity
//              ORDER BY severity`
//         );

//         res.json({
//             data: result.rows
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };
// const getIncidentStats = async (req, res) => {
//     try {
//         const result = await pool.query(
//             `SELECT
//                 COUNT(*) AS total_incidents,

//                 COUNT(*) FILTER (
//                     WHERE status != 'RESOLVED'
//                 ) AS active_incidents,

//                 COUNT(*) FILTER (
//                     WHERE status = 'RESOLVED'
//                 ) AS resolved_incidents,

//                 COUNT(*) FILTER (
//                     WHERE status = 'RESOLVED'
//                     AND resolved_at >= CURRENT_DATE
//                     AND resolved_at < CURRENT_DATE + INTERVAL '1 day'
//                 ) AS resolved_today,

//                 ROUND(
//                     AVG(
//                         EXTRACT(
//                             EPOCH FROM (resolved_at - created_at)
//                         ) / 3600
//                     ) FILTER (
//                         WHERE status = 'RESOLVED'
//                     )::numeric,
//                     2
//                 ) AS average_resolution_hours

//              FROM incidents`
//         );

//         res.json({
//             data: result.rows[0]
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };
// const getIncidentTrends = async (req, res) => {
//     try {
//         const result = await pool.query(
//             `SELECT
//                 DATE(created_at) AS date,
//                 COUNT(*) AS count
//              FROM incidents
//              GROUP BY DATE(created_at)
//              ORDER BY DATE(created_at)`
//         );

//         res.json({
//             data: result.rows
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };
// const getIncidentsByService = async (req, res) => {
//     try {
//         const result = await pool.query(
//             `SELECT
//                 services.name AS service_name,
//                 COUNT(incidents.id) AS count
//              FROM incidents
//              JOIN services
//              ON incidents.service_id = services.id
//              GROUP BY services.name
//              ORDER BY count DESC`
//         );

//         res.json({
//             data: result.rows
//         });

//     } catch (error) {
//         console.error(error);

//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// };
// module.exports = {
//     getIncidentsBySeverity,
//     getIncidentStats,
//     getIncidentTrends,
//     getIncidentsByService
// };

const pool = require("../config/db");

// Helper: Validate organization ID and verify membership
const verifyOrganizationAccess = async (req, res) => {
    // Platform Admin can access analytics across all organizations.
    if (req.user.role === "platform_admin") {
        return null;
    }

    const organization_id = Number(req.query.organization_id);

    if (!Number.isInteger(organization_id) || organization_id <= 0) {
        res.status(400).json({
            message: "Valid organization_id is required"
        });
        return undefined;
    }

    const membership = await pool.query(
        `SELECT id, role
         FROM organization_members
         WHERE organization_id = $1
         AND user_id = $2`,
        [organization_id, req.user.id]
    );

    if (membership.rows.length === 0) {
        res.status(403).json({
            message: "You are not a member of this organization"
        });
        return undefined;
    }

    return organization_id;
};


// 1. Incidents by Severity
const getIncidentsBySeverity = async (req, res) => {
    try {
        const organization_id = await verifyOrganizationAccess(req, res);

        if (organization_id === undefined) return;

        const result = organization_id === null
            ? await pool.query(
                `SELECT
            severity,
            COUNT(*) AS count
         FROM incidents
         GROUP BY severity
         ORDER BY severity`
            )
            : await pool.query(
                `SELECT
            severity,
            COUNT(*) AS count
         FROM incidents
         WHERE organization_id = $1
         GROUP BY severity
         ORDER BY severity`,
                [organization_id]
            );

        res.json({
            data: result.rows
        });

    } catch (error) {
        console.error("Get incidents by severity error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// 2. Incident Statistics
const getIncidentStats = async (req, res) => {
    try {
        const organization_id = await verifyOrganizationAccess(req, res);

        if (organization_id === undefined) return;

        const result = organization_id === null
            ? await pool.query(
                `SELECT
            COUNT(*) AS total_incidents,

            COUNT(*) FILTER (
                WHERE status != 'RESOLVED'
            ) AS active_incidents,

            COUNT(*) FILTER (
                WHERE status = 'RESOLVED'
            ) AS resolved_incidents,

            COUNT(*) FILTER (
                WHERE status = 'RESOLVED'
                AND resolved_at >= CURRENT_DATE
                AND resolved_at < CURRENT_DATE + INTERVAL '1 day'
            ) AS resolved_today,

            ROUND(
                AVG(
                    EXTRACT(
                        EPOCH FROM (resolved_at - created_at)
                    ) / 3600
                ) FILTER (
                    WHERE status = 'RESOLVED'
                )::numeric,
                2
            ) AS average_resolution_hours

         FROM incidents`
            )
            : await pool.query(
                `SELECT
            COUNT(*) AS total_incidents,

            COUNT(*) FILTER (
                WHERE status != 'RESOLVED'
            ) AS active_incidents,

            COUNT(*) FILTER (
                WHERE status = 'RESOLVED'
            ) AS resolved_incidents,

            COUNT(*) FILTER (
                WHERE status = 'RESOLVED'
                AND resolved_at >= CURRENT_DATE
                AND resolved_at < CURRENT_DATE + INTERVAL '1 day'
            ) AS resolved_today,

            ROUND(
                AVG(
                    EXTRACT(
                        EPOCH FROM (resolved_at - created_at)
                    ) / 3600
                ) FILTER (
                    WHERE status = 'RESOLVED'
                )::numeric,
                2
            ) AS average_resolution_hours

         FROM incidents
         WHERE organization_id = $1`,
                [organization_id]
            );

        res.json({
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Get incident stats error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// 3. Incident Trends
const getIncidentTrends = async (req, res) => {
    try {
        const organization_id = await verifyOrganizationAccess(req, res);

        if (organization_id === undefined) return;

        const result = organization_id === null
            ? await pool.query(
                `SELECT
            DATE(created_at) AS date,
            COUNT(*) AS count
         FROM incidents
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`
            )
            : await pool.query(
                `SELECT
            DATE(created_at) AS date,
            COUNT(*) AS count
         FROM incidents
         WHERE organization_id = $1
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`,
                [organization_id]
            );

        res.json({
            data: result.rows
        });

    } catch (error) {
        console.error("Get incident trends error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


// 4. Incidents by Service
const getIncidentsByService = async (req, res) => {
    try {
        const organization_id = await verifyOrganizationAccess(req, res);

        if (organization_id === undefined) return;

        const result = organization_id === null
            ? await pool.query(
                `SELECT
            services.name AS service_name,
            COUNT(incidents.id) AS count
         FROM incidents
         JOIN services
         ON incidents.service_id = services.id
         AND incidents.organization_id = services.organization_id
         GROUP BY services.name
         ORDER BY count DESC`
            )
            : await pool.query(
                `SELECT
            services.name AS service_name,
            COUNT(incidents.id) AS count
         FROM incidents
         JOIN services
         ON incidents.service_id = services.id
         AND services.organization_id = $1
         WHERE incidents.organization_id = $1
         GROUP BY services.name
         ORDER BY count DESC`,
                [organization_id]
            );

        res.json({
            data: result.rows
        });

    } catch (error) {
        console.error("Get incidents by service error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// 5. Global Platform Statistics (Platform Admin only)
const getGlobalStats = async (req, res) => {
    try {
        if (req.user.role !== "platform_admin") {
            return res.status(403).json({
                message: "Platform Admin access required"
            });
        }

        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM organizations) AS total_organizations,
                (SELECT COUNT(*) FROM users) AS total_users,
                (SELECT COUNT(*) FROM services) AS total_services,
                (SELECT COUNT(*) FROM incidents) AS total_incidents,
                (SELECT COUNT(*) FROM incidents
                 WHERE status != 'RESOLVED') AS active_incidents,
                (SELECT COUNT(*) FROM incidents
                 WHERE status = 'RESOLVED') AS resolved_incidents
        `);

        res.json({
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Get global stats error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// 6. Organization-wise Incident Comparison (Platform Admin only)
const getOrganizationComparison = async (req, res) => {
    try {
        if (req.user.role !== "platform_admin") {
            return res.status(403).json({
                message: "Platform Admin access required"
            });
        }

        const result = await pool.query(`
            SELECT
                organizations.id AS organization_id,
                organizations.name AS organization_name,

                COUNT(incidents.id) AS total_incidents,

                COUNT(incidents.id) FILTER (
                    WHERE incidents.status != 'RESOLVED'
                ) AS active_incidents,

                COUNT(incidents.id) FILTER (
                    WHERE incidents.status = 'RESOLVED'
                ) AS resolved_incidents

            FROM organizations

            LEFT JOIN incidents
                ON incidents.organization_id = organizations.id

            GROUP BY organizations.id, organizations.name

            ORDER BY total_incidents DESC, organizations.name ASC
        `);

        res.json({
            data: result.rows
        });

    } catch (error) {
        console.error("Get organization comparison error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getIncidentsBySeverity,
    getIncidentStats,
    getIncidentTrends,
    getIncidentsByService,
    getGlobalStats,
    getOrganizationComparison
};