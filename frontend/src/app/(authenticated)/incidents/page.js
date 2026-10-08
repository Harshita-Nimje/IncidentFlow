"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import socket from "../../socket";
import { useRouter } from "next/navigation";

export default function Home() {

  const [incidents, setIncidents] = useState([]);
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
  const incidentsPerPage = 6;
  useEffect(() => {
    setCurrentPage(1);
  }, [search, severityFilter, statusFilter, environmentFilter, sortOrder]);
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          // "http://localhost:5000/api/notifications",
          `${process.env.NEXT_PUBLIC_API_URL}/api/notifications`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        const data = await response.json();

        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, []);
  useEffect(() => {

    const handleNotificationCreated = (data) => {


      const currentUser = JSON.parse(
        localStorage.getItem("user")
      );

      if (
        currentUser &&
        Number(data.userId) === Number(currentUser.id)
      ) {
        setNotifications((prev) => [
          data.notification,
          ...prev
        ]);
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

    socket.on(
      "notification_created",
      handleNotificationCreated
    );
    socket.on(
      "incident_status_updated",
      handleStatusUpdate
    );

    socket.on("connect_error", (error) => {
      console.error("SOCKET CONNECTION ERROR:", error.message);
    });

    return () => {
      socket.off(
        "notification_created",
        handleNotificationCreated
      );

      socket.off(
        "incident_status_updated",
        handleStatusUpdate
      );
    };
  }, []);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/incidents`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        const data = await response.json();

        setIncidents(data.incidents || []);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching incidents:", error);
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  useEffect(() => {
    if (incidents.length === 0) return;

    const joinIncidentRooms = () => {
      incidents.forEach((incident) => {
        socket.emit("join_incident", incident.id);
      });
    };

    if (socket.connected) {
      joinIncidentRooms();
    }

    socket.on("connect", joinIncidentRooms);

    return () => {
      socket.off("connect", joinIncidentRooms);

      incidents.forEach((incident) => {
        socket.emit("leave_incident", incident.id);
      });
    };
  }, [incidents]);
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

      case "INVESTIGATING":
        return "bg-red-500/20 text-red-400";

      default:
        return "bg-slate-800 text-slate-300";
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
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading incidents...</p>
      </main>
    );
  }
  const filteredIncidents = incidents.filter((incident) => {
    const service = services.find(
      (service) => service.id === incident.service_id
    );
    const matchesSearch =
      incident.title.toLowerCase().includes(search.toLowerCase()) ||
      (incident.description || "").toLowerCase().includes(search.toLowerCase());

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
  const startIndex = (currentPage - 1) * incidentsPerPage;

  const paginatedIncidents = sortedIncidents.slice(
    startIndex,
    startIndex + incidentsPerPage
  );
  const totalPages = Math.ceil(
    sortedIncidents.length / incidentsPerPage
  );
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white p-6 md:p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Incident Flow
            </h1>

            <p className="text-slate-400 mt-2 text-sm md:text-base">
              Production Incident Management Platform
            </p>
          </div>

          <div className="relative flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            >
              <Bell size={20} />

              {notifications.filter((notification) => !notification.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.filter((notification) => !notification.is_read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold">
                    Notifications
                  </h3>

                  {notifications.some((notification) => !notification.is_read) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const unreadNotifications = notifications.filter(
                          (notification) => !notification.is_read
                        );

                        for (const notification of unreadNotifications) {
                          await fetch(
                            // `http://localhost:5000/api/notifications/${notification.id}/read`,
                            `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification.id}/read`,
                            {
                              method: "PATCH",
                              headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`
                              }
                            }
                          );
                        }

                        setNotifications((prev) =>
                          prev.map((notification) => ({
                            ...notification,
                            is_read: true
                          }))
                        );
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {notifications.some((notification) => notification.is_read) && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          // "http://localhost:5000/api/notifications/clear-read",
                          `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/clear-read`,
                          {
                            method: "DELETE",
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`
                            }
                          }
                        );

                        if (response.ok) {
                          setNotifications((prev) =>
                            prev.filter(
                              (notification) => !notification.is_read
                            )
                          );
                        }
                      } catch (error) {
                        console.error(
                          "Error clearing notifications:",
                          error
                        );
                      }
                    }}
                    className="text-xs ml-3 mt-1 text-red-400 hover:text-red-300"
                  >
                    Clear
                  </button>
                )}

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!notification.is_read) {
                            await fetch(
                              // `http://localhost:5000/api/notifications/${notification.id}/read`,
                              `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification.id}/read`,
                              {
                                method: "PATCH",
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem("token")}`
                                }
                              }
                            );
                          }

                          setNotifications((prev) =>
                            prev.map((item) =>
                              item.id === notification.id
                                ? { ...item, is_read: true }
                                : item
                            )
                          );

                          setShowNotifications(false);

                          window.location.href = `/incidents/${notification.incident_id}`;
                        }}
                        className={`p-4 border-b border-slate-800 transition cursor-pointer ${notification.is_read
                          ? "opacity-60"
                          : "hover:bg-slate-800/50"
                          }`}
                      >
                        <p className="text-sm text-slate-200">
                          {notification.message}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </p>

                        {!notification.is_read && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  // `http://localhost:5000/api/notifications/${notification.id}/read`,
                                  `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notification.id}/read`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      Authorization: `Bearer ${localStorage.getItem("token")}`
                                    }
                                  }
                                );

                                if (response.ok) {
                                  setNotifications((prev) =>
                                    prev.map((item) =>
                                      item.id === notification.id
                                        ? { ...item, is_read: true }
                                        : item
                                    )
                                  );
                                }
                              } catch (error) {
                                console.error(
                                  "Error marking notification as read:",
                                  error
                                );
                              }
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => window.location.href = "/incidents/create"}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/10 rounded-lg font-medium transition"
            >
              + Create Incident
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-7 hover:border-slate-700 hover:bg-slate-800/40 transition">
            <p className="text-sm font-medium text-slate-400">
              Active Incidents
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {activeIncidents}
            </h2>

            <p className="text-xs text-slate-500 mt-2">
              Currently requiring attention
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-7 hover:border-slate-700 hover:bg-slate-800/40 transition">
            <p className="text-sm font-medium text-slate-400">
              SEV-1 Incidents
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {sev1Incidents}
            </h2>

            <p className="text-xs text-slate-500 mt-2">
              Critical incidents requiring attention
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-7 hover:border-slate-700 hover:bg-slate-800/40 transition">
            <p className="text-sm font-medium text-slate-400">
              Resolved
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {resolvedIncidents}
            </h2>

            <p className="text-xs text-slate-500 mt-2">
              Successfully resolved incidents
            </p>
          </div>

        </div>

        <div
          onClick={() => {
            if (incidents.length > 0) {
              window.location.href = `/incidents/${incidents[0].id}`;
            }
          }}
          className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                Recent Incident
                <span className="text-xs text-slate-500">
                  →
                </span>
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Latest reported incident
              </p>
            </div>

            {incidents.length > 0 && (
              <span className="text-xs text-slate-500">
                #{incidents[0].id}
              </span>
            )}
          </div>


          <div className="mt-6">
            <h3 className="text-lg font-medium">
              {incidents.length > 0
                ? incidents[0].title
                : "No incidents yet"}
            </h3>

            <p className="text-slate-400 mt-1">
              {incidents.length > 0
                ? incidents[0].description
                : "No incident data available."}
            </p>

            <div className="flex gap-3 mt-4">
              <span
                className={`px-3 py-1 rounded-full text-sm ${incidents.length > 0
                  ? getSeverityClass(incidents[0].severity)
                  : "bg-slate-800 text-slate-300"
                  }`}
              >
                {incidents.length > 0 ? incidents[0].severity : "N/A"}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-sm ${incidents.length > 0
                  ? getStatusClass(incidents[0].status)
                  : "bg-slate-800 text-slate-300"
                  }`}
              >
                {incidents.length > 0 ? incidents[0].status : "N/A"}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col lg:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by title, description, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
          />

          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-3 text-sm text-white focus:outline-none focus:border-slate-600"
            >
              <option value="">All Severities</option>
              <option value="SEV-1">SEV-1</option>
              <option value="SEV-2">SEV-2</option>
              <option value="SEV-3">SEV-3</option>
              <option value="SEV-4">SEV-4</option>
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▼
            </span>
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-3 text-sm text-white focus:outline-none focus:border-slate-600"
            >
              <option value="">All Statuses</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="IDENTIFIED">Identified</option>
              <option value="MITIGATING">Mitigating</option>
              <option value="MONITORING">Monitoring</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▼
            </span>
          </div>

          <div className="relative">
            <select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-3 text-sm text-white focus:outline-none focus:border-slate-600"
            >
              <option value="">All Environments</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▼
            </span>
          </div>
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-3 text-sm text-white focus:outline-none focus:border-slate-600"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>

            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▼
            </span>
          </div>

          {(search ||
            severityFilter ||
            statusFilter ||
            environmentFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSeverityFilter("");
                  setStatusFilter("");
                  setEnvironmentFilter("");
                  setSortOrder("newest");
                }}
                className="px-4 py-3 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition"
              >
                Clear Filters
              </button>
            )}
        </div>

        {/* All Incidents */}
        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div>
            <h2 className="text-xl font-semibold">
              All Incidents
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              View and manage reported incidents.
            </p>
          </div>

          <div className="mt-6 min-h-[100px]">
            <p className="text-sm text-slate-500">
              Showing {filteredIncidents.length} of {incidents.length} incidents
            </p>
            {incidents.length === 0 ? (
              <p className="text-slate-400">
                No incidents have been reported yet.
              </p>
            ) : (
              <div className="space-y-4">
                {paginatedIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    onClick={() => router.push(`/incidents/${incident.id}`)}
                    className="border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">
                        {incident.title}
                      </h3>

                      <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded-md">
                        #{incident.id}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                      {incident.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Created {new Date(incident.created_at).toLocaleString()}
                    </p>

                    <div className="flex gap-3 mt-3 pt-3 border-t border-slate-800">
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
                  </div>
                ))}
                {filteredIncidents.length === 0 && (
                  <p className="text-slate-400">
                    No incidents match your filters.
                  </p>
                )}
              </div>

            )}
            {totalPages > 1 && filteredIncidents.length > 0 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((page) => page - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="px-3 py-2 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg">
                  {currentPage}
                </span>

                <span className="text-sm text-slate-500">
                  of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((page) => page + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

