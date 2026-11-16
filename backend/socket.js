const pool = require("./config/db");
const jwt = require("jsonwebtoken");

let io;

const initializeSocket = (server) => {
    const { Server } = require("socket.io");

    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ["GET", "POST"]
        }
    });

    // Socket authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Access token required"));
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not configured");
            return next(new Error("Server configuration error"));
        }

        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            socket.user = decoded;
            next();

        } catch (error) {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        console.log("Authenticated socket connected:", socket.id);

        // Private notification room
        socket.join(`user_${socket.user.id}`);

        // Join an incident room only after verifying active organization
        socket.on("join_incident", async (data) => {
            try {
                const incidentId = Number(data?.incident_id);
                const organizationId = Number(data?.organization_id);

                if (
                    !Number.isInteger(incidentId) ||
                    incidentId <= 0 ||
                    !Number.isInteger(organizationId) ||
                    organizationId <= 0
                ) {
                    return;
                }

                const result = await pool.query(
                    `SELECT i.id
                     FROM incidents i
                     INNER JOIN organization_members om
                        ON om.organization_id = i.organization_id
                     WHERE i.id = $1
                     AND i.organization_id = $2
                     AND om.user_id = $3`,
                    [
                        incidentId,
                        organizationId,
                        socket.user.id
                    ]
                );

                if (result.rows.length === 0) {
                    return;
                }

                const roomName = `incident_${incidentId}`;

                if (!socket.rooms.has(roomName)) {
                    socket.join(roomName);

                    console.log(
                        `User ${socket.user.id} joined incident ${incidentId} in organization ${organizationId}`
                    );
                }

            } catch (error) {
                console.error("Error joining incident room:", error);
            }
        });

        // Leave an incident room
        socket.on("leave_incident", async (data) => {
            const incidentId = Number(data?.incident_id);
            const organizationId = Number(data?.organization_id);

            if (
                !Number.isInteger(incidentId) ||
                incidentId <= 0 ||
                !Number.isInteger(organizationId) ||
                organizationId <= 0
            ) {
                return;
            }

            const result = await pool.query(
                `SELECT id
         FROM incidents
         WHERE id = $1
         AND organization_id = $2`,
                [incidentId, organizationId]
            );

            if (result.rows.length > 0) {
                socket.leave(`incident_${incidentId}`);
            }
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};

module.exports = {
    initializeSocket,
    getIO
};