const pool = require("../config/db");

const getIncidentsBySeverity = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                severity,
                COUNT(*) AS count
             FROM incidents
             GROUP BY severity
             ORDER BY severity`
        );

        res.json({
            data: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getIncidentStats = async (req, res) => {
    try {
        const result = await pool.query(
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
        );

        res.json({
            data: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getIncidentTrends = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                DATE(created_at) AS date,
                COUNT(*) AS count
             FROM incidents
             GROUP BY DATE(created_at)
             ORDER BY DATE(created_at)`
        );

        res.json({
            data: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
const getIncidentsByService = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                services.name AS service_name,
                COUNT(incidents.id) AS count
             FROM incidents
             JOIN services
             ON incidents.service_id = services.id
             GROUP BY services.name
             ORDER BY count DESC`
        );

        res.json({
            data: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};
module.exports = {
    getIncidentsBySeverity,
    getIncidentStats,
    getIncidentTrends,
    getIncidentsByService
};