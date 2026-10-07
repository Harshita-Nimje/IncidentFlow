"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        active_incidents: 0,
        resolved_incidents: 0,
        total_incidents: 0,
        average_resolution_hours: 0
    });
    const [services, setServices] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [severityData, setSeverityData] = useState([]);


    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const response = await fetch(
                    // "http://localhost:5000/api/analytics/stats",
                    `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/stats`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error(
                        "Failed to fetch dashboard stats:",
                        data
                    );
                    return;
                }

                setStats(data.data);
            } catch (error) {
                console.error("Dashboard stats error:", error);
            }
        };
        const fetchServices = async () => {
            try {
                const response = await fetch(
                    // "http://localhost:5000/api/services",
                    `${process.env.NEXT_PUBLIC_API_URL}/api/services`,

                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error("Failed to fetch services:", data);
                    return;
                }

                setServices(data.services);
            } catch (error) {
                console.error("Services fetch error:", error);
            }
        };
        const fetchIncidents = async () => {
            try {
                const response = await fetch(
                    // "http://localhost:5000/api/incidents",
                    `${process.env.NEXT_PUBLIC_API_URL}/api/incidents`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error("Failed to fetch incidents:", data);
                    return;
                }

                setIncidents(data.incidents);
            } catch (error) {
                console.error("Incidents fetch error:", error);
            }
        };
        const fetchSeverityData = async () => {
            try {
                const response = await fetch(
                    // "http://localhost:5000/api/analytics/incidents-by-severity",
                    `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/incidents-by-severity`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error("Failed to fetch severity data:", data);
                    return;
                }

                setSeverityData(data.data);
            } catch (error) {
                console.error("Severity data fetch error:", error);
            }
        };

        const loadDashboard = async () => {
            await Promise.all([
                fetchDashboardStats(),
                fetchServices(),
                fetchIncidents(),
                fetchSeverityData()
            ]);

            setLoading(false);
        };

        loadDashboard();
    }, []);

    return (
        <main className="flex-1 text-white p-8">
            <div className="max-w-7xl mx-auto">

                <div className="mb-8">
                    <h1 className="text-3xl font-semibold">
                        Dashboard
                    </h1>

                    <p className="text-slate-400 mt-2">
                        Monitor incidents, services, and system activity.
                    </p>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-slate-400">
                                Active Incidents
                            </h3>

                            <span className="text-xs text-red-400">
                                Live
                            </span>
                        </div>

                        <h2 className="text-3xl font-bold mt-2">
                            {stats.active_incidents}
                        </h2>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-slate-400">
                                Resolved Today
                            </h3>

                            <span className="text-xs text-green-400">
                                Today
                            </span>
                        </div>

                        <h2 className="text-3xl font-bold mt-2">
                            {stats.resolved_today}
                        </h2>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-slate-400">
                                Services
                            </h3>

                            <span className="text-xs text-blue-400">
                                Active
                            </span>
                        </div>

                        <h2 className="text-3xl font-bold mt-2">
                            {services.length}
                        </h2>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-slate-400">
                                Total Incidents
                            </h3>

                            <span className="text-xs text-slate-400">
                                All Time
                            </span>
                        </div>

                        <p className="text-3xl font-semibold mt-3">
                            {stats.total_incidents}
                        </p>
                    </div>

                </div>

            </div>
            <div className="mt-8 max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div>
                    <h2 className="text-xl font-semibold">
                        Incidents by Severity
                    </h2>

                    <p className="text-slate-400 text-sm mt-1">
                        Current incident distribution by severity level.
                    </p>
                </div>

                <div className="mt-6 space-y-2">
                    {severityData.map((item) => (
                        <div key={item.severity}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`w-2.5 h-2.5 rounded-full ${item.severity === "SEV-1"
                                            ? "bg-red-500"
                                            : item.severity === "SEV-2"
                                                ? "bg-orange-500"
                                                : item.severity === "SEV-3"
                                                    ? "bg-yellow-500"
                                                    : "bg-green-500"
                                            }`}
                                    />

                                    <span className="text-sm font-medium">
                                        {item.severity}
                                    </span>
                                </div>

                                <span className="text-sm text-slate-400">
                                    {item.count}
                                </span>
                            </div>

                            <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${item.severity === "SEV-1"
                                        ? "bg-red-500"
                                        : item.severity === "SEV-2"
                                            ? "bg-orange-500"
                                            : item.severity === "SEV-3"
                                                ? "bg-yellow-500"
                                                : "bg-green-500"
                                        }`}
                                    style={{
                                        width: `${(Number(item.count) /
                                            Math.max(
                                                ...severityData.map(
                                                    (severity) => Number(severity.count)
                                                )
                                            )) *
                                            100
                                            }%`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-8 max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Recent Incidents
                        </h2>

                        <p className="text-slate-400 text-sm mt-1">
                            Latest incidents across your services.
                        </p>
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {incidents.slice(0, 5).map((incident) => (
                        <div
                            key={incident.id}
                            onClick={() => router.push(`/incidents/${incident.id}`)}
                            className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-4 cursor-pointer hover:border-slate-700 transition"
                        >
                            <div>
                                <h3 className="font-medium">
                                    {incident.title}
                                </h3>

                                <div className="text-sm text-slate-400 mt-1">
                                    <span>
                                        {services.find(
                                            (service) => service.id === incident.service_id
                                        )?.name || "Unknown Service"}
                                    </span>

                                    <span className="mx-2">•</span>

                                    <span>{incident.environment}</span>

                                    <span className="mx-2">•</span>

                                    <span>
                                        {new Date(incident.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${incident.severity === "SEV-1"
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                        : incident.severity === "SEV-2"
                                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                            : incident.severity === "SEV-3"
                                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                : "bg-green-500/10 text-green-400 border border-green-500/20"
                                        }`}
                                >
                                    {incident.severity}
                                </span>

                                <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${incident.status === "INVESTIGATING"
                                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                        : incident.status === "IDENTIFIED"
                                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                            : incident.status === "MITIGATING"
                                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                : incident.status === "MONITORING"
                                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                    : "bg-green-500/10 text-green-400 border border-green-500/20"
                                        }`}
                                >
                                    {incident.status}
                                </span>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <p className="text-slate-500">
                            Loading incidents...
                        </p>
                    )}

                    {!loading && incidents.length === 0 && (
                        <p className="text-slate-500">
                            No incidents found.
                        </p>
                    )}
                </div>
            </div>
            <div className="mt-8 max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold">
                    Quick Actions
                </h2>

                <p className="text-slate-400 text-sm mt-1">
                    Quickly access common incident management tasks.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div
                        onClick={() => router.push("/incidents/create")}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition"
                    >
                        <h3 className="font-medium">
                            Create Incident
                        </h3>

                        <p className="text-sm text-slate-400 mt-2">
                            Report a new incident and start tracking it.
                        </p>
                    </div>

                    <div
                        onClick={() => router.push("/incidents")}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition"
                    >
                        <h3 className="font-medium">
                            View All Incidents
                        </h3>

                        <p className="text-sm text-slate-400 mt-2">
                            Browse and manage all reported incidents.
                        </p>
                    </div>

                    <div
                        onClick={() => router.push("/analytics")}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer hover:border-slate-700 transition"
                    >
                        <h3 className="font-medium">
                            View Analytics
                        </h3>

                        <p className="text-sm text-slate-400 mt-2">
                            Explore incident trends and service performance.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}