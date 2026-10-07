// const { Pool } = require("pg");

// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
// });

// module.exports = pool;

const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Connection pool settings
    max: 20,
    min: 2,

    // Close idle connections after 30 seconds
    idleTimeoutMillis: 30000,

    // Wait up to 5 seconds for an available connection
    connectionTimeoutMillis: 5000
});

pool.on("error", (error) => {
    console.error("Unexpected PostgreSQL pool error:", error);
});

module.exports = pool;