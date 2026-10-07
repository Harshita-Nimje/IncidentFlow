

let io;

const initializeSocket = (server) => {
    const { Server } = require("socket.io");

    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // Join an incident-specific room
        socket.on("join_incident", (incidentId) => {
            socket.join(`incident_${incidentId}`);
        });

        // Leave an incident-specific room
        socket.on("leave_incident", (incidentId) => {
            socket.leave(`incident_${incidentId}`);
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