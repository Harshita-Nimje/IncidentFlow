"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import socket from "../../../socket";
import { useOrganization } from "../../../context/OrganizationContext";

export default function IncidentDetails() {
    const params = useParams();
    const router = useRouter();
    const { activeOrganization } = useOrganization();

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
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${params.id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        status: newStatus,
                        organization_id: incident.organization_id
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
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${params.id}?organization_id=${encodeURIComponent(incident.organization_id)}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("Failed to delete incident:", data.message);
                return false;
            }

            router.push("/incidents");
            return true;

        } catch (error) {
            console.error("Error deleting incident:", error);
            return false;
        } finally {
            setDeleting(false);
        }
    };

    const refreshTimeline = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidents/${params.id}/timeline?organization_id=${encodeURIComponent(activeOrganization.id)}`,
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
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${params.id}?organization_id=${encodeURIComponent(activeOrganization.id)}`,
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
        if (!newComment.trim()) return;

        try {
            setAddingComment(true);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        incident_id: params.id,
                        message: newComment,
                        organization_id: activeOrganization.id
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
                `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}?organization_id=${encodeURIComponent(activeOrganization.id)}`,
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
        if (!selectedUser) return;

        try {
            setAssigning(true);

            const response = await fetch(
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
                        role: selectedRole,
                        organization_id: activeOrganization.id
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
                `${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${assignmentId}?organization_id=${encodeURIComponent(activeOrganization.id)}`,
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
        setLoading(true);
        setIncident(null);
        setTimeline([]);
        setComments([]);
        setAssignments([]);
        setUsers([]);
        setSelectedUser("");

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        const isPlatformAdmin = storedUser.role === "platform_admin";

        if (!activeOrganization?.id && !isPlatformAdmin) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchIncident = async () => {
            let incidentLoaded = false;

            try {
                const token = localStorage.getItem("token");
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                const isPlatformAdmin = user.role === "platform_admin";

                if (token) {
                    const decoded = JSON.parse(atob(token.split(".")[1]));
                    setUserRole(
                        user.role === "platform_admin"
                            ? "platform_admin"
                            : activeOrganization?.role?.toLowerCase() || "member"
                    );
                    setCurrentUser(decoded);
                }

                const headers = {
                    Authorization: `Bearer ${token}`
                };

                const signal = controller.signal;
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;

                const organizationQuery = isPlatformAdmin
                    ? ""
                    : `?organization_id=${encodeURIComponent(activeOrganization.id)}`;

                const response = await fetch(
                    `${apiUrl}/api/incidents/${params.id}${organizationQuery}`,
                    { headers, signal }
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch incident details");
                }

                const data = await response.json();
                setIncident(data.incident || null);
                incidentLoaded = !!data.incident;

                const timelineResponse = await fetch(
                    `${apiUrl}/api/incidents/${params.id}/timeline${organizationQuery}`,
                    { headers, signal }
                );

                if (!timelineResponse.ok) {
                    throw new Error("Failed to fetch incident timeline");
                }

                const timelineData = await timelineResponse.json();
                setTimeline(timelineData.timeline || []);

                const commentsResponse = await fetch(
                    `${apiUrl}/api/comments/${params.id}${organizationQuery}`,
                    { headers, signal }
                );

                if (!commentsResponse.ok) {
                    throw new Error("Failed to fetch comments");
                }

                const commentsData = await commentsResponse.json();
                setComments(commentsData.comments || []);

                const assignmentsResponse = await fetch(
                    `${apiUrl}/api/assignments/${params.id}${organizationQuery}`,
                    { headers, signal }
                );

                if (!assignmentsResponse.ok) {
                    throw new Error("Failed to fetch assignments");
                }

                const assignmentsData = await assignmentsResponse.json();
                setAssignments(assignmentsData.assignments || []);

                const incidentOrganizationId = data.incident.organization_id;

                const usersResponse = await fetch(
                    `${apiUrl}/api/organizations/${incidentOrganizationId}/members`,
                    { headers, signal }
                );

                if (!usersResponse.ok) {
                    throw new Error("Failed to fetch organization members");
                }

                const usersData = await usersResponse.json();
                setUsers(usersData.members || []);

                setLastUpdated(new Date());

            } catch (error) {
                if (error.name === "AbortError") return;

                console.error("Error fetching incident:", error);

                if (!incidentLoaded) {
                    setIncident(null);
                }

            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchIncident();

        return () => {
            controller.abort();
        };

    }, [params.id, activeOrganization?.id]);

    useEffect(() => {
        if (!activeOrganization?.id) return;

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

            socket.emit("join_incident", {
                incident_id: params.id,
                organization_id: activeOrganization.id
            });
        };

        socket.on("connect", handleConnect);
        socket.on("user_assigned", handleUserAssigned);
        socket.on("user_unassigned", handleUserUnassigned);
        socket.on("comment_added", handleCommentAdded);
        socket.on("comment_deleted", handleCommentDeleted);
        socket.on("incident_status_updated", handleStatusUpdate);

        return () => {
            socket.emit("leave_incident", {
                incident_id: params.id,
                organization_id: activeOrganization.id
            });

            socket.off("connect", handleConnect);
            socket.off("user_assigned", handleUserAssigned);
            socket.off("user_unassigned", handleUserUnassigned);
            socket.off("comment_added", handleCommentAdded);
            socket.off("comment_deleted", handleCommentDeleted);
            socket.off("incident_status_updated", handleStatusUpdate);
        };
    }, [params.id, activeOrganization?.id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-[#E9E9DF] p-6 text-[#4B1B27] md:p-8">
                <div className="text-center">
                    <p className="text-lg font-semibold text-[#4B1B27]">
                        Loading incident...
                    </p>
                    <p className="mt-2 text-sm text-[#938785]">
                        Fetching incident details
                    </p>
                </div>
            </main>
        );
    }

    if (!incident) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#E9E9DF] p-8 text-[#4B1B27]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Incident not found</h1>
                    <p className="mt-2 text-[#756B69]">
                        The incident you are looking for does not exist.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.href = "/"}
                        className="mt-6 rounded-xl bg-[#4B1B27] px-5 py-2.5 text-sm font-semibold text-[#FFFEFA] transition hover:bg-[#35151F]"
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
                return "bg-green-500/10 text-green-700 border border-green-600/20";
            case "MONITORING":
                return "bg-yellow-500/10 text-yellow-700 border border-yellow-600/20";
            case "MITIGATING":
                return "bg-orange-500/10 text-orange-700 border border-orange-600/20";
            case "IDENTIFIED":
                return "bg-blue-500/10 text-blue-700 border border-blue-600/20";
            default:
                return "bg-red-500/10 text-red-700 border border-red-600/20";
        }
    };

    const getSeverityClass = (severity) => {
        switch (severity) {
            case "SEV-1":
                return "bg-red-500/10 text-red-700 border border-red-600/20";
            case "SEV-2":
                return "bg-orange-500/10 text-orange-700 border border-orange-600/20";
            case "SEV-3":
                return "bg-yellow-500/10 text-yellow-700 border border-yellow-600/20";
            case "SEV-4":
                return "bg-green-500/10 text-green-700 border border-green-600/20";
            default:
                return "bg-[#E9E9DF] text-[#756B69]";
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
        <main className="min-h-screen overflow-x-hidden bg-[#E9E9DF] text-[#4B1B27]">
            <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-9 lg:py-9">

                {/* TOP NAVIGATION */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/incidents")}
                        className="group inline-flex items-center gap-2 text-xs font-semibold text-[#756B69] transition hover:text-[#FF6B1A]"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#4B1B27]/10 bg-[#FFFEFA] text-[#4B1B27] transition group-hover:border-[#FF6B1A]/40 group-hover:bg-[#4B1B27] group-hover:text-[#FF8A48]">
                            <span className="text-lg">←</span>
                        </span>
                        Back to incidents
                    </button>

                    <div className="flex items-center gap-2">
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
                            className="inline-flex items-center gap-2 rounded-xl border border-[#4B1B27]/15 bg-[#FFFEFA] px-4 py-2.5 text-xs font-semibold text-[#4B1B27] transition hover:border-[#FF6B1A]/50 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className={refreshing ? "animate-spin" : ""}>↻</span>
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>

                        {(userRole === "platform_admin" || userRole === "admin") && (
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="rounded-xl border border-red-600/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:border-red-600/40 hover:bg-red-500/15"
                            >
                                Delete incident
                            </button>
                        )}
                    </div>
                </div>

                {/* INCIDENT HEADER */}
                <section className="relative mb-7 overflow-hidden rounded-[28px] border border-[#4B1B27] bg-[#4B1B27] text-[#FFFEFA] shadow-[0_18px_45px_rgba(75,27,39,0.12)]">
                    <div className="pointer-events-none absolute -right-24 -top-36 h-80 w-80 rounded-full bg-[#FF6B1A]/15 blur-[100px]" />
                    <div className="pointer-events-none absolute -bottom-40 -left-20 h-72 w-72 rounded-full bg-[#FF8A48]/10 blur-[90px]" />

                    <div className="relative p-5 sm:p-7 lg:p-9">
                        <div className="mb-6 flex flex-wrap items-center gap-2">
                            <span className="rounded-lg border border-[#FF8A48]/30 bg-[#FF6B1A]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-[#FF8A48]">
                                Incident #{incident.id}
                            </span>
                            <span className="text-[10px] text-white/30">/</span>
                            <span className="text-[10px] font-semibold uppercase tracking-[1.5px] text-[#D7DDD2]/65">
                                Incident details
                            </span>
                        </div>

                        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-start">
                            <div className="min-w-0 max-w-3xl">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[#FF8A48]">
                                    Incident overview
                                </p>
                                <h1 className="break-words text-2xl font-bold leading-tight tracking-[-0.8px] text-[#FFFEFA] sm:text-3xl lg:text-[36px]">
                                    {incident.title}
                                </h1>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#E9E9DF]/75">
                                    {incident.description}
                                </p>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                <span className={`rounded-lg px-3 py-2 text-[11px] font-bold ${getSeverityClass(incident.severity)}`}>
                                    {incident.severity}
                                </span>
                                <span className={`rounded-lg px-3 py-2 text-[11px] font-bold ${getStatusClass(incident.status)}`}>
                                    {incident.status}
                                </span>
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 gap-5 border-t border-white/15 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[1.6px] text-[#FF8A48]">
                                    Reported by
                                </p>
                                <p className="mt-2 text-xs font-semibold text-[#FFFEFA]">
                                    {incident.creator_name}
                                </p>
                                <p className="mt-1 break-all text-[11px] text-[#E9E9DF]/60">
                                    {incident.creator_email}
                                </p>
                            </div>

                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[1.6px] text-[#FF8A48]">
                                    Created at
                                </p>
                                <p className="mt-2 text-xs font-semibold text-[#FFFEFA]">
                                    {new Date(incident.created_at).toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[1.6px] text-[#FF8A48]">
                                    Resolution
                                </p>
                                <p className="mt-2 text-xs font-semibold text-[#FFFEFA]">
                                    {incident.resolved_at
                                        ? new Date(incident.resolved_at).toLocaleString()
                                        : "Not resolved"}
                                </p>
                            </div>
                        </div>

                        {lastUpdated && (
                            <div className="mt-5 flex items-center gap-2 text-[10px] text-[#D7DDD2]/65">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF8A48]" />
                                Last refreshed at {lastUpdated.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </section>

                {/* STATUS DESCRIPTION */}
                <div className="mb-8 flex items-start gap-3 rounded-2xl border border-[#FF6B1A]/20 bg-[#FF6B1A]/[0.07] px-4 py-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF6B1A]/15 font-bold text-[#C94F0C]">
                        <span className="text-sm">i</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#4B1B27]">
                            Current incident state
                        </p>
                        <p className="mt-1 text-xs leading-6 text-[#756B69]">
                            {getStatusDescription(incident.status)}
                        </p>
                    </div>
                </div>

                {/* STATUS WORKFLOW */}
                {(userRole === "platform_admin" ||
                    userRole === "admin" ||
                    userRole === "lead") && (
                        <section className="mb-8 rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] p-5 shadow-[0_4px_18px_rgba(75,27,39,0.035)] sm:p-7">
                            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#FF6B1A]">
                                        Response workflow
                                    </p>
                                    <h2 className="mt-2 text-lg font-bold tracking-tight text-[#4B1B27]">
                                        Incident lifecycle
                                    </h2>
                                    <p className="mt-1 text-xs text-[#938785]">
                                        Move this incident through the response process.
                                    </p>
                                </div>

                                <span className="rounded-lg border border-[#4B1B27]/10 bg-[#E9E9DF] px-3 py-2 text-[10px] font-semibold text-[#4B1B27]">
                                    {incident.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                                {statusFlow.map((status) => {
                                    const currentIndex = statusFlow.indexOf(incident.status);
                                    const statusIndex = statusFlow.indexOf(status);
                                    const isCurrent = status === incident.status;
                                    const isNext = statusIndex === currentIndex + 1;
                                    const isCompleted = statusIndex < currentIndex;

                                    return (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => {
                                                setSelectedStatus(status);
                                                setShowStatusModal(true);
                                            }}
                                            disabled={updating || !isNext}
                                            className={`relative flex min-h-[75px] items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${isCurrent
                                                ? "border-[#FF6B1A]/50 bg-[#FF6B1A]/10 shadow-sm shadow-[#FF6B1A]/10"
                                                : isNext
                                                    ? "border-green-600/20 bg-green-500/[0.05] hover:border-green-600/40 hover:bg-green-500/[0.09]"
                                                    : isCompleted
                                                        ? "border-[#4B1B27]/10 bg-[#E9E9DF]/70"
                                                        : "border-[#4B1B27]/[0.07] bg-[#FFFEFA] opacity-50"
                                                } disabled:cursor-not-allowed`}
                                        >
                                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isCurrent
                                                ? "bg-[#FF6B1A] text-white"
                                                : isNext
                                                    ? "bg-green-600/10 text-green-700"
                                                    : isCompleted
                                                        ? "bg-[#4B1B27]/10 text-[#756B69]"
                                                        : "bg-[#E9E9DF] text-[#938785]"
                                                }`}>
                                                {isCompleted ? "✓" : statusIndex + 1}
                                            </span>

                                            <span className="min-w-0">
                                                <span className="block break-words text-[10px] font-bold text-[#4B1B27]">
                                                    {status}
                                                </span>
                                                <span className="mt-1 block text-[9px] text-[#938785]">
                                                    {isCurrent
                                                        ? "Current stage"
                                                        : isNext
                                                            ? "Next action"
                                                            : isCompleted
                                                                ? "Completed"
                                                                : "Upcoming"}
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 items-start gap-7 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">

                    {/* LEFT COLUMN */}
                    <div className="min-w-0 space-y-7">

                        {/* INCIDENT TIMELINE */}
                        <section className="rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] p-5 shadow-[0_4px_18px_rgba(75,27,39,0.035)] sm:p-7">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[1.7px] text-[#FF6B1A]">
                                        Activity stream
                                    </p>
                                    <h2 className="mt-2 text-lg font-bold text-[#4B1B27]">
                                        Incident timeline
                                    </h2>
                                    <p className="mt-1 text-xs text-[#938785]">
                                        Status changes and recorded incident events.
                                    </p>
                                </div>

                                <span className="rounded-lg border border-[#4B1B27]/10 bg-[#E9E9DF] px-3 py-2 text-[10px] font-semibold text-[#756B69]">
                                    {timeline.length} events
                                </span>
                            </div>

                            <div className="mt-7">
                                {timeline.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-[#4B1B27]/20 bg-[#E9E9DF]/40 py-10 text-center">
                                        <p className="text-sm font-medium text-[#756B69]">
                                            No timeline events yet.
                                        </p>
                                        <p className="mt-1 text-xs text-[#938785]">
                                            Incident activity will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative space-y-0">
                                        <div className="absolute bottom-5 left-[13px] top-5 w-px bg-gradient-to-b from-[#FF6B1A]/50 via-[#4B1B27]/10 to-transparent" />

                                        {timeline.map((event, index) => (
                                            <div
                                                key={event.id}
                                                className="relative flex gap-4 pb-6 last:pb-0"
                                            >
                                                <div className="relative z-10 mt-1 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border border-[#FF6B1A]/30 bg-[#FF6B1A]/10">
                                                    <span className="h-2 w-2 rounded-full bg-[#FF6B1A]" />
                                                </div>

                                                <div className="min-w-0 flex-1 rounded-xl border border-[#4B1B27]/[0.07] bg-[#E9E9DF]/45 p-4 transition hover:border-[#FF6B1A]/30 hover:bg-[#E9E9DF]/70">
                                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                                        <span className="rounded-md border border-[#FF6B1A]/20 bg-[#FF6B1A]/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#C94F0C]">
                                                            {event.event_type}
                                                        </span>
                                                        <span className="text-[10px] text-[#938785]">
                                                            {new Date(event.created_at).toLocaleString()}
                                                        </span>
                                                    </div>

                                                    <p className="break-words text-sm font-medium leading-6 text-[#4B1B27]">
                                                        {event.message}
                                                    </p>

                                                    <p className="mt-3 text-[10px] text-[#938785]">
                                                        Recorded by{" "}
                                                        <span className="font-semibold text-[#756B69]">
                                                            {event.user_name || "Unknown user"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* COMMENTS */}
                        <section className="rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] p-5 shadow-[0_4px_18px_rgba(75,27,39,0.035)] sm:p-7">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[1.7px] text-[#FF6B1A]">
                                    Team communication
                                </p>
                                <h2 className="mt-2 text-lg font-bold text-[#4B1B27]">
                                    Discussion
                                </h2>
                                <p className="mt-1 text-xs text-[#938785]">
                                    Share updates and collaborate with the response team.
                                </p>
                            </div>

                            <div className="mt-6 rounded-xl border border-[#4B1B27]/10 bg-[#E9E9DF]/60 p-3 sm:p-4">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey && newComment.trim()) {
                                            e.preventDefault();
                                            if (!addingComment) addComment();
                                        }
                                    }}
                                    placeholder="Write an update or comment..."
                                    maxLength={500}
                                    className="w-full bg-transparent px-1 py-2 text-sm text-[#4B1B27] outline-none placeholder:text-[#A99B97]"
                                />

                                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#4B1B27]/10 pt-3">
                                    <span className="text-[10px] text-[#938785]">
                                        {newComment.length}/500 characters
                                    </span>

                                    <button
                                        type="button"
                                        onClick={addComment}
                                        disabled={addingComment || !newComment.trim()}
                                        className="rounded-xl bg-[#4B1B27] px-4 py-2.5 text-[11px] font-semibold text-[#FFFEFA] transition hover:bg-[#35151F] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {addingComment ? "Posting..." : "Post update →"}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                {comments.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-[#4B1B27]/20 bg-[#E9E9DF]/40 py-9 text-center">
                                        <p className="text-sm font-medium text-[#756B69]">
                                            No comments yet.
                                        </p>
                                        <p className="mt-1 text-xs text-[#938785]">
                                            Start the conversation with your team.
                                        </p>
                                    </div>
                                ) : (
                                    comments.map((comment) => (
                                        <div
                                            key={comment.id}
                                            className="rounded-xl border border-[#4B1B27]/[0.07] bg-[#E9E9DF]/45 p-4 transition hover:border-[#FF6B1A]/30"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FF6B1A]/20 bg-[#FF6B1A]/10 text-xs font-bold text-[#C94F0C]">
                                                    {(comment.user_name || "U").charAt(0).toUpperCase()}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="text-xs font-semibold text-[#4B1B27]">
                                                            {comment.user_name || "Unknown user"}
                                                        </p>
                                                        <p className="text-[10px] text-[#938785]">
                                                            {new Date(comment.created_at).toLocaleString()}
                                                        </p>
                                                    </div>

                                                    <p className="mt-2 break-words text-sm leading-6 text-[#756B69]">
                                                        {comment.message}
                                                    </p>

                                                    {currentUser &&
                                                        (
                                                            Number(comment.user_id) === Number(currentUser.id) ||
                                                            currentUser.role?.toLowerCase() === "admin"
                                                        ) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCommentToDelete(comment);
                                                                    setShowCommentDeleteModal(true);
                                                                }}
                                                                className="mt-3 text-[10px] font-semibold text-red-700 transition hover:text-red-500"
                                                            >
                                                                Delete comment
                                                            </button>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN */}
                    <aside className="min-w-0 space-y-7">

                        {/* ASSIGNED USERS */}
                        <section className="rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] p-5 shadow-[0_4px_18px_rgba(75,27,39,0.035)] sm:p-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[1.7px] text-[#FF6B1A]">
                                    Response team
                                </p>
                                <h2 className="mt-2 text-lg font-bold text-[#4B1B27]">
                                    Assigned members
                                </h2>
                                <p className="mt-1 text-xs text-[#938785]">
                                    People responsible for this incident.
                                </p>
                            </div>

                            {assignmentError && (
                                <p className="mt-4 rounded-xl border border-red-600/20 bg-red-500/[0.07] p-3 text-xs text-red-700">
                                    {assignmentError}
                                </p>
                            )}

                            {assignmentSuccess && (
                                <p className="mt-4 rounded-xl border border-green-600/20 bg-green-500/[0.07] p-3 text-xs text-green-700">
                                    {assignmentSuccess}
                                </p>
                            )}

                            {(userRole === "admin" || userRole === "lead") && (
                                <div className="mt-5 space-y-3">
                                    <select
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-[#4B1B27]/15 bg-[#E9E9DF]/70 px-3 text-xs font-medium text-[#4B1B27] outline-none transition focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A]/10"
                                    >
                                        <option value="">Select team member</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name?.trim() || user.email || `User #${user.id}`}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="flex gap-2">
                                        <select
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="h-11 min-w-0 flex-1 rounded-xl border border-[#4B1B27]/15 bg-[#E9E9DF]/70 px-3 text-xs font-medium text-[#4B1B27] outline-none focus:border-[#FF6B1A]"
                                        >
                                            <option value="RESPONDER">Responder</option>
                                            <option value="LEAD">Lead</option>
                                            <option value="OBSERVER">Observer</option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={assignUser}
                                            disabled={assigning || !selectedUser}
                                            className="rounded-xl bg-[#4B1B27] px-4 text-[11px] font-semibold text-[#FFFEFA] transition hover:bg-[#35151F] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {assigning ? "..." : "Assign"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 border-t border-[#4B1B27]/10 pt-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-[1.3px] text-[#938785]">
                                        Team members
                                    </span>
                                    <span className="rounded-lg bg-[#E9E9DF] px-2.5 py-1 text-[10px] font-semibold text-[#4B1B27]">
                                        {assignments.length} assigned
                                    </span>
                                </div>

                                {assignments.length === 0 ? (
                                    <p className="py-5 text-center text-xs text-[#938785]">
                                        No users assigned yet.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {assignments.map((assignment) => (
                                            <div
                                                key={assignment.id}
                                                className="flex items-center gap-3 rounded-xl border border-[#4B1B27]/[0.07] bg-[#E9E9DF]/45 p-3"
                                            >
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FF6B1A]/20 bg-[#FF6B1A]/10 text-xs font-bold text-[#C94F0C]">
                                                    {(assignment.user_name || "U").charAt(0).toUpperCase()}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-[#4B1B27]">
                                                        {assignment.user_name || "Unknown user"}
                                                    </p>
                                                    <p className="mt-1 truncate text-[10px] text-[#938785]">
                                                        {assignment.email}
                                                    </p>
                                                    <span className="mt-2 inline-block rounded-md border border-[#FF6B1A]/20 bg-[#FF6B1A]/[0.08] px-2 py-1 text-[9px] font-bold text-[#C94F0C]">
                                                        {assignment.role}
                                                    </span>
                                                </div>

                                                {(userRole === "admin" || userRole === "lead") && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAssignmentToRemove(assignment);
                                                            setShowRemoveModal(true);
                                                        }}
                                                        className="shrink-0 rounded-lg px-2 py-2 text-[10px] font-semibold text-red-700 transition hover:bg-red-500/10"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* INCIDENT INFORMATION */}
                        <section className="rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] p-5 shadow-[0_4px_18px_rgba(75,27,39,0.035)] sm:p-6">
                            <p className="text-[10px] font-bold uppercase tracking-[1.7px] text-[#FF6B1A]">
                                Operational details
                            </p>

                            <h2 className="mt-2 text-lg font-bold text-[#4B1B27]">
                                Incident information
                            </h2>

                            <div className="mt-5 space-y-4">
                                <div className="flex items-center justify-between gap-3 border-b border-[#4B1B27]/[0.08] pb-4">
                                    <span className="text-xs text-[#938785]">Incident ID</span>
                                    <span className="text-xs font-semibold text-[#4B1B27]">
                                        #{incident.id}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 border-b border-[#4B1B27]/[0.08] pb-4">
                                    <span className="text-xs text-[#938785]">Severity</span>
                                    <span className="text-xs font-semibold text-[#4B1B27]">
                                        {incident.severity}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 border-b border-[#4B1B27]/[0.08] pb-4">
                                    <span className="text-xs text-[#938785]">Status</span>
                                    <span className="text-xs font-semibold text-[#4B1B27]">
                                        {incident.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs text-[#938785]">Comments</span>
                                    <span className="text-xs font-semibold text-[#4B1B27]">
                                        {comments.length}
                                    </span>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>

            {/* REMOVE ASSIGNMENT MODAL */}
            {showRemoveModal && assignmentToRemove && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#21151A]/75 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[24px] border border-[#4B1B27]/15 bg-[#FFFEFA] p-6 shadow-2xl">
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-600/20 bg-red-500/10 text-red-700">
                            <span>!</span>
                        </div>

                        <h2 className="text-lg font-bold text-[#4B1B27]">
                            Remove team member?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#756B69]">
                            Are you sure you want to remove{" "}
                            <span className="font-semibold text-[#4B1B27]">
                                {assignmentToRemove.user_name}
                            </span>{" "}
                            from this incident?
                        </p>

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRemoveModal(false);
                                    setAssignmentToRemove(null);
                                }}
                                className="rounded-xl border border-[#4B1B27]/15 bg-[#E9E9DF] px-4 py-2.5 text-xs font-semibold text-[#4B1B27] transition hover:bg-[#D7DDD2]"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    await removeAssignment(assignmentToRemove.id);
                                    setShowRemoveModal(false);
                                    setAssignmentToRemove(null);
                                }}
                                className="rounded-xl bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-800"
                            >
                                Remove member
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE INCIDENT MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#21151A]/75 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[24px] border border-[#4B1B27]/15 bg-[#FFFEFA] p-6 shadow-2xl">
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-600/20 bg-red-500/10 text-red-700">
                            !
                        </div>

                        <h2 className="text-lg font-bold text-[#4B1B27]">
                            Delete incident?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#756B69]">
                            Are you sure you want to delete this incident? This action cannot be undone.
                        </p>

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-xl border border-[#4B1B27]/15 bg-[#E9E9DF] px-4 py-2.5 text-xs font-semibold text-[#4B1B27] transition hover:bg-[#D7DDD2]"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    const deleted = await deleteIncident();

                                    if (deleted) {
                                        setShowDeleteModal(false);
                                    }
                                }}
                                disabled={deleting}
                                className="rounded-xl bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
                            >
                                {deleting ? "Deleting..." : "Delete incident"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STATUS UPDATE MODAL */}
            {showStatusModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#21151A]/75 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[24px] border border-[#4B1B27]/15 bg-[#FFFEFA] p-6 shadow-2xl">
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[#FF6B1A]/25 bg-[#FF6B1A]/10 text-[#C94F0C]">
                            ↗
                        </div>

                        <h2 className="text-lg font-bold text-[#4B1B27]">
                            Update incident status?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#756B69]">
                            Are you sure you want to move this incident to{" "}
                            <span className="font-semibold text-[#C94F0C]">
                                {selectedStatus}
                            </span>
                            ?
                        </p>

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setSelectedStatus("");
                                }}
                                className="rounded-xl border border-[#4B1B27]/15 bg-[#E9E9DF] px-4 py-2.5 text-xs font-semibold text-[#4B1B27] transition hover:bg-[#D7DDD2]"
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
                                className="rounded-xl bg-[#4B1B27] px-4 py-2.5 text-xs font-semibold text-[#FFFEFA] transition hover:bg-[#35151F] disabled:opacity-50"
                            >
                                {updating ? "Updating..." : "Confirm update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE COMMENT MODAL */}
            {showCommentDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#21151A]/75 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[24px] border border-[#4B1B27]/15 bg-[#FFFEFA] p-6 shadow-2xl">
                        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-600/20 bg-red-500/10 text-red-700">
                            !
                        </div>

                        <h2 className="text-lg font-bold text-[#4B1B27]">
                            Delete comment?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#756B69]">
                            Are you sure you want to delete this comment? This action cannot be undone.
                        </p>

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCommentDeleteModal(false);
                                    setCommentToDelete(null);
                                }}
                                className="rounded-xl border border-[#4B1B27]/15 bg-[#E9E9DF] px-4 py-2.5 text-xs font-semibold text-[#4B1B27] transition hover:bg-[#D7DDD2]"
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
                                className="rounded-xl bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-800"
                            >
                                Delete comment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
