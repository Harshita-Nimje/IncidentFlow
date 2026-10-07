const pool = require("../config/db");

const getUsers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role
             FROM users
             ORDER BY name ASC`
        );

        res.json({
            users: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getUsers
};