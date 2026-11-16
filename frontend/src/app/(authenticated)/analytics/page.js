"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { useOrganization } from "../../context/OrganizationContext";
import {
    ArrowDownUp,
    Check,
    ChevronDown,
    Activity,
    BarChart3,
    Target,
    CheckCircle2,
    AlertTriangle,
    Server,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const severityConfig = {
    "SEV-1": {
        color: "#B83232",
        label: "Critical",
        description: "Critical impact",
    },
    "SEV-2": {
        color: "#D45B27",
        label: "High",
        description: "Major impact",
    },
    "SEV-3": {
        color: "#A77B24",
        label: "Medium",
        description: "Moderate impact",
    },
    "SEV-4": {
        color: "#39785C",
        label: "Low",
        description: "Minor impact",
    },
};

const chartTheme = {
    background: "transparent",
    text: {
        fill: "#756B69",
        fontSize: 11,
        fontFamily: "inherit",
    },
    axis: {
        domain: {
            line: {
                stroke: "#D7DDD2",
                strokeWidth: 1,
            },
        },
        ticks: {
            line: {
                stroke: "#D7DDD2",
            },
            text: {
                fill: "#756B69",
                fontSize: 11,
            },
        },
    },
    grid: {
        line: {
            stroke: "#E9E9DF",
            strokeWidth: 1,
            strokeDasharray: "3 5",
        },
    },
    tooltip: {
        container: {
            background: "#FFFEFA",
            color: "#4B1B27",
            fontSize: 12,
            border: "1px solid #D7DDD2",
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(75,27,39,0.12)",
        },
    },
};

function Icon({ name, size = 18 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.7,
        strokeLinecap: "round",
        strokeLinejoin: "round",
    };

    const icons = {
        activity: <path d="M3 12h4l3-8 4 16 3-8h4" />,
        alert: (
            <>
                <path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
            </>
        ),
        check: <path d="m5 12 4 4L19 6" />,
        clock: (
            <>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </>
        ),
        arrow: (
            <>
                <path d="M7 17 17 7" />
                <path d="M7 7h10v10" />
            </>
        ),
        layers: (
            <>
                <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                <path d="m3 12 9 5 9-5" />
                <path d="m3 16 9 5 9-5" />
            </>
        ),
        refresh: (
            <>
                <path d="M20 7v5h-5" />
                <path d="M4 17v-5h5" />
                <path d="M5.6 9a7 7 0 0 1 12-2L20 12" />
                <path d="M18.4 15a7 7 0 0 1-12 2L4 12" />
            </>
        ),
    };

    return <svg {...common}>{icons[name]}</svg>;
}

function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString("en-US") : "0";
}

function formatResolutionTime(value) {
    const hours = Number(value);

    if (!Number.isFinite(hours) || hours <= 0) return "—";
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;

    return `${(hours / 24).toFixed(1)}d`;
}

function Panel({ children, className = "" }) {
    return (
        <section
            className={`rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] shadow-[0_8px_30px_rgba(75,27,39,0.045)] ${className}`}
        >
            {children}
        </section>
    );
}

function PanelHeader({ eyebrow, title, description, right }) {
    return (
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div>
                {eyebrow && (
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                        {eyebrow}
                    </p>
                )}

                <h2 className="text-lg font-bold tracking-tight text-[#4B1B27]">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1.5 text-xs leading-5 text-[#817674]">
                        {description}
                    </p>
                )}
            </div>

            {right}
        </div>
    );
}

function MetricCard({ label, value, description, icon, color, index }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#FF6B1A]/40 hover:shadow-xl hover:shadow-[#4B1B27]/[0.08] sm:p-6">
            <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.08] blur-3xl transition-opacity group-hover:opacity-[0.16]"
                style={{ backgroundColor: color }}
            />

            <div className="relative flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#817674]">
                    {label}
                </span>

                <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl border"
                    style={{
                        color,
                        borderColor: `${color}35`,
                        backgroundColor: `${color}12`,
                    }}
                >
                    <Icon name={icon} size={17} />
                </div>
            </div>

            <div className="relative mt-7">
                <p className="text-3xl font-bold tracking-tight text-[#4B1B27] sm:text-[34px]">
                    {value}
                </p>

                <p className="mt-2 text-xs text-[#938785]">
                    {description}
                </p>
            </div>

            <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#E9E9DF]">
                <div
                    className="h-full transition-all duration-700"
                    style={{
                        width: `${25 + index * 13}%`,
                        backgroundColor: color,
                        opacity: 0.8,
                    }}
                />
            </div>
        </div>
    );
}

function ChartTooltip({ title, value }) {
    return (
        <div className="rounded-lg border border-[#D7DDD2] bg-[#FFFEFA] px-3 py-2 shadow-xl shadow-[#4B1B27]/10">
            <p className="text-[10px] text-[#817674]">{title}</p>
            <p className="mt-1 text-sm font-bold text-[#4B1B27]">
                {formatNumber(value)} incidents
            </p>
        </div>
    );
}

export default function AnalyticsPage() {
    const { activeOrganization } = useOrganization();
    const [userRole, setUserRole] = useState("");
    const router = useRouter();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setUserRole(user.role || "");
    }, []);

    const [severityData, setSeverityData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [serviceData, setServiceData] = useState([]);
    const [organizationComparison, setOrganizationComparison] = useState([]);
    const [organizationSort, setOrganizationSort] = useState("total");
    const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

    const sortedOrganizationComparison = [...organizationComparison].sort((a, b) => {
        if (organizationSort === "active") {
            return Number(b.active_incidents || 0) - Number(a.active_incidents || 0);
        }

        if (organizationSort === "resolution") {
            const aTotal = Number(a.total_incidents) || 0;
            const bTotal = Number(b.total_incidents) || 0;

            const aRate = aTotal > 0
                ? Number(a.resolved_incidents || 0) / aTotal
                : 0;

            const bRate = bTotal > 0
                ? Number(b.resolved_incidents || 0) / bTotal
                : 0;

            return bRate - aRate;
        }

        return Number(b.total_incidents || 0) - Number(a.total_incidents || 0);
    });

    const [stats, setStats] = useState({
        total_incidents: 0,
        active_incidents: 0,
        resolved_incidents: 0,
        average_resolution_hours: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        if (userRole !== "platform_admin" && !activeOrganization?.id) {
            setLoading(true);
            return;
        }

        let isMounted = true;

        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError("");
                setLastUpdated(null);

                setSeverityData([]);
                setTrendData([]);
                setServiceData([]);
                setStats({
                    total_incidents: 0,
                    active_incidents: 0,
                    resolved_incidents: 0,
                    average_resolution_hours: 0,
                });

                const token = localStorage.getItem("token");

                if (!token) {
                    throw new Error(
                        "Your session has expired. Please sign in again."
                    );
                }

                const organizationId =
                    userRole === "platform_admin"
                        ? null
                        : activeOrganization.id;

                const endpoints = [
                    { key: "severity", url: "/api/analytics/incidents-by-severity" },
                    { key: "stats", url: "/api/analytics/stats" },
                    { key: "trends", url: "/api/analytics/incident-trends" },
                    { key: "services", url: "/api/analytics/incidents-by-service" },

                    ...(userRole === "platform_admin"
                        ? [{
                            key: "organizationComparison",
                            url: "/api/analytics/organization-comparison"
                        }]
                        : []),
                ];

                const results = await Promise.allSettled(
                    endpoints.map(async ({ key, url }) => {
                        const response = await fetch(
                            `${API_URL}${url}${organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : ""}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                        if (!response.ok) {
                            const message = await response.text();

                            throw new Error(
                                `${key} request failed (${response.status}): ${message}`
                            );
                        }

                        const result = await response.json();

                        return {
                            key,
                            data: result.data,
                        };
                    })
                );

                if (!isMounted) return;

                let failedRequests = 0;

                results.forEach((result) => {
                    if (result.status === "rejected") {
                        failedRequests++;
                        console.error(
                            "Analytics request failed:",
                            result.reason
                        );
                        return;
                    }

                    const { key, data } = result.value;

                    switch (key) {
                        case "severity":
                            setSeverityData(
                                Array.isArray(data) ? data : []
                            );
                            break;

                        case "stats":
                            setStats((previous) => ({
                                ...previous,
                                ...(data || {}),
                            }));
                            break;

                        case "trends":
                            setTrendData(
                                Array.isArray(data) ? data : []
                            );
                            break;

                        case "services":
                            setServiceData(
                                Array.isArray(data) ? data : []
                            );
                            break;

                        case "organizationComparison":
                            setOrganizationComparison(
                                Array.isArray(data) ? data : []
                            );
                            break;

                        default:
                            break;
                    }
                });

                if (failedRequests === endpoints.length) {
                    setError(
                        "Analytics data could not be loaded. Please try again."
                    );
                } else if (failedRequests > 0) {
                    setError(
                        "Some analytics sections could not be updated."
                    );
                }

                setLastUpdated(new Date());
            } catch (err) {
                console.error("Analytics error:", err);

                if (isMounted) {
                    setError(
                        err.message || "Unable to load analytics."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchAnalytics();

        return () => {
            isMounted = false;
        };
    }, [activeOrganization?.id, userRole]);

    const formattedTrendData = useMemo(() => {
        const points = trendData
            .filter(
                (item) =>
                    item.date &&
                    item.count !== null &&
                    item.count !== undefined &&
                    Number.isFinite(Number(item.count))
            )
            .map((item) => {
                const date = new Date(item.date);

                return {
                    x: Number.isNaN(date.getTime())
                        ? String(item.date)
                        : date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        }),
                    y: Number(item.count),
                };
            });

        return [{ id: "Incidents", data: points }];
    }, [trendData]);

    const totalSeverity = severityData.reduce(
        (sum, item) => sum + (Number(item.count) || 0),
        0
    );

    const totalServiceIncidents = serviceData.reduce(
        (sum, item) => sum + (Number(item.count) || 0),
        0
    );

    const severityChartData = useMemo(
        () =>
            severityData.map((item) => ({
                id: item.severity,
                label: item.severity,
                value: Number(item.count) || 0,
                color: severityConfig[item.severity]?.color || "#64748b",
            })),
        [severityData]
    );

    const sortedServices = useMemo(
        () =>
            [...serviceData].sort(
                (a, b) => Number(b.count) - Number(a.count)
            ),
        [serviceData]
    );

    const metrics = [
        {
            label: "Total Incidents",
            value: 42,
            description: "All recorded incidents",
            color: "#4B1B27",
            icon: <Activity size={15} strokeWidth={2} />,
        },
        {
            label: "Resolved",
            value: 32,
            description: "Successfully resolved",
            color: "#39785C",
            icon: <CheckCircle2 size={15} strokeWidth={2} />,
        },
        {
            label: "Active Incidents",
            value: 10,
            description: "Require attention",
            color: "#D45B27",
            icon: <AlertTriangle size={15} strokeWidth={2} />,
        },
        {
            label: "Services",
            value: 8,
            description: "Registered services",
            color: "#A77B24",
            icon: <Server size={15} strokeWidth={2} />,
        },
    ];

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#E9E9DF] px-4 py-7 text-[#4B1B27] sm:px-7 lg:px-9">
            <div className="mx-auto max-w-[1500px]">

                {/* HEADER */}
                <header className="relative mb-9 overflow-hidden rounded-[28px] border border-[#4B1B27] bg-[#4B1B27] px-6 py-8 text-white shadow-[0_20px_55px_rgba(75,27,39,0.16)] sm:px-9 sm:py-10">

                    <div className="pointer-events-none absolute -right-20 -top-36 h-80 w-80 rounded-full border border-white/[0.07]" />
                    <div className="pointer-events-none absolute -right-5 -top-20 h-64 w-64 rounded-full border border-white/[0.07]" />
                    <div className="pointer-events-none absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-[#FF6B1A]/15 blur-[90px]" />

                    <div className="relative flex flex-wrap items-end justify-between gap-6">
                        <div className="max-w-2xl">
                            <div className="mb-5 flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF6B1A]/30 bg-[#FF6B1A]/15 text-[#FF8A48]">
                                    <Icon name="activity" size={17} />
                                </span>

                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF8A48]">
                                    Incident intelligence
                                </span>
                            </div>

                            <h1 className="text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl lg:text-[46px]">
                                Analytics{" "}
                                <span className="text-[#FF8A48]">
                                    & insights.
                                </span>
                            </h1>

                            <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
                                A deeper view into incident activity, severity
                                distribution, and service-level patterns across
                                your organization.
                            </p>
                        </div>

                        <div className="relative flex flex-col items-start gap-3 sm:items-end">
                            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-2">
                                <span
                                    className={`h-2 w-2 rounded-full ${loading
                                        ? "animate-pulse bg-amber-400"
                                        : "bg-emerald-400"
                                        }`}
                                />

                                <span className="text-[11px] font-semibold text-white/80">
                                    {loading ? "Loading data" : "Data available"}
                                </span>
                            </div>

                            <p className="text-[10px] text-white/45">
                                {lastUpdated
                                    ? `Updated ${lastUpdated.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}`
                                    : "Preparing analytics"}
                            </p>
                        </div>
                    </div>

                    <div className="relative mt-9 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5">
                        <div className="flex items-center gap-2 text-xs text-white/55">
                            <Activity size={14} className="text-[#FF8A48]" />
                            Incident activity
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/55">
                            <Target size={14} className="text-[#FF8A48]" />
                            Performance insights
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/55">
                            <Server size={14} className="text-[#FF8A48]" />
                            Service intelligence
                        </div>
                    </div>
                </header>

                {!activeOrganization && userRole !== "platform_admin" && (
                    <div className="mb-7 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Select an organization to view its analytics.
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mb-7 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    >
                        <Icon name="alert" size={17} />
                        {error}
                    </div>
                )}

                {/* KPI METRICS */}
                <section className="mb-10">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                                Performance overview
                            </p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-[#4B1B27]">
                                At a glance
                            </h2>
                        </div>

                        <span className="hidden rounded-full border border-[#4B1B27]/10 bg-[#FFFEFA] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#756B69] sm:inline-flex">
                            Organization metrics
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                        {metrics.map((metric) => (
                            <div
                                key={metric.label}
                                className="group relative overflow-hidden rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B1A]/40 hover:shadow-xl hover:shadow-[#4B1B27]/[0.08] sm:p-5"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[11px] font-semibold text-[#756B69]">
                                        {metric.label}
                                    </p>

                                    <span
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                        style={{
                                            color: metric.color,
                                            backgroundColor: `${metric.color}15`,
                                        }}
                                    >
                                        {metric.icon}
                                    </span>
                                </div>

                                <p
                                    className="mt-5 text-3xl font-bold tracking-tight tabular-nums"
                                    style={{ color: metric.color }}
                                >
                                    {metric.value}
                                </p>

                                <p className="mt-1 text-[10px] text-[#938785]">
                                    {metric.description}
                                </p>

                                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#E9E9DF]">
                                    <div
                                        className="h-full w-0 transition-all duration-500 group-hover:w-full"
                                        style={{ backgroundColor: metric.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ORGANIZATION COMPARISON */}
                {userRole === "platform_admin" && (
                    <Panel className="mb-8 overflow-hidden p-0">

                        <div className="relative overflow-hidden bg-[#4B1B27] px-5 py-7 text-white sm:px-7">
                            <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/[0.07]" />
                            <div className="pointer-events-none absolute -right-4 -top-16 h-48 w-48 rounded-full bg-[#FF6B1A]/10 blur-[65px]" />

                            <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#FF6B1A]/30 bg-[#FF6B1A]/15 text-[#FF8A48]">
                                            <Icon name="layers" size={15} />
                                        </span>

                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF8A48]">
                                            Platform intelligence / 01
                                        </span>
                                    </div>

                                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                                        Organization performance
                                    </h2>

                                    <p className="mt-2 max-w-xl text-xs leading-6 text-white/55 sm:text-sm">
                                        Monitor incident distribution, operational workload,
                                        and resolution performance across your organization network.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-2">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                                            Platform overview
                                        </span>
                                    </div>

                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsSortMenuOpen((prev) => !prev)}
                                            className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-2.5 text-left transition-all duration-300 hover:border-[#FF6B1A]/50 hover:bg-white/10"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B1A]/15 text-[#FF8A48]">
                                                <ArrowDownUp size={15} />
                                            </div>

                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
                                                    Sort organizations
                                                </p>

                                                <p className="mt-0.5 text-xs font-bold text-white">
                                                    {organizationSort === "active"
                                                        ? "Most active"
                                                        : organizationSort === "resolution"
                                                            ? "Best resolution rate"
                                                            : "Highest incidents"}
                                                </p>
                                            </div>

                                            <ChevronDown
                                                size={15}
                                                className={`ml-2 text-white/60 transition-transform duration-300 ${isSortMenuOpen ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>

                                        {isSortMenuOpen && (
                                            <div className="absolute right-0 top-full z-30 mt-3 w-64 overflow-hidden rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-2 shadow-2xl shadow-[#4B1B27]/20">
                                                <p className="px-3 pb-2 pt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#938785]">
                                                    Ranking preference
                                                </p>

                                                {[
                                                    {
                                                        value: "total",
                                                        label: "Highest incidents",
                                                        description: "Rank by total incident volume",
                                                        icon: BarChart3,
                                                    },
                                                    {
                                                        value: "active",
                                                        label: "Most active",
                                                        description: "Rank by unresolved workload",
                                                        icon: Activity,
                                                    },
                                                    {
                                                        value: "resolution",
                                                        label: "Best resolution rate",
                                                        description: "Rank by resolved percentage",
                                                        icon: Target,
                                                    },
                                                ].map((option) => {
                                                    const OptionIcon = option.icon;
                                                    const isSelected = organizationSort === option.value;

                                                    return (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setOrganizationSort(option.value);
                                                                setIsSortMenuOpen(false);
                                                            }}
                                                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 ${isSelected
                                                                ? "bg-[#FF6B1A]/[0.08] ring-1 ring-inset ring-[#FF6B1A]/20"
                                                                : "hover:bg-[#E9E9DF]"
                                                                }`}
                                                        >
                                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isSelected
                                                                ? "bg-[#FF6B1A]/10 text-[#C65320]"
                                                                : "bg-[#E9E9DF] text-[#756B69]"
                                                                }`}>
                                                                <OptionIcon size={16} />
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className={`text-xs font-bold ${isSelected
                                                                    ? "text-[#A94B20]"
                                                                    : "text-[#4B1B27]"
                                                                    }`}>
                                                                    {option.label}
                                                                </p>

                                                                <p className="mt-1 text-[10px] text-[#938785]">
                                                                    {option.description}
                                                                </p>
                                                            </div>

                                                            {isSelected && (
                                                                <Check size={15} className="shrink-0 text-[#FF6B1A]" />
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex h-64 items-center justify-center text-sm text-[#8B807E]">
                                Loading organization intelligence...
                            </div>
                        ) : organizationComparison.length > 0 ? (
                            <>
                                {/* SUMMARY METRICS */}
                                <div className="grid grid-cols-1 gap-px border-b border-[#D7DDD2] bg-[#D7DDD2] sm:grid-cols-3">

                                    <div className="bg-[#FFFEFA] px-5 py-5 sm:px-7">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#938785]">
                                                Organizations tracked
                                            </p>
                                            <span className="text-[#4B1B27]">
                                                <Icon name="layers" size={16} />
                                            </span>
                                        </div>

                                        <p className="mt-3 text-3xl font-bold tracking-tight text-[#4B1B27]">
                                            {formatNumber(organizationComparison.length)}
                                        </p>

                                        <p className="mt-1 text-[10px] text-[#938785]">
                                            Across the platform
                                        </p>
                                    </div>

                                    <div className="bg-[#FFFEFA] px-5 py-5 sm:px-7">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#938785]">
                                                Total incident volume
                                            </p>
                                            <span className="text-[#FF6B1A]">
                                                <Icon name="activity" size={16} />
                                            </span>
                                        </div>

                                        <p className="mt-3 text-3xl font-bold tracking-tight text-[#4B1B27]">
                                            {formatNumber(
                                                organizationComparison.reduce(
                                                    (sum, org) => sum + Number(org.total_incidents || 0),
                                                    0
                                                )
                                            )}
                                        </p>

                                        <p className="mt-1 text-[10px] text-[#938785]">
                                            Reported incidents across organizations
                                        </p>
                                    </div>

                                    <div className="bg-[#FFFEFA] px-5 py-5 sm:px-7">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#938785]">
                                                Active workload
                                            </p>
                                            <span className="text-[#A77B24]">
                                                <Icon name="alert" size={16} />
                                            </span>
                                        </div>

                                        <p className="mt-3 text-3xl font-bold tracking-tight text-[#A77B24]">
                                            {formatNumber(
                                                organizationComparison.reduce(
                                                    (sum, org) => sum + Number(org.active_incidents || 0),
                                                    0
                                                )
                                            )}
                                        </p>

                                        <p className="mt-1 text-[10px] text-[#938785]">
                                            Incidents requiring attention
                                        </p>
                                    </div>
                                </div>

                                {/* COMPARISON CONTENT */}
                                <div className="px-5 py-6 sm:px-7">
                                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-[#4B1B27]">
                                                Incident distribution
                                            </h3>
                                            <p className="mt-1 text-[11px] text-[#938785]">
                                                Organization-level workload and resolution breakdown
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-[#A77B24]" />
                                                <span className="text-[10px] text-[#756B69]">Active</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-[#39785C]" />
                                                <span className="text-[10px] text-[#756B69]">Resolved</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="hidden grid-cols-[minmax(180px,1.3fr)_minmax(180px,1.5fr)_90px_100px] gap-5 border-y border-[#4B1B27]/10 bg-[#E9E9DF] px-4 py-3 md:grid">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#756B69]">
                                            Organization
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#756B69]">
                                            Incident distribution
                                        </span>
                                        <span className="text-right text-[9px] font-bold uppercase tracking-[0.16em] text-[#756B69]">
                                            Total
                                        </span>
                                        <span className="text-right text-[9px] font-bold uppercase tracking-[0.16em] text-[#756B69]">
                                            Resolved
                                        </span>
                                    </div>

                                    <div className="divide-y divide-[#4B1B27]/[0.07]">
                                        {sortedOrganizationComparison.map((org, index) => {
                                            const total = Number(org.total_incidents) || 0;
                                            const active = Number(org.active_incidents) || 0;
                                            const resolved = Number(org.resolved_incidents) || 0;

                                            const activePercentage =
                                                total > 0 ? (active / total) * 100 : 0;

                                            const resolvedPercentage =
                                                total > 0 ? (resolved / total) * 100 : 0;

                                            const resolutionRate =
                                                total > 0 ? resolvedPercentage : 0;

                                            const maxTotal = Math.max(
                                                1,
                                                ...organizationComparison.map(
                                                    (item) => Number(item.total_incidents) || 0
                                                )
                                            );

                                            const volumeWidth = (total / maxTotal) * 100;

                                            return (
                                                <div
                                                    key={org.organization_id}
                                                    onClick={() =>
                                                        router.push(`/platform-admin/organizations/${org.organization_id}`)
                                                    }
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            router.push(`/platform-admin/organizations/${org.organization_id}`);
                                                        }
                                                    }}
                                                    className="group grid cursor-pointer grid-cols-1 gap-4 px-3 py-5 transition-all duration-300 hover:bg-[#E9E9DF]/70 md:grid-cols-[minmax(180px,1.3fr)_minmax(180px,1.5fr)_90px_100px] md:items-center md:gap-5 md:px-4"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FF6B1A]/20 bg-[#FF6B1A]/10 text-xs font-bold text-[#A94B20]">
                                                            {String(index + 1).padStart(2, "0")}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-[#4B1B27] transition group-hover:text-[#C65320]">
                                                                {org.organization_name}
                                                            </p>
                                                            <p className="mt-1 text-[10px] text-[#938785]">
                                                                Organization #{org.organization_id}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <span className="text-[10px] text-[#938785]">
                                                                Resolution rate
                                                            </span>
                                                            <span className="text-[10px] font-bold tabular-nums text-[#39785C]">
                                                                {resolutionRate.toFixed(1)}%
                                                            </span>
                                                        </div>

                                                        <div className="flex h-2 overflow-hidden rounded-full bg-[#E9E9DF]">
                                                            <div
                                                                className="h-full rounded-l-full bg-[#A77B24] transition-all duration-700"
                                                                style={{
                                                                    width: `${activePercentage}%`,
                                                                }}
                                                            />
                                                            <div
                                                                className="h-full rounded-r-full bg-[#39785C] transition-all duration-700"
                                                                style={{
                                                                    width: `${resolvedPercentage}%`,
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="mt-2 flex items-center justify-between gap-2">
                                                            <span className="text-[10px] text-[#A77B24]">
                                                                {formatNumber(active)} active
                                                            </span>
                                                            <span className="text-[10px] text-[#39785C]">
                                                                {formatNumber(resolved)} resolved
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between md:block md:text-right">
                                                        <span className="text-[10px] text-[#938785] md:hidden">
                                                            Total incidents
                                                        </span>
                                                        <div>
                                                            <p className="text-base font-bold tabular-nums text-[#4B1B27]">
                                                                {formatNumber(total)}
                                                            </p>
                                                            <div className="ml-auto mt-1 h-1 w-14 overflow-hidden rounded-full bg-[#E9E9DF]">
                                                                <div
                                                                    className="h-full rounded-full bg-[#FF6B1A] transition-all duration-700"
                                                                    style={{
                                                                        width: `${volumeWidth}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between md:block md:text-right">
                                                        <span className="text-[10px] text-[#938785] md:hidden">
                                                            Resolved incidents
                                                        </span>
                                                        <p className="text-sm font-bold tabular-nums text-[#39785C]">
                                                            {formatNumber(resolved)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#4B1B27]/10 pt-4">
                                        <p className="text-[10px] text-[#938785]">
                                            Comparing {organizationComparison.length} organizations
                                        </p>

                                        <div className="flex items-center gap-2 text-[10px] text-[#817674]">
                                            <Icon name="activity" size={13} />
                                            <span>
                                                Ranked by {
                                                    organizationSort === "active"
                                                        ? "active incidents"
                                                        : organizationSort === "resolution"
                                                            ? "resolution rate"
                                                            : "total incident volume"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-64 flex-col items-center justify-center px-5 text-center">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#4B1B27]/10 bg-[#E9E9DF] text-[#4B1B27]">
                                    <Icon name="layers" size={21} />
                                </div>

                                <p className="text-sm font-bold text-[#4B1B27]">
                                    No organization data available
                                </p>

                                <p className="mt-2 text-xs text-[#938785]">
                                    Organization incident statistics will appear here when data is available.
                                </p>
                            </div>
                        )}
                    </Panel>
                )}

                {/* MAIN ACTIVITY CHART */}
                <Panel className="mb-6 p-5 sm:p-7 lg:p-8">
                    <PanelHeader
                        eyebrow="01 / Activity intelligence"
                        title="Incident activity"
                        description="Daily incident volume across the available reporting period."
                        right={
                            <div className="flex items-center gap-2 rounded-lg border border-[#4B1B27]/10 bg-[#E9E9DF] px-3 py-2">
                                <span className="h-2 w-2 rounded-full bg-[#FF6B1A]" />
                                <span className="text-[10px] font-semibold text-[#4B1B27]">
                                    Incident volume
                                </span>
                            </div>
                        }
                    />

                    <div className="mb-5 flex flex-wrap items-center gap-6 border-y border-[#4B1B27]/10 py-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#938785]">
                                Data points
                            </p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-[#4B1B27]">
                                {formattedTrendData[0].data.length}
                            </p>
                        </div>

                        <div className="h-8 w-px bg-[#D7DDD2]" />

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#938785]">
                                Incidents in trend
                            </p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-[#4B1B27]">
                                {formatNumber(
                                    formattedTrendData[0].data.reduce(
                                        (sum, point) => sum + point.y,
                                        0
                                    )
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full sm:h-[360px]">
                        {loading ? (
                            <div className="flex h-full items-center justify-center text-sm text-[#938785]">
                                Loading incident activity...
                            </div>
                        ) : formattedTrendData[0].data.length > 0 ? (
                            <ResponsiveLine
                                data={formattedTrendData}
                                margin={{
                                    top: 20,
                                    right: 20,
                                    bottom: 45,
                                    left: 45,
                                }}
                                xScale={{ type: "point" }}
                                yScale={{
                                    type: "linear",
                                    min: 0,
                                    max: "auto",
                                    stacked: false,
                                }}
                                curve="monotoneX"
                                colors={["#FF6B1A"]}
                                lineWidth={3}
                                enableArea={true}
                                areaBaselineValue={0}
                                areaOpacity={0.12}
                                enablePoints={true}
                                pointSize={7}
                                pointColor="#FF6B1A"
                                pointBorderWidth={2}
                                pointBorderColor="#FFFEFA"
                                useMesh={true}
                                enableGridX={false}
                                enableGridY={true}
                                axisBottom={{
                                    tickPadding: 13,
                                    tickSize: 0,
                                }}
                                axisLeft={{
                                    tickPadding: 12,
                                    tickSize: 0,
                                    tickValues: 5,
                                    format: (value) => Math.round(value),
                                }}
                                enableCrosshair={true}
                                crosshairType="x"
                                theme={chartTheme}
                                tooltip={({ point }) => (
                                    <ChartTooltip
                                        title={point.data.x}
                                        value={point.data.y}
                                    />
                                )}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#4B1B27]/15 bg-[#E9E9DF]/60 text-sm text-[#938785]">
                                No incident activity available for this period.
                            </div>
                        )}
                    </div>
                </Panel>

                {/* SEVERITY AND SERVICE */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

                    {/* SEVERITY */}
                    <Panel className="p-5 sm:p-7">
                        <PanelHeader
                            eyebrow="02 / Risk intelligence"
                            title="Severity distribution"
                            description="Understand the concentration of incidents by severity."
                            right={
                                <span className="rounded-lg border border-[#4B1B27]/10 bg-[#E9E9DF] px-3 py-2 text-xs font-bold text-[#4B1B27]">
                                    {formatNumber(totalSeverity)} total
                                </span>
                            }
                        />

                        {loading ? (
                            <div className="flex h-[280px] items-center justify-center text-sm text-[#938785]">
                                Loading severity distribution...
                            </div>
                        ) : severityChartData.length > 0 ? (
                            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                                <div className="relative h-[235px] min-w-0">
                                    <ResponsivePie
                                        data={severityChartData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            bottom: 10,
                                            left: 10,
                                        }}
                                        innerRadius={0.76}
                                        padAngle={2}
                                        cornerRadius={4}
                                        activeOuterRadiusOffset={7}
                                        colors={{ datum: "data.color" }}
                                        enableArcLinkLabels={false}
                                        enableArcLabels={false}
                                        borderWidth={0}
                                        animate={true}
                                        theme={chartTheme}
                                        tooltip={({ datum }) => (
                                            <ChartTooltip
                                                title={datum.id}
                                                value={datum.value}
                                            />
                                        )}
                                    />

                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#938785]">
                                            Total
                                        </span>
                                        <span className="mt-1 text-3xl font-bold tracking-tight text-[#4B1B27]">
                                            {formatNumber(totalSeverity)}
                                        </span>
                                        <span className="mt-1 text-[10px] text-[#938785]">
                                            Incidents
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {severityChartData.map((item) => {
                                        const percentage =
                                            totalSeverity > 0
                                                ? (item.value / totalSeverity) * 100
                                                : 0;

                                        const config =
                                            severityConfig[item.id] || {};

                                        return (
                                            <div key={item.id}>
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-sm"
                                                            style={{
                                                                backgroundColor: item.color,
                                                            }}
                                                        />

                                                        <div>
                                                            <p className="text-xs font-bold text-[#4B1B27]">
                                                                {item.id}
                                                                <span className="ml-2 font-medium text-[#938785]">
                                                                    {config.label || "Other"}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span className="text-xs font-bold tabular-nums text-[#4B1B27]">
                                                        {formatNumber(item.value)}
                                                    </span>
                                                </div>

                                                <div className="h-1.5 overflow-hidden rounded-full bg-[#E9E9DF]">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-700"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: item.color,
                                                        }}
                                                    />
                                                </div>

                                                <p className="mt-1.5 text-[10px] text-[#938785]">
                                                    {percentage.toFixed(1)}% of reported incidents
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-[260px] items-center justify-center text-sm text-[#938785]">
                                No severity data available.
                            </div>
                        )}
                    </Panel>

                    {/* SERVICES */}
                    <Panel className="p-5 sm:p-7">
                        <PanelHeader
                            eyebrow="03 / Service intelligence"
                            title="Incident concentration"
                            description="Compare incident volume across individual services."
                            right={
                                <span className="rounded-lg border border-[#4B1B27]/10 bg-[#E9E9DF] px-3 py-2 text-xs font-bold text-[#4B1B27]">
                                    {serviceData.length} services
                                </span>
                            }
                        />

                        {loading ? (
                            <div className="flex h-[280px] items-center justify-center text-sm text-[#938785]">
                                Loading service analytics...
                            </div>
                        ) : sortedServices.length > 0 ? (
                            <>
                                <div
                                    className="w-full"
                                    style={{
                                        height: Math.max(245, sortedServices.length * 48),
                                        minWidth: 0,
                                    }}
                                >
                                    <ResponsiveBar
                                        data={sortedServices}
                                        keys={["count"]}
                                        indexBy="service_name"
                                        layout="horizontal"
                                        margin={{
                                            top: 8,
                                            right: 35,
                                            bottom: 8,
                                            left: 165,
                                        }}
                                        padding={0.38}
                                        innerPadding={3}
                                        valueScale={{
                                            type: "linear",
                                            min: 0,
                                        }}
                                        indexScale={{
                                            type: "band",
                                            round: true,
                                        }}
                                        colors={["#FF6B1A"]}
                                        borderRadius={4}
                                        enableLabel={false}
                                        enableGridX={true}
                                        enableGridY={false}
                                        axisTop={null}
                                        axisRight={null}
                                        axisBottom={null}
                                        axisLeft={{
                                            tickSize: 0,
                                            tickPadding: 12,
                                        }}
                                        theme={chartTheme}
                                        tooltip={({ indexValue, value }) => (
                                            <ChartTooltip
                                                title={indexValue}
                                                value={value}
                                            />
                                        )}
                                    />
                                </div>

                                <div className="mt-5 border-t border-[#4B1B27]/10 pt-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#FF6B1A]">
                                            Service ranking
                                        </p>
                                        <p className="text-[10px] text-[#938785]">
                                            By incident volume
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {sortedServices.slice(0, 5).map((item, index) => {
                                            const count = Number(item.count) || 0;

                                            const percentage =
                                                totalServiceIncidents > 0
                                                    ? (count / totalServiceIncidents) * 100
                                                    : 0;

                                            return (
                                                <div
                                                    key={item.service_name}
                                                    className="group flex items-center gap-3"
                                                >
                                                    <span className="w-5 text-[10px] font-bold tabular-nums text-[#A99B96]">
                                                        {String(index + 1).padStart(2, "0")}
                                                    </span>

                                                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#62585A] transition group-hover:text-[#C65320]">
                                                        {item.service_name}
                                                    </span>

                                                    <span className="text-[10px] tabular-nums text-[#938785]">
                                                        {percentage.toFixed(0)}%
                                                    </span>

                                                    <span className="w-8 text-right text-xs font-bold tabular-nums text-[#4B1B27]">
                                                        {formatNumber(count)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-[280px] items-center justify-center text-sm text-[#938785]">
                                No service data available.
                            </div>
                        )}
                    </Panel>
                </div>

                {/* FOOTER */}
                <footer className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[#4B1B27]/15 py-6">
                    <div className="flex items-center gap-2 text-[10px] text-[#938785]">
                        <span className="font-bold tracking-wider text-[#4B1B27]">
                            INCIDENTFLOW
                        </span>
                        <span className="text-[#C5BDB5]">/</span>
                        Analytics intelligence
                    </div>

                    <p className="text-[10px] text-[#938785]">
                        Metrics reflect the data available to your account.
                    </p>
                </footer>
            </div>
        </main>
    );
}
