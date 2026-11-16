"use client";

import { useOrganization } from "../../context/OrganizationContext";
import { useEffect, useState } from "react";
import {
  Activity,
  ShieldCheck,
  Bell,
  Server,
  Search,
  X,
} from "lucide-react";
import socket from "../../socket";
import { useRouter } from "next/navigation";

export default function Home() {
  const { activeOrganization } = useOrganization();
  const [incidents, setIncidents] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [expandedOrganizations, setExpandedOrganizations] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("");
  const [services, setServices] = useState([]);
  const router = useRouter();
  const [sortOrder, setSortOrder] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [incidentSearch, setIncidentSearch] = useState("");
  const incidentsPerPage = 6;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const currentUser = JSON.parse(storedUser);
        setUserRole(currentUser.role || "");
      } catch (error) {
        console.error("Error reading user:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (userRole !== "platform_admin") {
      setOrganizations([]);
      return;
    }

    const fetchOrganizations = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch organizations");
        }

        const data = await response.json();
        setOrganizations(data.organizations || []);
      } catch (error) {
        console.error("Error fetching organizations:", error);
        setOrganizations([]);
      }
    };

    fetchOrganizations();
  }, [userRole]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, severityFilter, statusFilter, environmentFilter, sortOrder]);

  useEffect(() => {
    if (!activeOrganization?.id && userRole !== "platform_admin") {
      setNotifications([]);
      return;
    }

    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        const organizationId = activeOrganization?.id
          ? `?organization_id=${encodeURIComponent(activeOrganization.id)}`
          : "";

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notifications${organizationId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch notifications (${response.status})`);
        }

        const data = await response.json();

        if (!cancelled) {
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching notifications:", error);
          setNotifications([]);
        }
      }
    };

    fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [activeOrganization?.id, userRole]);

  useEffect(() => {
    if (!activeOrganization?.id && userRole !== "platform_admin") return;

    if (!socket.connected) {
      socket.connect();
    }

    const removeDeletedIncident = (incidentId) => {
      if (!incidentId) return;

      setIncidents((prev) =>
        prev.filter(
          (incident) => String(incident.id) !== String(incidentId)
        )
      );
    };

    const handleNotificationCreated = (data) => {
      const storedUser = localStorage.getItem("user");
      const currentUser = storedUser
        ? JSON.parse(storedUser)
        : null;

      if (!currentUser || Number(data.userId) !== Number(currentUser.id)) {
        return;
      }

      if (data.organizationId === null) {
        if (userRole !== "platform_admin") {
          return;
        }
      } else if (
        userRole !== "platform_admin" &&
        Number(data.organizationId) !== Number(activeOrganization?.id)
      ) {
        return;
      }

      if (!data.notification) return;

      setNotifications((prev) => {
        const alreadyExists = prev.some(
          (notification) =>
            String(notification.id) === String(data.notification.id)
        );

        if (alreadyExists) return prev;

        return [data.notification, ...prev];
      });

      if (data.notification.type === "INCIDENT_DELETED") {
        const deletedIncidentId =
          data.incidentId ??
          data.notification.deletedIncidentId;

        removeDeletedIncident(deletedIncidentId);
      }
    };

    const handleIncidentDeleted = (data) => {

      if (
        Number(data.organizationId) ===
        Number(activeOrganization?.id)
      ) {
        console.log("✅ Removing incident:", data.incidentId);

        setIncidents((prev) => {
          const updated = prev.filter(
            (incident) =>
              String(incident.id) !== String(data.incidentId)
          );

          console.log("Incidents before:", prev.length);
          console.log("Incidents after:", updated.length);

          return updated;
        });
      }
    };

    const handleStatusUpdate = (data) => {
      setIncidents((prev) =>
        prev.map((incident) =>
          String(incident.id) === String(data.incidentId)
            ? data.incident
            : incident
        )
      );
    };

    const handleIncidentCreated = (data) => {
      if (
        Number(data.organizationId) !==
        Number(activeOrganization.id)
      ) {
        return;
      }

      if (!data.incident) return;

      setIncidents((prev) => {
        const alreadyExists = prev.some(
          (incident) =>
            String(incident.id) === String(data.incident.id)
        );

        if (alreadyExists) return prev;

        return [data.incident, ...prev];
      });
    };

    socket.on("notification_created", handleNotificationCreated);
    socket.on("incident_deleted", handleIncidentDeleted);
    socket.on("incident_status_updated", handleStatusUpdate);
    socket.on("incident_created", handleIncidentCreated);

    return () => {
      socket.off("notification_created", handleNotificationCreated);
      socket.off("incident_deleted", handleIncidentDeleted);
      socket.off("incident_status_updated", handleStatusUpdate);
      socket.off("incident_created", handleIncidentCreated);
    };
  }, [activeOrganization?.id, userRole]);

  useEffect(() => {
    if (!userRole) return;

    if (userRole !== "platform_admin" && !activeOrganization?.id) {
      setIncidents([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchIncidents = async () => {
      setLoading(true);

      try {
        const url =
          userRole === "platform_admin"
            ? `${process.env.NEXT_PUBLIC_API_URL}/api/incidents`
            : `${process.env.NEXT_PUBLIC_API_URL}/api/incidents?organization_id=${encodeURIComponent(activeOrganization.id)}`;

        const response = await fetch(url, {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch incidents (${response.status})`);
        }

        const data = await response.json();

        if (!cancelled) {
          setIncidents(data.incidents || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching incidents:", error);
          setIncidents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchIncidents();

    return () => {
      cancelled = true;
    };
  }, [activeOrganization?.id, userRole]);



  useEffect(() => {
    if (!activeOrganization?.id || incidents.length === 0) return;

    const organizationId = activeOrganization.id;

    const joinIncidentRooms = () => {
      incidents.forEach((incident) => {
        socket.emit("join_incident", {
          incident_id: incident.id,
          organization_id: organizationId
        });
      });
    };

    if (socket.connected) {
      joinIncidentRooms();
    }

    socket.on("connect", joinIncidentRooms);

    return () => {
      socket.off("connect", joinIncidentRooms);

      incidents.forEach((incident) => {
        socket.emit("leave_incident", {
          incident_id: incident.id,
          organization_id: organizationId
        });
      });
    };
  }, [incidents, activeOrganization?.id]);

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "SEV-1":
        return "bg-red-500/15 text-red-700 border border-red-500/20";
      case "SEV-2":
        return "bg-orange-500/15 text-orange-700 border border-orange-500/20";
      case "SEV-3":
        return "bg-yellow-500/15 text-yellow-800 border border-yellow-500/20";
      case "SEV-4":
        return "bg-green-500/15 text-green-800 border border-green-500/20";
      default:
        return "bg-[#D7DDD2] text-[#4B1B27]";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "RESOLVED":
        return "bg-green-500/15 text-green-800";
      case "MONITORING":
        return "bg-yellow-500/15 text-yellow-800";
      case "MITIGATING":
        return "bg-orange-500/15 text-orange-800";
      case "IDENTIFIED":
        return "bg-purple-500/15 text-purple-800";
      case "INVESTIGATING":
        return "bg-red-500/15 text-red-700";
      default:
        return "bg-[#D7DDD2] text-[#4B1B27]";
    }
  };

  const activeIncidents = incidents.filter(
    (incident) => incident.status !== "RESOLVED"
  ).length;

  const sev1Incidents = incidents.filter(
    (incident) => incident.severity === "SEV-1"
  ).length;

  const resolvedIncidents = incidents.filter(
    (incident) => incident.status === "RESOLVED"
  ).length;

  if (loading) {
    return (
      <main className="incidents-theme flex min-h-screen items-center justify-center bg-[#E9E9DF] text-[#4B1B27]">
        <div className="mx-auto w-full min-w-0 max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-[#765C61]">
            Loading incidents...
          </p>
          <style jsx global>{`
          .incidents-theme {
            color-scheme: light;
          }
        `}</style>
        </div>
      </main>
    );
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.title?.toLowerCase().includes(incidentSearch.trim().toLowerCase()) ||
      (incident.description || "").toLowerCase().includes(incidentSearch.trim().toLowerCase());

    const matchesSeverity =
      severityFilter === "" ||
      incident.severity === severityFilter;

    const matchesStatus =
      statusFilter === "" ||
      incident.status === statusFilter;

    const matchesEnvironment =
      environmentFilter === "" ||
      incident.environment === environmentFilter;

    return (
      matchesSearch &&
      matchesSeverity &&
      matchesStatus &&
      matchesEnvironment
    );
  });

  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);

    return sortOrder === "newest"
      ? dateB - dateA
      : dateA - dateB;
  });

  const paginatedIncidents = sortedIncidents.slice(
    (currentPage - 1) * incidentsPerPage,
    currentPage * incidentsPerPage
  );

  const startIndex = (currentPage - 1) * incidentsPerPage;

  const groupedIncidents = organizations.map((organization) => ({
    ...organization,
    incidents: sortedIncidents.filter(
      (incident) =>
        Number(incident.organization_id) === Number(organization.id)
    )
  }));

  const organizationsPerPage = 6;

  const paginatedOrganizations = groupedIncidents.slice(
    (currentPage - 1) * organizationsPerPage,
    currentPage * organizationsPerPage
  );

  const organizationTotalPages = Math.ceil(
    groupedIncidents.length / organizationsPerPage
  );

  const toggleOrganization = (organizationId) => {
    setExpandedOrganizations((prev) =>
      prev.includes(organizationId)
        ? prev.filter((id) => id !== organizationId)
        : [...prev, organizationId]
    );
  };

  const totalPages = Math.ceil(
    sortedIncidents.length / incidentsPerPage
  );

  return (
    <main className="incidents-theme min-h-screen w-full min-w-0 max-w-full overflow-x-clip bg-[#E9E9DF] text-[#35151F]">
      <style jsx global>{`


        .incidents-theme {
          color-scheme: light;
          --if-burgundy: #4B1B27;
          --if-deep: #35151F;
          --if-orange: #FF6B1A;
          --if-sage: #D7DDD2;
          --if-cream: #E9E9DF;
          --if-muted: #806D70;
          --if-border: rgba(75, 27, 39, 0.14);
          --if-panel: #F5F3EB;
        }

        .incidents-theme [class*="border-[#202c40]"],
        .incidents-theme [class*="border-[#253146]"],
        .incidents-theme [class*="border-[#29364a]"],
        .incidents-theme [class*="border-[#202b3d]"],
        .incidents-theme [class*="border-white/"] {
          border-color: var(--if-border) !important;
        }

        .incidents-theme [class*="bg-[#0D1523]"],
        .incidents-theme [class*="bg-[#111a29]"],
        .incidents-theme [class*="bg-[#101a2a]"],
        .incidents-theme [class*="bg-[#111C2D]"],
        .incidents-theme [class*="bg-[#080F1C]"] {
          background-color: var(--if-panel) !important;
        }

        .incidents-theme [class*="bg-[#182336]"],
        .incidents-theme [class*="bg-[#1b273a]"] {
          background-color: #D7DDD2 !important;
        }

        .incidents-theme [class*="bg-blue-500"],
        .incidents-theme [class*="bg-blue-600"] {
          background-color: var(--if-orange) !important;
        }

        .incidents-theme [class*="text-blue-"],
        .incidents-theme [class*="text-amber-"] {
          color: var(--if-orange) !important;
        }

        .incidents-theme [class*="border-blue-"] {
          border-color: rgba(255, 107, 26, 0.35) !important;
        }

        .incidents-theme [class*="ring-blue-"] {
          --tw-ring-color: rgba(255, 107, 26, 0.2) !important;
        }

        .incidents-theme [class*="from-blue-"] {
          --tw-gradient-from: rgba(255, 107, 26, 0.07) var(--tw-gradient-from-position) !important;
        }

        .incidents-theme [class*="text-white"],
        .incidents-theme [class*="text-slate-100"],
        .incidents-theme [class*="text-slate-200"],
        .incidents-theme [class*="text-slate-300"] {
          color: var(--if-deep) !important;
        }

        .incidents-theme [class*="text-slate-400"],
        .incidents-theme [class*="text-slate-500"] {
          color: #806D70 !important;
        }

        .incidents-theme [class*="text-slate-600"],
        .incidents-theme [class*="text-slate-700"] {
          color: #9A8587 !important;
        }

        .incidents-theme input,
        .incidents-theme select {
          background-color: #F7F5EF !important;
          color: var(--if-deep) !important;
          border-color: var(--if-border) !important;
        }

        .incidents-theme input::placeholder {
          color: #9A8587 !important;
        }

        .incidents-theme select option {
          background: #F7F5EF;
          color: var(--if-deep);
        }

        .incidents-theme button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .incidents-theme button[class*="bg-blue-"]:hover {
          background-color: #E85A0B !important;
        }

        .incidents-theme [class*="hover:bg-white/"]:hover,
        .incidents-theme [class*="hover:bg-[#111"]:hover {
          background-color: rgba(75, 27, 39, 0.055) !important;
        }

        .incidents-theme [class*="hover:text-white"]:hover {
          color: var(--if-orange) !important;
        }

        .incidents-theme [class*="shadow-black"] {
          --tw-shadow-color: rgba(53, 21, 31, 0.12) !important;
        }

        .incidents-theme [class*="bg-white/"] {
          background-color: rgba(75, 27, 39, 0.035);
        }

        .incidents-theme [class*="border-white/"] {
          border-color: rgba(75, 27, 39, 0.11) !important;
        }

        .incidents-theme [class*="text-emerald-400"] {
          color: #39734E !important;
        }

        .incidents-theme [class*="text-red-400"] {
          color: #B44343 !important;
        }

        .incidents-theme [class*="text-orange-400"] {
          color: #D95A19 !important;
        }

        .incidents-theme [class*="text-yellow-400"] {
          color: #98721B !important;
        }

        .incidents-theme [class*="text-green-400"] {
          color: #39734E !important;
        }

        .incidents-theme [class*="text-purple-400"] {
          color: #75518E !important;
        }

        .incidents-theme [class*="bg-red-500/"],
        .incidents-theme [class*="bg-red-400"] {
          background-color: rgba(180, 67, 67, 0.15) !important;
        }

        .incidents-theme [class*="bg-orange-500/"],
        .incidents-theme [class*="bg-orange-400"] {
          background-color: rgba(255, 107, 26, 0.16) !important;
        }

        .incidents-theme [class*="bg-yellow-500/"],
        .incidents-theme [class*="bg-yellow-400"] {
          background-color: rgba(196, 151, 43, 0.16) !important;
        }

        .incidents-theme [class*="bg-green-500/"],
        .incidents-theme [class*="bg-emerald-400"] {
          background-color: rgba(57, 115, 78, 0.15) !important;
        }

        .incidents-theme [class*="bg-blue-400"] {
          background-color: var(--if-orange) !important;
        }

        .incidents-theme [class*="border-t"],
        .incidents-theme [class*="border-b"],
        .incidents-theme [class*="border-l"] {
          border-color: var(--if-border);
        }

        .incidents-theme button,
        .incidents-theme input,
        .incidents-theme select {
          transition-duration: 200ms;
        }

        .incidents-theme button:focus-visible,
        .incidents-theme input:focus-visible,
        .incidents-theme select:focus-visible {
          outline: 2px solid rgba(255, 107, 26, 0.55);
          outline-offset: 2px;
        }


      `}

      </style>

      <div className="mx-auto max-w-[1350px] px-3 py-8 sm:px-5 lg:px-8">

        {/* HEADER */}
        <header className="relative mb-9 overflow-visible rounded-[28px] border border-[#4B1B27] bg-[#4B1B27] px-6 py-8 text-white shadow-[0_20px_55px_rgba(75,27,39,0.16)] sm:px-9 sm:py-10">

          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-20 -top-36 h-80 w-80 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-5 -top-20 h-64 w-64 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-[#FF6B1A]/15 blur-[90px]" />

          <div className="relative flex flex-wrap items-end justify-between gap-6">

            {/* LEFT CONTENT */}
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF6B1A]/30 bg-[#FF6B1A]/15 text-[#FF8A48]">
                  <Activity size={17} />
                </span>

                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF8A48]">
                  Incident management
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-[-0.04em] text-[white] sm:text-4xl lg:text-[46px]">
                Incidents{" "}
                <span className="text-[#FF8A48]">
                  & response.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[white]/60">
                Your team's incident activity, priorities and resolution
                progress. Monitor critical events and coordinate responses
                across your organization.
              </p>
            </div>

            {/* RIGHT CONTENT: NOTIFICATIONS + CREATE INCIDENT */}
            <div className="relative flex flex-wrap items-center gap-3">

              {/* NOTIFICATION BUTTON */}
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                aria-expanded={showNotifications}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[white]/15 bg-[white]/[0.07] text-[white]/80 transition hover:border-[#FF6B1A]/50 hover:bg-[#FF6B1A]/10 hover:text-[#FF8A48]"
              >
                <Bell size={18} />

                {notifications.filter((n) => !n.is_read).length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6B1A] px-1 text-[9px] font-bold text-[white] ring-2 ring-[#4B1B27]">
                    {notifications.filter((n) => !n.is_read).length}
                  </span>
                )}
              </button>

              {/* NOTIFICATIONS DROPDOWN */}
              {showNotifications && (
                <div className="absolute right-0 top-full z-50 mt-3 w-[min(360px,calc(100vw-40px))] overflow-hidden rounded-xl border border-[#4B1B27]/15 bg-[#F5F3EB] text-[#35151F] shadow-2xl shadow-[black]/20">

                  <div className="flex items-center justify-between border-b border-[#4B1B27]/10 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-[#35151F]">
                        Notifications
                      </p>
                      <p className="mt-1 text-[11px] text-[#806D70]">
                        {notifications.filter((n) => !n.is_read).length} unread
                      </p>
                    </div>

                    {notifications.some((n) => !n.is_read) && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const unread = notifications.filter((n) => !n.is_read);

                            const responses = await Promise.all(
                              unread.map((notification) =>
                                fetch(
                                  `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification.id}/read${notification.organization_id ? `?organization_id=${notification.organization_id}` : ""}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem("token")}`
                                    }
                                  }
                                )
                              )
                            );

                            if (responses.some((response) => !response.ok)) {
                              throw new Error("Unable to update all notifications.");
                            }

                            setNotifications((prev) =>
                              prev.map((n) => ({ ...n, is_read: true }))
                            );
                          } catch (error) {
                            console.error(error);
                          }
                        }}
                        className="text-xs font-semibold text-[#FF6B1A] transition hover:text-[#D95A19]"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.some((n) => n.is_read) && (
                    <div className="flex justify-end px-4 py-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/clear-read${activeOrganization?.id ? `?organization_id=${encodeURIComponent(activeOrganization.id)}` : ""}`,
                              {
                                method: "DELETE",
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem("token")}`
                                }
                              }
                            );

                            if (response.ok) {
                              setNotifications((prev) =>
                                prev.filter((n) => !n.is_read)
                              );
                            }
                          } catch (error) {
                            console.error(error);
                          }
                        }}
                        className="text-[11px] font-medium text-[#806D70] transition hover:text-red-600"
                      >
                        Clear read
                      </button>
                    </div>
                  )}

                  <div className="max-h-80 overflow-y-auto border-t border-[#4B1B27]/10">

                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-xs text-[#806D70]">
                        You're all caught up.
                      </p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={async () => {
                            console.log("CLICKED NOTIFICATION:", notification);

                            try {
                              if (!notification.is_read) {
                                const response = await fetch(
                                  `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification.id}/read${notification.organization_id ? `?organization_id=${notification.organization_id}` : ""}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem("token")}`
                                    }
                                  }
                                );

                                if (!response.ok) {
                                  throw new Error("Unable to mark notification as read.");
                                }
                              }

                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n.id === notification.id
                                    ? { ...n, is_read: true }
                                    : n
                                )
                              );

                              setShowNotifications(false);

                              if (notification.incident_id) {
                                router.push(`/incidents/${notification.incident_id}`);
                              } else if (notification.type === "service_created") {
                                router.push("/services");
                              } else if (notification.type === "join_request") {
                                router.push(
                                  `/organization-members?tab=requests&organization_id=${notification.organization_id}`
                                );
                              } else if (notification.type === "join_token_created") {
                                router.push(
                                  `/organization-members?tab=tokens&organization_id=${notification.organization_id}`
                                );
                              } else if (notification.type === "member_joined") {
                                router.push(
                                  `/organization-members?tab=members&organization_id=${notification.organization_id}`
                                );
                              }
                            } catch (error) {
                              console.error(error);
                            }
                          }}
                          className="flex cursor-pointer gap-3 border-b border-[#4B1B27]/[0.08] px-4 py-4 transition hover:bg-[#D7DDD2]/60"
                        >
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.is_read
                              ? "bg-[#B8AAA5]"
                              : "bg-[#FF6B1A]"
                              }`}
                          />

                          <div className="min-w-0">
                            <p className="text-xs leading-5 text-[#4B1B27]">
                              {notification.message}
                            </p>

                            <p className="mt-2 text-[10px] text-[#806D70]">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* CREATE INCIDENT BUTTON */}
              <button
                type="button"
                onClick={() => router.push("/incidents/create")}
                className="group relative flex h-11 items-center gap-3 overflow-hidden rounded-xl bg-[#FF6B1A] px-5 text-xs font-bold tracking-wide text-white shadow-[0_6px_20px_rgba(255,107,26,0.20)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E85D13] hover:shadow-[0_10px_28px_rgba(255,107,26,0.28)] active:translate-y-0"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[white]/15 text-base font-medium text-[white] transition-transform duration-300 group-hover:rotate-90">
                  +
                </span>

                <span>Create incident</span>

                <span className="ml-1 text-white/80 transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </div>
          </div>

          {/* BOTTOM FEATURE STRIP */}
          <div className="relative mt-9 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5">

            <div className="flex items-center gap-2 text-xs text-[white]/55">
              <Activity size={14} className="text-[#FF8A48]" />
              Real-time incident tracking
            </div>

            <div className="flex items-center gap-2 text-xs text-[white]/55">
              <ShieldCheck size={14} className="text-[#FF8A48]" />
              Severity monitoring
            </div>

            <div className="flex items-center gap-2 text-xs text-[white]/55">
              <Server size={14} className="text-[#FF8A48]" />
              Service health
            </div>
          </div>
        </header>

        {/* METRICS */}
        <section className="mt-8 grid grid-cols-2 gap-3 border-b border-[#4B1B27]/10 pb-7 sm:grid-cols-4 sm:gap-4">
          {[
            {
              label: "Total incidents",
              value: incidents.length,
              accent: "#4B1B27",
              description: "All reported incidents",
              icon: "◎"
            },
            {
              label: "Active incidents",
              value: activeIncidents,
              accent: "#FF6B1A",
              description: "Currently requiring attention",
              icon: "↗"
            },
            {
              label: "Critical incidents",
              value: sev1Incidents,
              accent: "#B44343",
              description: "SEV-1 priority",
              icon: "!"
            },
            {
              label: "Resolved",
              value: resolvedIncidents,
              accent: "#39734E",
              description: "Successfully resolved",
              icon: "✓"
            }
          ].map((metric) => (
            <div
              key={metric.label}
              className="group relative overflow-hidden rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B1A]/40 hover:shadow-xl hover:shadow-[#4B1B27]/[0.08] sm:p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-[#756B69]">
                  {metric.label}
                </p>

                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    color: metric.accent,
                    backgroundColor: `${metric.accent}15`
                  }}
                >
                  {metric.icon}
                </span>
              </div>

              <p
                className="mt-5 text-3xl font-bold tracking-tight tabular-nums"
                style={{ color: metric.accent }}
              >
                {metric.value}
              </p>

              <p className="mt-1 text-[10px] text-[#938785]">
                {metric.description}
              </p>

              <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#E9E9DF]">
                <div
                  className="h-full w-0 transition-all duration-500 group-hover:w-full"
                  style={{ backgroundColor: metric.accent }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* MAIN CONTENT */}
        <div className="mt-9 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* LEFT COLUMN */}
          <div className="min-w-0 space-y-10">

            {/* RECENT ACTIVITY */}
            <section className="rounded-2xl border border-[#D7DDD2] bg-[#E9E9DF] p-5 shadow-sm sm:p-6">
              {/* Header */}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A94B20]">
                      What's happening
                    </p>
                  </div>

                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#35151F]">
                    Recent activity
                  </h2>

                  <p className="mt-1 text-xs text-[#756B69]">
                    The latest incidents reported by your team.
                  </p>
                </div>

                <span className="w-fit rounded-lg border border-[#D7DDD2] bg-white/70 px-3 py-2 text-[10px] font-semibold text-[#4B1B27]">
                  Latest {Math.min(incidents.length, 5)} incidents
                </span>
              </div>

              {/* Activity */}
              <div className="mt-6">
                {incidents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#C8C9BC] bg-white/50 px-4 py-10 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#4B1B27]/10 text-[#A94B20]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4m0 4h.01M10.3 3.86 2.82 17a2 2 0 0 0 1.74 3h14.88a2 2 0 0 0 1.74-3L13.7 3.86a2 2 0 0 0-3.4 0Z"
                        />
                      </svg>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#35151F]">
                      No recent activity
                    </p>
                    <p className="mt-1 text-xs text-[#756B69]">
                      New incidents will appear here when reported.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[...incidents]
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .slice(0, 5)
                      .map((incident) => (
                        <button
                          key={incident.id}
                          type="button"
                          onClick={() => router.push(`/incidents/${incident.id}`)}
                          className="group relative flex min-w-0 items-start gap-3 overflow-hidden rounded-xl border border-[#D7DDD2] bg-white/75 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF6B1A]/50 hover:bg-white hover:shadow-md hover:shadow-[#4B1B27]/[0.06]"
                        >
                          <span className="absolute inset-y-0 left-0 w-[3px] bg-[#D7DDD2] transition-colors group-hover:bg-[#FF6B1A]" />

                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FF6B1A]/20 bg-[#FF6B1A]/10">
                            <span className="h-2 w-2 rounded-full bg-[#FF6B1A]" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8B7775]">
                                Incident #{incident.id}
                              </span>

                              <span className="text-[10px] text-[#8B7775]">
                                {new Date(incident.created_at).toLocaleString()}
                              </span>
                            </div>

                            <p className="mt-2 truncate text-sm font-semibold text-[#35151F] transition-colors group-hover:text-[#C65320]">
                              {incident.title}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-md border border-[#FF6B1A]/25 bg-[#FF6B1A]/10 px-2 py-1 text-[9px] font-bold tracking-wide text-[#A94B20]">
                                {incident.severity}
                              </span>

                              <span className="rounded-md border border-[#D7DDD2] bg-[#D7DDD2]/50 px-2 py-1 text-[9px] font-semibold tracking-wide text-[#4B1B27]">
                                {incident.status}
                              </span>
                            </div>
                          </div>

                          <span className="mt-1 shrink-0 text-sm text-[#FF6B1A] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                            →
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </section>


            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF6B1A]">
                  {userRole === "platform_admin"
                    ? "Organization directory"
                    : "Incident search"}
                </p>
                <h3 className="mt-1 text-lg font-bold tracking-tight text-[#4B1B27]">
                  {userRole === "platform_admin"
                    ? "Find an organization"
                    : "Find incidents"}
                </h3>
              </div>

              <div className="relative w-full sm:max-w-sm">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FF6B1A]"
                />

                <input
                  type="text"
                  value={incidentSearch}
                  onChange={(e) => setIncidentSearch(e.target.value)}
                  placeholder={
                    userRole === "platform_admin"
                      ? "Search organizations..."
                      : "Search incidents by title or description..."
                  }
                  className="h-11 w-full rounded-xl border border-[#4B1B27]/15 bg-[#FFFEFA] pl-10 pr-10 text-sm text-[#35151F] outline-none transition placeholder:text-[#938785] hover:border-[#FF6B1A]/40 focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10"
                />

                {incidentSearch && (
                  <button
                    type="button"
                    onClick={() => setIncidentSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#938785] transition hover:text-[#FF6B1A]"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>


            {/* ALL INCIDENTS */}
            <div className="mt-3">

              <div className="hidden grid-cols-[minmax(0,1fr)_90px_130px_150px_55px] gap-3 border-b border-[#4B1B27]/10 px-3 py-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#938785] md:grid">
                <span>Incident</span>
                <span>Severity</span>
                <span>Status</span>
                <span>Created</span>
                <span className="text-right">ID</span>
              </div>

              {incidents.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-[#4B1B27]">
                    No incidents reported yet.
                  </p>
                  <p className="mt-1 text-xs text-[#938785]">
                    Create an incident to start tracking issues.
                  </p>
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-[#4B1B27]">
                    No matching incidents.
                  </p>
                  <p className="mt-1 text-xs text-[#938785]">
                    Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {userRole === "platform_admin" ? (
                    groupedIncidents
                      .filter((organization) =>
                        organization.name
                          ?.toLowerCase()
                          .includes(incidentSearch.trim().toLowerCase())
                      )
                      .map((organization) => {
                        const isExpanded = expandedOrganizations.includes(organization.id);

                        const criticalCount = organization.incidents.filter(
                          (incident) => incident.severity === "SEV-1"
                        ).length;

                        const highCount = organization.incidents.filter(
                          (incident) => incident.severity === "SEV-2"
                        ).length;

                        const mediumCount = organization.incidents.filter(
                          (incident) => incident.severity === "SEV-3"
                        ).length;

                        const activeCount = organization.incidents.filter(
                          (incident) =>
                            !["resolved", "closed"].includes(
                              incident.status?.toLowerCase()
                            )
                        ).length;

                        return (
                          <div
                            key={organization.id}
                            className="group/org overflow-hidden rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] shadow-[0_8px_30px_rgba(75,27,39,0.05)] transition-all duration-300 hover:border-[#FF6B1A]/30 hover:shadow-[0_12px_35px_rgba(75,27,39,0.09)]"
                          >
                            {/* ORGANIZATION WORKSPACE HEADER */}
                            <button
                              type="button"
                              onClick={() => toggleOrganization(organization.id)}
                              className="relative w-full overflow-hidden text-left"
                            >
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#FF6B1A]/[0.06] via-transparent to-transparent" />

                              <div className="relative flex flex-col gap-5 p-5 sm:p-6">

                                {/* TOP SECTION */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex min-w-0 items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#4B1B27]/10 bg-[#D7DDD2]/70">
                                      <svg
                                        className="h-6 w-6 text-[#4B1B27]"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                      >
                                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                                      </svg>
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="truncate text-base font-semibold tracking-tight text-[#35151F]">
                                          {organization.name}
                                        </h3>

                                        <span className="rounded-md border border-[#39734E]/20 bg-[#39734E]/[0.07] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#39734E]">
                                          Organization
                                        </span>
                                      </div>

                                      <p className="mt-1.5 font-mono text-[10px] tracking-wide text-[#938785]">
                                        ORG-{String(organization.id).padStart(4, "0")}
                                        <span className="mx-2 text-[#D7DDD2]">/</span>
                                        Incident workspace
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-3">
                                    <span className="hidden text-[10px] font-medium uppercase tracking-wider text-[#938785] sm:block">
                                      {isExpanded ? "Hide incidents" : "View incidents"}
                                    </span>

                                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 ${isExpanded
                                      ? "rotate-180 border-[#FF6B1A]/30 bg-[#FF6B1A]/10 text-[#FF6B1A]"
                                      : "border-[#4B1B27]/10 bg-[#D7DDD2]/50 text-[#806D70] group-hover/org:border-[#FF6B1A]/30 group-hover/org:text-[#FF6B1A]"
                                      }`}>
                                      <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="m6 9 6 6 6-6" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>

                                {/* METRICS */}
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                                  <div className="rounded-xl border border-[#4B1B27]/[0.07] bg-[#D7DDD2]/50 px-3.5 py-3">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#806D70]">
                                      Total incidents
                                    </p>
                                    <div className="mt-2 flex items-end gap-2">
                                      <span className="text-2xl font-semibold tracking-tight text-[#4B1B27]">
                                        {organization.incidents.length}
                                      </span>
                                      <span className="mb-1 text-[9px] text-[#938785]">
                                        Recorded
                                      </span>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-[#FF6B1A]/10 bg-[#FF6B1A]/[0.045] px-3.5 py-3">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#806D70]">
                                      Active incidents
                                    </p>
                                    <div className="mt-2 flex items-end gap-2">
                                      <span className="text-2xl font-semibold tracking-tight text-[#FF6B1A]">
                                        {activeCount}
                                      </span>
                                      <span className="mb-1 text-[9px] text-[#938785]">
                                        Ongoing
                                      </span>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-[#B44343]/10 bg-[#B44343]/[0.045] px-3.5 py-3">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#806D70]">
                                      Critical
                                    </p>
                                    <div className="mt-2 flex items-end gap-2">
                                      <span className="text-2xl font-semibold tracking-tight text-[#B44343]">
                                        {criticalCount}
                                      </span>
                                      <span className="mb-1 text-[9px] text-[#938785]">
                                        SEV-1
                                      </span>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-[#D69A32]/15 bg-[#D69A32]/[0.055] px-3.5 py-3">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#806D70]">
                                      Other severity
                                    </p>
                                    <div className="mt-2 flex items-end gap-2">
                                      <span className="text-2xl font-semibold tracking-tight text-[#9A6A16]">
                                        {highCount + mediumCount}
                                      </span>
                                      <span className="mb-1 text-[9px] text-[#938785]">
                                        SEV-2 / SEV-3
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* SEVERITY DISTRIBUTION */}
                                <div>
                                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#806D70]">
                                      Severity distribution
                                    </span>

                                    <div className="flex items-center gap-3">
                                      <span className="flex items-center gap-1.5 text-[9px] text-[#806D70]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#B44343]" />
                                        SEV-1
                                      </span>
                                      <span className="flex items-center gap-1.5 text-[9px] text-[#806D70]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A]" />
                                        SEV-2
                                      </span>
                                      <span className="flex items-center gap-1.5 text-[9px] text-[#806D70]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#D69A32]" />
                                        SEV-3
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#D7DDD2]">
                                    {criticalCount > 0 && (
                                      <div
                                        className="bg-[#B44343] transition-all"
                                        style={{
                                          width: `${(criticalCount / organization.incidents.length) * 100}%`
                                        }}
                                      />
                                    )}
                                    {highCount > 0 && (
                                      <div
                                        className="bg-[#FF6B1A] transition-all"
                                        style={{
                                          width: `${(highCount / organization.incidents.length) * 100}%`
                                        }}
                                      />
                                    )}
                                    {mediumCount > 0 && (
                                      <div
                                        className="bg-[#D69A32] transition-all"
                                        style={{
                                          width: `${(mediumCount / organization.incidents.length) * 100}%`
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>

                            {/* EXPANDED INCIDENT WORKSPACE */}
                            {isExpanded && (
                              <div className="border-t border-[#4B1B27]/10 bg-[#D7DDD2]/30">

                                <div className="flex flex-col justify-between gap-3 border-b border-[#4B1B27]/10 px-5 py-4 sm:flex-row sm:items-center">
                                  <div>
                                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#4B1B27]">
                                      Incident registry
                                    </h4>
                                    <p className="mt-1 text-[10px] text-[#806D70]">
                                      All recorded incidents for {organization.name}
                                    </p>
                                  </div>

                                  <span className="w-fit rounded-lg border border-[#4B1B27]/10 bg-[#FFFEFA] px-3 py-1.5 font-mono text-[10px] text-[#806D70]">
                                    {organization.incidents.length} RECORDS
                                  </span>
                                </div>

                                <div className="hidden grid-cols-[minmax(0,1fr)_110px_145px_175px_65px] gap-5 border-b border-[#4B1B27]/10 bg-[#FFFEFA]/60 px-5 py-3 md:grid">
                                  <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#938785]">
                                    Incident
                                  </span>
                                  <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#938785]">
                                    Severity
                                  </span>
                                  <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#938785]">
                                    Status
                                  </span>
                                  <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#938785]">
                                    Created
                                  </span>
                                  <span className="text-right text-[9px] font-semibold uppercase tracking-[0.13em] text-[#938785]">
                                    ID
                                  </span>
                                </div>

                                {organization.incidents.map((incident) => (
                                  <div
                                    key={incident.id}
                                    onClick={() => router.push(`/incidents/${incident.id}`)}
                                    className="group grid cursor-pointer grid-cols-1 gap-3 border-b border-[#4B1B27]/[0.06] px-5 py-4 transition-all duration-200 hover:bg-[#FFFEFA] md:grid-cols-[minmax(0,1fr)_110px_145px_175px_65px] md:items-center md:gap-5"
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#4B1B27]/10 bg-[#FFFEFA]">
                                        <span className={`h-2 w-2 rounded-full ${incident.severity === "SEV-1"
                                          ? "bg-[#B44343] shadow-[0_0_8px_rgba(180,67,67,0.4)]"
                                          : incident.severity === "SEV-2"
                                            ? "bg-[#FF6B1A] shadow-[0_0_8px_rgba(255,107,26,0.35)]"
                                            : incident.severity === "SEV-3"
                                              ? "bg-[#D69A32]"
                                              : "bg-[#39734E]"
                                          }`} />
                                      </div>

                                      <div className="min-w-0">
                                        <h5 className="truncate text-[12px] font-medium text-[#4B1B27] transition group-hover:text-[#FF6B1A]">
                                          {incident.title}
                                        </h5>
                                        <p className="mt-1 truncate text-[10px] text-[#938785]">
                                          {incident.description}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 md:block">
                                      <span className="text-[10px] text-[#938785] md:hidden">
                                        Severity
                                      </span>
                                      <span className={`text-[10px] font-bold ${incident.severity === "SEV-1"
                                        ? "text-[#B44343]"
                                        : incident.severity === "SEV-2"
                                          ? "text-[#E45E18]"
                                          : incident.severity === "SEV-3"
                                            ? "text-[#A8751D]"
                                            : "text-[#39734E]"
                                        }`}>
                                        {incident.severity}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2 md:block">
                                      <span className="text-[10px] text-[#938785] md:hidden">
                                        Status
                                      </span>
                                      <span className={`text-[10px] font-medium ${getStatusClass(incident.status)}`}>
                                        {incident.status}
                                      </span>
                                    </div>

                                    <span className="text-[10px] text-[#806D70]">
                                      <span className="mr-2 text-[#938785] md:hidden">
                                        Created
                                      </span>
                                      {new Date(incident.created_at).toLocaleString()}
                                    </span>

                                    <span className="hidden text-right font-mono text-[10px] text-[#938785] md:block">
                                      #{incident.id}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                  ) : (
                    paginatedIncidents.map((incident) => (
                      <div
                        key={incident.id}
                        onClick={() => router.push(`/incidents/${incident.id}`)}
                        className="group relative grid cursor-pointer grid-cols-1 gap-4 border-b border-[#4B1B27]/[0.07] px-5 py-5 transition-all duration-200 hover:bg-[#FFFEFA] md:grid-cols-[minmax(0,1fr)_110px_145px_175px_65px] md:items-center md:gap-5"
                      >
                        {/* INCIDENT DETAILS */}
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#4B1B27]/10 bg-[#D7DDD2]/50 transition-colors group-hover:border-[#FF6B1A]/30 group-hover:bg-[#FF6B1A]/[0.06]">
                            <span className={`h-2 w-2 rounded-full ${incident.severity === "SEV-1"
                              ? "bg-[#B44343] shadow-[0_0_10px_rgba(180,67,67,0.45)]"
                              : incident.severity === "SEV-2"
                                ? "bg-[#FF6B1A] shadow-[0_0_10px_rgba(255,107,26,0.35)]"
                                : incident.severity === "SEV-3"
                                  ? "bg-[#D69A32]"
                                  : "bg-[#39734E]"
                              }`} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-[13px] font-semibold tracking-tight text-[#4B1B27] transition-colors group-hover:text-[#FF6B1A]">
                                {incident.title}
                              </h3>
                              <span className="rounded-md border border-[#4B1B27]/10 bg-[#D7DDD2]/40 px-1.5 py-0.5 font-mono text-[9px] text-[#806D70]">
                                INC-{incident.id}
                              </span>
                            </div>

                            <p className="mt-1.5 line-clamp-1 text-[11px] leading-relaxed text-[#938785]">
                              {incident.description}
                            </p>
                          </div>
                        </div>

                        {/* SEVERITY */}
                        <div className="flex items-center gap-2 md:block">
                          <span className="text-[10px] text-[#938785] md:hidden">
                            Severity
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold tracking-wide ${incident.severity === "SEV-1"
                            ? "border-[#B44343]/20 bg-[#B44343]/[0.07] text-[#B44343]"
                            : incident.severity === "SEV-2"
                              ? "border-[#FF6B1A]/20 bg-[#FF6B1A]/[0.07] text-[#E45E18]"
                              : incident.severity === "SEV-3"
                                ? "border-[#D69A32]/25 bg-[#D69A32]/[0.09] text-[#A8751D]"
                                : "border-[#39734E]/20 bg-[#39734E]/[0.07] text-[#39734E]"
                            }`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {incident.severity}
                          </span>
                        </div>

                        {/* STATUS */}
                        <div className="flex items-center gap-2 md:block">
                          <span className="text-[10px] text-[#938785] md:hidden">
                            Status
                          </span>
                          <span className={`inline-flex items-center rounded-md border border-[#4B1B27]/[0.08] bg-[#D7DDD2]/30 px-2.5 py-1 text-[10px] font-medium ${getStatusClass(incident.status)}`}>
                            {incident.status}
                          </span>
                        </div>

                        {/* CREATED AT */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#938785]">
                            Created
                          </span>
                          <span className="text-[10px] font-medium text-[#806D70]">
                            {new Date(incident.created_at).toLocaleString()}
                          </span>
                        </div>

                        {/* INCIDENT ID / ARROW */}
                        <div className="hidden items-center justify-end gap-2 md:flex">
                          <span className="font-mono text-[10px] text-[#938785]">
                            #{incident.id}
                          </span>
                          <span className="translate-x-[-4px] text-[#FF6B1A] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                            →
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: OPERATIONAL SIDEBAR */}
          <aside className="space-y-9 border-t border-[#202c40] pt-7 xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">

            {/* SEVERITY */}
            <section className="rounded-2xl border border-[#4B1B27]/15 bg-[#E9E9DF] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#FF6B1A]">
                    Incident insights
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-[#4B1B27]">
                    Severity breakdown
                  </h3>
                </div>

                <span className="rounded-lg border border-[#4B1B27]/15 bg-[#FFFEFA] px-3 py-2 text-[10px] font-semibold text-[#4B1B27]">
                  {incidents.length} total
                </span>
              </div>

              <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-[#D7DDD2]">
                {[
                  { key: "SEV-1", color: "#B44343" },
                  { key: "SEV-2", color: "#FF6B1A" },
                  { key: "SEV-3", color: "#C4972B" },
                  { key: "SEV-4", color: "#57916B" }
                ].map((item) => {
                  const count = incidents.filter(
                    (incident) => incident.severity === item.key
                  ).length;

                  return count > 0 ? (
                    <div
                      key={item.key}
                      title={`${item.key}: ${count}`}
                      style={{
                        width: `${(count / Math.max(incidents.length, 1)) * 100}%`,
                        backgroundColor: item.color
                      }}
                      className="h-full transition-all duration-500"
                    />
                  ) : null;
                })}
              </div>

              <div className="mt-6 space-y-2">
                {[
                  { key: "SEV-1", label: "Critical", color: "#B44343" },
                  { key: "SEV-2", label: "High", color: "#FF6B1A" },
                  { key: "SEV-3", label: "Medium", color: "#C4972B" },
                  { key: "SEV-4", label: "Low", color: "#57916B" }
                ].map((item) => {
                  const count = incidents.filter(
                    (incident) => incident.severity === item.key
                  ).length;

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-[#4B1B27]/10 bg-[#FFFEFA] px-3 py-3 transition-all duration-200 hover:border-[#FF6B1A]/40 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-medium text-[#4B1B27]/75">
                          {item.label}
                        </span>
                      </div>

                      <span className="text-sm font-bold tabular-nums text-[#4B1B27]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* LIFECYCLE */}
            <section className="border-t border-[#4B1B27]/15 pt-7">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#FF6B1A]">
                  Status overview
                </p>
                <h3 className="mt-1 text-sm font-semibold text-[#4B1B27]">
                  Incident lifecycle
                </h3>
                <p className="mt-1 text-[11px] text-[#4B1B27]/60">
                  Current status distribution
                </p>
              </div>

              <div className="mt-6 space-y-5">
                {[
                  { key: "INVESTIGATING", label: "Investigating", color: "#B44343" },
                  { key: "IDENTIFIED", label: "Identified", color: "#75518E" },
                  { key: "MITIGATING", label: "Mitigating", color: "#FF6B1A" },
                  { key: "MONITORING", label: "Monitoring", color: "#579B91" },
                  { key: "RESOLVED", label: "Resolved", color: "#39734E" }
                ].map((item) => {
                  const count = incidents.filter(
                    (incident) => incident.status === item.key
                  ).length;

                  const percentage = incidents.length
                    ? (count / incidents.length) * 100
                    : 0;

                  return (
                    <div key={item.key}>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[11px] font-medium text-[#4B1B27]/75">
                            {item.label}
                          </span>
                        </div>

                        <span className="text-xs font-bold tabular-nums text-[#4B1B27]">
                          {count}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#D7DDD2]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}