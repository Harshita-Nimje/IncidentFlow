require("dotenv").config();

const express = require("express");
const http = require("http");
const { initializeSocket } = require("./socket");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const authenticateToken = require("./middleware/authMiddleware");
const organizationRoutes = require("./routes/organizationRoutes");
const teamRoutes = require("./routes/teamRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const incidentCommentRoutes = require("./routes/incidentCommentRoutes");
const incidentAssignmentRoutes = require("./routes/incidentAssignmentRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not configured");
}

const app = express();
const server = http.createServer(app);

initializeSocket(server);

app.use(
    cors({
        origin: process.env.FRONTEND_URL
    })
);

app.use(helmet());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/comments", incidentCommentRoutes);
app.use("/api/assignments", incidentAssignmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => {
    res.send("IncidentFlow backend is running!");
});

app.get("/api/protected", authenticateToken, (req, res) => {
    res.json({
        message: "You accessed a protected route!",
        user: req.user
    });
});

// Centralized error handler — keep this last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});