import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_API_URL, {
    autoConnect: false,

    auth: (callback) => {
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("token")
                : null;

        callback({ token });
    },

    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Connection successful
// socket.on("connect", () => {
//     console.log("SOCKET CONNECTED:", socket.id);
// });

// Connection error
socket.on("connect_error", (error) => {
    console.error("SOCKET CONNECTION ERROR:", error.message);
});

// Disconnection
socket.on("disconnect", (reason) => {
    console.warn("SOCKET DISCONNECTED:", reason);
});

// Expose socket for debugging
if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development"
) {
    window.incidentFlowSocket = socket;
}

// Automatically connect when a valid login token exists
if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token && !socket.connected) {
        socket.connect();
    }
}

export default socket;
