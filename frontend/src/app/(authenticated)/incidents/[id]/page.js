"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import socket from "../../../socket";

export default function IncidentDetails() {
    const params = useParams();
    const router = useRouter();
    const [incident, setIncident] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [comments, setComments] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedRole, setSelectedRole] = useState("RESPONDER");
    const [assigning, setAssigning] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [assignmentToRemove, setAssignmentToRemove] = useState(null);
    const [assignmentError, setAssignmentError] = useState("");
    const [assignmentSuccess, setAssignmentSuccess] = useState("");
    const [newComment, setNewComment] = useState("");
    const [addingComment, setAddingComment] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [userRole, setUserRole] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const statusFlow = [
        "INVESTIGATING",
        "IDENTIFIED",
        "MITIGATING",
        "MONITORING",
        "RESOLVED"
    ];
    const updateStatus = async (newStatus) => {

        try {
            setUpdating(true);
            setAssignmentError("");
            setAssignmentSuccess("");

            const response = await fetch(
                // `http://localhost:5000/api/incidents/${params.id}/status`,
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${params.id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );

            const data = await response.json();


            if (response.ok) {
                setIncident(data.incident);
                await refreshTimeline();
            }
        } catch (error) {
            console.error("Error updating status:", error);
        } finally {
            setUpdating(false);
        }
    };
    const deleteIncident = async () => {
        try {
            setDeleting(true);

            const response = await fetch(
                // `http://localhost:5000/api/incidents/${params.id}`,
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${params.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();


            if (response.ok) {
                router.push("/incidents");
            }
        } catch (error) {
            console.error("Error deleting incident:", error);
        } finally {
            setDeleting(false);
        }
    };
    const refreshTimeline = async () => {
        try {
            const response = await fetch(
                // `http://localhost:5000/api/incidents/${params.id}/timeline`,
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${params.id}/timeline`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();

            setTimeline(data.timeline || []);
        } catch (error) {
            console.error("Error refreshing timeline:", error);
        }
    };
    const refreshComments = async () => {
        try {
            const response = await fetch(
                // `http://localhost:5000/api/comments/${params.id}`,
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${params.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();

            setComments(data.comments || []);
        } catch (error) {
            console.error("Error refreshing comments:", error);
        }
    };
    const refreshAssignments = async () => {
        try {
            const response = await fetch(
                // `http://localhost:5000/api/assignments/${params.id}`,
                `${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${params.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();

            setAssignments(data.assignments || []);
        } catch (error) {
            console.error("Error refreshing assignments:", error);
        }
    };

    const addComment = async () => {
        if (!newComment.trim()) {
            return;
        }

        try {
            setAddingComment(true);

            const response = await fetch(
                // "http://localhost:5000/api/comments",
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        incident_id: params.id,
                        message: newComment
                    }),
                }
            );

            const data = await response.json();


            if (response.ok) {
                await refreshComments();
                setNewComment("");
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setAddingComment(false);
        }
    };
    const deleteComment = async (commentId) => {
        try {
            const response = await fetch(
                // `http://localhost:5000/api/comments/${commentId}`,
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setComments((prev) =>
                    prev.filter((comment) => comment.id !== commentId)
                );
            }
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const assignUser = async () => {
        if (!selectedUser) {
            return;
        }

        try {
            setAssigning(true);

            const response = await fetch(
                // "http://localhost:5000/api/assignments",
                `${process.env.NEXT_PUBLIC_API_URL}/api/assignments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        incident_id: params.id,
                        user_id: Number(selectedUser),
                        role: selectedRole
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                const assignedUser = users.find(
                    (user) => user.id === Number(selectedUser)
                );

                setAssignments((prev) => [
                    ...prev,
                    {
                        ...data.assignment,
                        user_name: assignedUser.name,
                        email: assignedUser.email
                    }
                ]);

                setSelectedUser("");
                setAssignmentError("");
                setAssignmentSuccess("User assigned successfully");
                await refreshTimeline();
            } else {
                setAssignmentError(data.message || "Failed to assign user");
            }
        } catch (error) {
            console.error("Error assigning user:", error);
        } finally {
            setAssigning(false);
        }
    };
    const removeAssignment = async (assignmentId) => {
        try {
            setAssignmentSuccess("");
            setAssignmentError("");
            const response = await fetch(
                // `http://localhost:5000/api/assignments/${assignmentId}`,
                `${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${assignmentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setAssignments((prev) =>
                    prev.filter((assignment) => assignment.id !== assignmentId)
                );
                await refreshTimeline();
            }
        } catch (error) {
            console.error("Error removing assignment:", error);
        }
    };


    useEffect(() => {
        const fetchIncident = async () => {
            const token = localStorage.getItem("token");

            if (token) {
                const decoded = JSON.parse(atob(token.split(".")[1]));
                setUserRole(decoded.role);
                setCurrentUser(decoded);
            }

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${params.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();


                setIncident(data.incident);

                const timelineResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${params.id}/timeline`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const timelineData = await timelineResponse.json();


                setTimeline(timelineData.timeline || []);

                const commentsResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${params.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const commentsData = await commentsResponse.json();

                setComments(commentsData.comments || []);

                const assignmentsResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${params.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const usersResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/users`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const usersData = await usersResponse.json();


                setUsers(usersData.users || []);

                const assignmentsData = await assignmentsResponse.json();

                setAssignments(assignmentsData.assignments || []);

                await refreshComments();

                setLoading(false);
                setLastUpdated(new Date());
            } catch (error) {
                console.error("Error fetching incident:", error);
                setLoading(false);
            }
        };

        fetchIncident();
    }, [params.id]);

    useEffect(() => {
        const handleUserAssigned = (data) => {

            if (String(data.incidentId) === String(params.id)) {
                refreshAssignments();
                refreshTimeline();
            }
        };

        const handleUserUnassigned = (data) => {

            if (String(data.incidentId) === String(params.id)) {
                setAssignments((prev) =>
                    prev.filter(
                        (assignment) =>
                            String(assignment.id) !== String(data.assignmentId)
                    )
                );

                refreshTimeline();
            }
        };

        const handleStatusUpdate = (data) => {

            if (String(data.incidentId) === String(params.id)) {
                setIncident(data.incident);
                refreshTimeline();
            }
        };

        const handleCommentAdded = (data) => {

            if (String(data.incidentId) === String(params.id)) {
                setComments((prev) => [...prev, data.comment]);
            }
        };

        const handleCommentDeleted = (data) => {

            if (String(data.incidentId) === String(params.id)) {
                setComments((prev) =>
                    prev.filter(
                        (comment) =>
                            String(comment.id) !== String(data.commentId)
                    )
                );
            }
        };

        const handleConnect = () => {
            console.log("Incident socket connected:", socket.id);

            // Join the current incident room
            socket.emit("join_incident", params.id);
        };

        // If the shared socket is already connected
        if (socket.connected) {
            socket.emit("join_incident", params.id);
        }

        socket.on("connect", handleConnect);

        socket.on("user_assigned", handleUserAssigned);
        socket.on("user_unassigned", handleUserUnassigned);
        socket.on("comment_added", handleCommentAdded);
        socket.on("comment_deleted", handleCommentDeleted);
        socket.on("incident_status_updated", handleStatusUpdate);

        return () => {
            // Leave the current incident room
            socket.emit("leave_incident", params.id);

            socket.off("connect", handleConnect);
            socket.off("user_assigned", handleUserAssigned);
            socket.off("user_unassigned", handleUserUnassigned);
            socket.off("comment_added", handleCommentAdded);
            socket.off("comment_deleted", handleCommentDeleted);
            socket.off("incident_status_updated", handleStatusUpdate);
        };
    }, [params.id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-950 text-white p-6 md:p-8">
                <div className="text-center">
                    <p className="text-white text-lg">
                        Loading incident...
                    </p>

                    <p className="text-slate-500 text-sm mt-2">
                        Fetching incident details
                    </p>
                </div>
            </main>
        );
    }

    if (!incident) {
        return (
            <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">
                        Incident not found
                    </h1>

                    <p className="text-slate-400 mt-2">
                        The incident you are looking for does not exist.
                    </p>

                    <button
                        type="button"
                        onClick={() => window.location.href = "/"}
                        className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                        Back
                    </button>

                </div>
            </main>
        );
    }

    const getStatusClass = (status) => {
        switch (status) {
            case "RESOLVED":
                return "bg-green-500/20 text-green-400";

            case "MONITORING":
                return "bg-yellow-500/20 text-yellow-400";

            case "MITIGATING":
                return "bg-orange-500/20 text-orange-400";

            case "IDENTIFIED":
                return "bg-blue-500/20 text-blue-400";

            default:
                return "bg-red-500/20 text-red-400";
        }
    };
    const getSeverityClass = (severity) => {
        switch (severity) {
            case "SEV-1":
                return "bg-red-500/20 text-red-400";

            case "SEV-2":
                return "bg-orange-500/20 text-orange-400";

            case "SEV-3":
                return "bg-yellow-500/20 text-yellow-400";

            case "SEV-4":
                return "bg-green-500/20 text-green-400";

            default:
                return "bg-slate-800 text-slate-300";
        }
    };
    const getStatusDescription = (status) => {
        switch (status) {
            case "INVESTIGATING":
                return "The team is investigating the cause of the incident.";

            case "IDENTIFIED":
                return "The root cause of the incident has been identified.";

            case "MITIGATING":
                return "The team is working to reduce or stop the impact.";

            case "MONITORING":
                return "The fix has been applied and the system is being monitored.";

            case "RESOLVED":
                return "The incident has been resolved.";

            default:
                return "Status information unavailable.";
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => router.push("/incidents")}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    >
                        ← Back
                    </button>

                    {userRole === "admin" && (
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                        >
                            Delete Incident
                        </button>
                    )}
                </div>
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Incident Details
                        </h1>

                        <p className="text-slate-400 mt-1">
                            Track and manage this incident
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-end items-center gap-2">
                        <button
                            type="button"
                            disabled={refreshing}
                            onClick={async () => {
                                try {
                                    setRefreshing(true);

                                    await refreshTimeline();
                                    await refreshComments();

                                    setLastUpdated(new Date());
                                } finally {
                                    setRefreshing(false);
                                }
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>

                        {lastUpdated && (
                            <p className="w-full text-right text-xs text-slate-500 mt-1">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-3xl font-bold">
                        {incident.title}
                    </h2>

                    <p className="text-sm text-slate-500 mt-2">
                        Incident #{incident.id}
                    </p>
                </div>

                <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">

                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                            Description
                        </p>

                        <p className="text-slate-300 mt-2 leading-relaxed">
                            {incident.description}
                        </p>
                    </div>

                    <div className="mt-6">

                        <div className="mt-6">
                            <div className="flex gap-3">
                                <span
                                    className={`px-3 py-1 rounded-full text-sm ${getSeverityClass(
                                        incident.severity
                                    )}`}
                                >
                                    {incident.severity}
                                </span>

                                <span
                                    className={`px-3 py-1 rounded-full text-sm ${getStatusClass(
                                        incident.status
                                    )}`}
                                >
                                    {incident.status}
                                </span>
                            </div>

                            <p className="text-sm text-slate-400 mt-3">
                                {getStatusDescription(incident.status)}
                            </p>
                        </div>
                        {(userRole === "admin" || userRole === "lead") && (
                            <div className="mt-8 border-t border-slate-800 pt-6">

                                <p className="text-sm font-medium text-slate-300 mb-1">
                                    Update Status
                                </p>

                                <p className="text-xs text-slate-500 mb-4">
                                    Move the incident through the response lifecycle.
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    {statusFlow.map((status) => {
                                        const currentIndex = statusFlow.indexOf(incident.status);
                                        const statusIndex = statusFlow.indexOf(status);

                                        const isCurrent = status === incident.status;
                                        const isNext = statusIndex === currentIndex + 1;

                                        return (
                                            <button
                                                key={status}
                                                onClick={() => {
                                                    setSelectedStatus(status);
                                                    setShowStatusModal(true);
                                                }}
                                                disabled={updating || !isNext}
                                                className={`px-4 py-2 rounded-lg transition ${isCurrent
                                                    ? "bg-blue-600 text-white"
                                                    : isNext
                                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                                        : "bg-slate-800 text-slate-500"
                                                    }`}
                                            >
                                                {status}
                                            </button>
                                        );
                                    })}
                                </div>

                            </div>
                        )}
                    </div>
                    <div className="mt-6 border-t border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div>
                            <p className="text-sm text-slate-500">
                                Created by
                            </p>

                            <p className="text-slate-200 mt-1">
                                {incident.creator_name}
                            </p>

                            <p className="text-sm text-slate-500">
                                {incident.creator_email}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-slate-500">
                                Created at
                            </p>

                            <p className="text-slate-300 mt-1">
                                {new Date(incident.created_at).toLocaleString()}
                            </p>
                        </div>

                        {incident.resolved_at && (
                            <div>
                                <p className="text-sm text-slate-500">
                                    Resolved at
                                </p>

                                <p className="text-slate-300 mt-1">
                                    {new Date(incident.resolved_at).toLocaleString()}
                                </p>
                            </div>
                        )}

                    </div>


                </div>
                <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Incident Timeline
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Track status changes and incident activity.
                        </p>
                    </div>

                    <div className="mt-6 space-y-4">
                        {timeline.length === 0 ? (
                            <p className="text-slate-400">
                                No timeline events yet.
                            </p>
                        ) : (
                            timeline.map((event) => (
                                <div
                                    key={event.id}
                                    className="border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition"
                                >
                                    <span className="inline-block px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-medium mb-2">
                                        {event.event_type}
                                    </span>
                                    <p className="text-white font-medium">
                                        {event.message}
                                    </p>
                                    <p className="text-slate-400 text-sm mt-2">
                                        By {event.user_name || "Unknown user"}
                                    </p>

                                    <p className="text-slate-500 text-sm mt-1">
                                        {new Date(event.created_at).toLocaleString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Comments
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Discuss the incident and share updates with the team.
                        </p>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newComment.trim()) {
                                    addComment();
                                }
                            }}
                            placeholder="Write an update or comment..."
                            maxLength={500}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition"
                        />

                        <button
                            onClick={addComment}
                            disabled={addingComment || !newComment.trim()}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 transition"
                        >
                            {addingComment ? "Adding..." : "Add Comment"}
                        </button>
                    </div>

                    <div className="mt-6 space-y-4">
                        {comments.length === 0 ? (
                            <p className="text-slate-400">
                                No comments yet.
                            </p>
                        ) : (
                            comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="border border-slate-800 rounded-lg p-4"
                                >
                                    <p className="text-white">
                                        {comment.message}
                                    </p>

                                    <p className="text-slate-400 text-sm mt-2">
                                        By {comment.user_name || "Unknown user"}
                                    </p>

                                    <p className="text-slate-500 text-sm mt-2">
                                        {new Date(comment.created_at).toLocaleString()}
                                    </p>

                                    {currentUser &&
                                        (
                                            Number(comment.user_id) === Number(currentUser.id) ||
                                            currentUser.role?.toLowerCase() === "admin"
                                        ) && (
                                            <button
                                                onClick={() => {
                                                    setCommentToDelete(comment);
                                                    setShowCommentDeleteModal(true);
                                                }}
                                                className="text-red-400 mt-2 hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Assigned Users
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            People currently responsible for this incident.
                        </p>
                    </div>
                    {assignmentError && (
                        <p className="text-red-400 text-sm mb-3">
                            {assignmentError}
                        </p>
                    )}
                    {assignmentSuccess && (
                        <p className="text-green-400 text-sm mb-3">
                            {assignmentSuccess}
                        </p>
                    )}
                    {(userRole === "admin" || userRole === "lead") && (
                        <div className="mt-5 flex flex-col md:flex-row gap-3">
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                            >
                                <option value="">Select user</option>

                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                            >
                                <option value="RESPONDER">Responder</option>
                                <option value="LEAD">Lead</option>
                                <option value="OBSERVER">Observer</option>
                            </select>

                            <button
                                onClick={assignUser}
                                disabled={assigning || !selectedUser}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 transition"
                            >
                                {assigning ? "Assigning..." : "Assign"}
                            </button>
                        </div>
                    )}

                    <div className="mt-6 space-y-4">
                        {assignments.length === 0 ? (
                            <p className="text-slate-400">
                                No users assigned yet.
                            </p>
                        ) : (
                            assignments.map((assignment) => (
                                <div
                                    key={assignment.id}
                                    className="border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-medium shrink-0">
                                                {assignment.user_name?.charAt(0).toUpperCase()}
                                            </div>

                                            <div>
                                                <p className="text-white font-medium">
                                                    {assignment.user_name}
                                                </p>

                                                <p className="text-slate-500 text-sm mt-1">
                                                    {assignment.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                                                {assignment.role}
                                            </span>

                                            {(userRole === "admin" || userRole === "lead") && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setAssignmentToRemove(assignment);
                                                        setShowRemoveModal(true);
                                                    }}
                                                    className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            {showRemoveModal && assignmentToRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">

                        <h2 className="text-xl font-semibold text-white">
                            Remove Assigned User?
                        </h2>

                        <p className="text-slate-400 mt-2">
                            Are you sure you want to remove{" "}
                            <span className="text-white font-medium">
                                {assignmentToRemove.user_name}
                            </span>{" "}
                            from this incident?
                        </p>

                        <div className="flex justify-end gap-3 mt-6">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowRemoveModal(false);
                                    setAssignmentToRemove(null);
                                }}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    await removeAssignment(
                                        assignmentToRemove.id
                                    );

                                    setShowRemoveModal(false);
                                    setAssignmentToRemove(null);
                                }}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                            >
                                Remove
                            </button>

                        </div>
                    </div>
                </div>
            )}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">

                        <h2 className="text-xl font-semibold text-white">
                            Delete Incident?
                        </h2>

                        <p className="text-slate-400 mt-2">
                            Are you sure you want to delete this incident?
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-3 mt-6">

                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    await deleteIncident();
                                    setShowDeleteModal(false);
                                }}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:text-red-300 text-white transition"
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </button>

                        </div>
                    </div>
                </div>
            )}
            {showStatusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">

                        <h2 className="text-xl font-semibold text-white">
                            Change Incident Status?
                        </h2>

                        <p className="text-slate-400 mt-2">
                            Are you sure you want to change the status to{" "}
                            <span className="text-white font-medium">
                                {selectedStatus}
                            </span>
                            ?
                        </p>

                        <div className="flex justify-end gap-3 mt-6">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setSelectedStatus("");
                                }}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    await updateStatus(selectedStatus);
                                    setShowStatusModal(false);
                                    setSelectedStatus("");
                                }}
                                disabled={updating}
                                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:text-green-300 text-white transition"
                            >
                                {updating ? "Updating..." : "Confirm"}
                            </button>

                        </div>
                    </div>
                </div>
            )}
            {showCommentDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">

                        <h2 className="text-xl font-semibold text-white">
                            Delete Comment?
                        </h2>

                        <p className="text-slate-400 mt-2">
                            Are you sure you want to delete this comment?
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-3 mt-6">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowCommentDeleteModal(false);
                                    setCommentToDelete(null);
                                }}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    if (commentToDelete) {
                                        await deleteComment(commentToDelete.id);
                                    }

                                    setShowCommentDeleteModal(false);
                                    setCommentToDelete(null);
                                }}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                            >
                                Delete
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </main>
    );

}