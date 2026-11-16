"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    CircleAlert,
    Clock3,
    Layers3,
    Plus,
    Server,
    ShieldCheck,
    Zap,
} from "lucide-react";

import { useOrganization } from "../../context/OrganizationContext";
import socket from "../../socket";

const severityConfig = {
    "SEV-1": { color: "#B83232", label: "Critical" },
    "SEV-2": { color: "#D45B27", label: "High" },
    "SEV-3": { color: "#A77B24", label: "Medium" },
    "SEV-4": { color: "#39785C", label: "Low" },
};

const statusConfig = {
    INVESTIGATING: "bg-[#B83232]/10 text-[#B83232] border-[#B83232]/15",
    IDENTIFIED: "bg-[#D45B27]/10 text-[#D45B27] border-[#D45B27]/15",
    MITIGATING: "bg-[#A77B24]/10 text-[#98701E] border-[#A77B24]/15",
    MONITORING: "bg-[#426C91]/10 text-[#426C91] border-[#426C91]/15",
    RESOLVED: "bg-[#39785C]/10 text-[#39785C] border-[#39785C]/15",
};

function formatDate(date) {
    return new Date(date).toLocaleString("en", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function MetricCard({
    number,
    label,
    value,
    detail,
    icon: Icon,
    accent = false,
}) {
    return (
        <div className="group relative overflow-hidden rounded-[22px] border border-[#4B1B27]/[0.09] bg-[#F5F3EA] p-5 shadow-[0_5px_20px_rgba(53,21,31,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B1A]/40 hover:shadow-[0_16px_35px_rgba(53,21,31,0.09)] sm:p-6">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#FF6B1A]/[0.045] blur-2xl transition duration-500 group-hover:bg-[#FF6B1A]/[0.12]" />

            <div className="relative flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#4B1B27] text-[#F5F3EA] transition-all duration-300 group-hover:bg-[#FF6B1A] group-hover:text-white">
                    <Icon size={19} strokeWidth={1.7} />
                </div>

                <span className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#B4A99C]">
                    {number}
                </span>
            </div>

            <div className="relative mt-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#8D8178]">
                    {label}
                </p>

                <div className="mt-2 flex items-baseline gap-2">
                    <h3
                        className={`text-[36px] font-semibold leading-none tracking-[-0.055em] ${accent ? "text-[#FF6B1A]" : "text-[#4B1B27]"
                            }`}
                    >
                        {value ?? 0}
                    </h3>

                    <ArrowUpRight
                        size={15}
                        className="text-[#B5A99D] opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                    />
                </div>

                <p className="mt-2 text-[11px] text-[#A1978D]">
                    {detail}
                </p>
            </div>

            <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#FF6B1A] transition-all duration-500 group-hover:w-full" />
        </div>
    );
}

function SectionHeading({ eyebrow, title, description, action }) {
    return (
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B45B32]">
                    {eyebrow}
                </p>

                <h2 className="mt-2 text-[23px] font-semibold tracking-[-0.045em] text-[#4B1B27] sm:text-[26px]">
                    {title}
                </h2>

                {description && (
                    <p className="mt-1.5 text-[12px] text-[#91857B]">
                        {description}
                    </p>
                )}
            </div>

            {action}
        </div>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const { activeOrganization } = useOrganization();

    const [stats, setStats] = useState({
        active_incidents: 0,
        resolved_incidents: 0,
        resolved_today: 0,
        total_incidents: 0,
        average_resolution_hours: 0,
    });

    const [services, setServices] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [severityData, setSeverityData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const headers = {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        };

        const api = process.env.NEXT_PUBLIC_API_URL;

        const loadDashboard = async () => {
            if (!activeOrganization?.id) {
                setLoading(false);
                return;
            }

            try {
                const organizationId = encodeURIComponent(
                    activeOrganization.id
                );

                const requests = await Promise.allSettled([
                    fetch(
                        `${api}/api/analytics/stats?organization_id=${organizationId}`,
                        { headers }
                    ),
                    fetch(
                        `${api}/api/services?organization_id=${organizationId}`,
                        { headers }
                    ),
                    fetch(
                        `${api}/api/incidents?organization_id=${organizationId}`,
                        { headers }
                    ),
                    fetch(
                        `${api}/api/analytics/incidents-by-severity?organization_id=${organizationId}`,
                        { headers }
                    ),
                ]);

                const [
                    statsResult,
                    servicesResult,
                    incidentsResult,
                    severityResult,
                ] = requests;

                if (
                    statsResult.status === "fulfilled" &&
                    statsResult.value.ok
                ) {
                    const data = await statsResult.value.json();

                    setStats((prev) => ({
                        ...prev,
                        ...data.data,
                    }));
                }

                if (
                    servicesResult.status === "fulfilled" &&
                    servicesResult.value.ok
                ) {
                    const data = await servicesResult.value.json();
                    setServices(data.services || []);
                }

                if (
                    incidentsResult.status === "fulfilled" &&
                    incidentsResult.value.ok
                ) {
                    const data = await incidentsResult.value.json();
                    setIncidents(data.incidents || []);
                }

                if (
                    severityResult.status === "fulfilled" &&
                    severityResult.value.ok
                ) {
                    const data = await severityResult.value.json();
                    setSeverityData(data.data || []);
                }
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        const handleNotificationCreated = (data) => {
            if (
                Number(data.organizationId) ===
                Number(activeOrganization?.id)
            ) {
                loadDashboard();
            }
        };

        const handleIncidentDeleted = (data) => {
            if (
                Number(data.organizationId) ===
                Number(activeOrganization?.id)
            ) {
                loadDashboard();
            }
        };

        socket.on(
            "notification_created",
            handleNotificationCreated
        );

        socket.on(
            "incident_deleted",
            handleIncidentDeleted
        );

        socket.on("connect", loadDashboard);

        loadDashboard();

        return () => {
            socket.off(
                "notification_created",
                handleNotificationCreated
            );

            socket.off(
                "incident_deleted",
                handleIncidentDeleted
            );

            socket.off("connect", loadDashboard);
        };
    }, [activeOrganization?.id]);

    const severityCounts = ["SEV-1", "SEV-2", "SEV-3", "SEV-4"].map(
        (severity) => {
            const item = severityData.find(
                (entry) => entry.severity === severity
            );

            return {
                severity,
                count: Number(item?.count) || 0,
                color: severityConfig[severity].color,
                label: severityConfig[severity].label,
            };
        }
    );

    const severityTotal = severityCounts.reduce(
        (sum, item) => sum + item.count,
        0
    );

    const activeIncidents = incidents.filter(
        (incident) => incident.status !== "RESOLVED"
    );

    const resolutionRate = stats.total_incidents
        ? Math.round(
            (stats.resolved_incidents / stats.total_incidents) * 100
        )
        : 0;

    if (loading) {
        return (
            <main className="min-h-screen flex-1 bg-[#E9E9DF] px-5 py-8 sm:px-8 lg:px-10">
                <div className="mx-auto max-w-[1500px]">
                    <div className="h-[270px] animate-pulse rounded-[28px] bg-[#4B1B27]" />

                    <div className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-[190px] animate-pulse rounded-[22px] bg-[#F5F3EA]"
                            />
                        ))}
                    </div>

                    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="h-[400px] animate-pulse rounded-[24px] bg-[#F5F3EA]" />
                        <div className="h-[400px] animate-pulse rounded-[24px] bg-[#F5F3EA]" />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex-1 overflow-hidden bg-[#E9E9DF] px-5 py-7 text-[#4B1B27] sm:px-8 sm:py-9 lg:px-10">
            <div className="mx-auto max-w-[1500px]">

                {/* HERO */}
                <section className="relative isolate overflow-hidden rounded-[28px] bg-[#4B1B27] px-7 py-9 text-[#F5F3EA] shadow-[0_20px_55px_rgba(75,27,39,0.15)] sm:px-10 sm:py-11 lg:px-12 lg:py-12">
                    <div className="pointer-events-none absolute -right-28 -top-40 h-[430px] w-[430px] rounded-full border border-white/[0.07]" />
                    <div className="pointer-events-none absolute -right-16 -top-28 h-[310px] w-[310px] rounded-full border border-white/[0.08]" />
                    <div className="pointer-events-none absolute right-5 top-[-30px] h-[190px] w-[190px] rounded-full border border-white/[0.09]" />

                    <div className="pointer-events-none absolute -right-10 bottom-[-150px] h-[340px] w-[340px] rounded-full bg-[#FF6B1A]/20 blur-[100px]" />

                    <div className="relative z-10">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5D5C0]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A] shadow-[0_0_10px_#FF6B1A]" />
                                Operations control center
                            </span>

                            <span className="text-[10px] font-medium tracking-wide text-white/40">
                                WORKSPACE / OVERVIEW
                            </span>
                        </div>

                        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                            <div>
                                <h1 className="max-w-[720px] text-[42px] font-semibold leading-[1.04] tracking-[-0.065em] sm:text-[54px] lg:text-[66px]">
                                    Good to see
                                    <br />
                                    <span className="text-[#FF8A4C]">
                                        you.
                                    </span>
                                </h1>

                                <p className="mt-5 max-w-[490px] text-[13px] leading-6 text-[#E6D6D0]/75 sm:text-sm">
                                    Your operational picture, all in one
                                    place. Monitor incidents, track service
                                    health, and stay ahead of what matters.
                                </p>

                                <div className="mt-6 flex flex-wrap items-center gap-2 text-[10px] font-medium text-white/45">
                                    <Building2 size={13} />
                                    <span>
                                        {activeOrganization?.name ||
                                            "Your organization"}
                                    </span>
                                    <span className="mx-1 text-white/20">
                                        /
                                    </span>
                                    <span>Operations workspace</span>
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    router.push("/incidents/create")
                                }
                                className="group inline-flex h-[50px] items-center justify-center gap-3 self-start rounded-xl bg-[#FF6B1A] px-6 text-[12px] font-bold text-white shadow-[0_8px_24px_rgba(255,107,26,0.2)] transition duration-300 hover:-translate-y-1 hover:bg-[#F07836] hover:shadow-[0_12px_30px_rgba(255,107,26,0.3)] lg:self-end"
                            >
                                <Plus size={17} strokeWidth={2.2} />
                                Create new incident
                                <ArrowUpRight
                                    size={15}
                                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                />
                            </button>
                        </div>

                        <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                                INCIDENTFLOW · OPERATIONS
                            </span>

                            <div className="flex items-center gap-2 text-[10px] font-medium text-white/50">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#79B58C]" />
                                Workspace connected
                            </div>
                        </div>
                    </div>
                </section>

                {/* METRICS */}
                <section className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <MetricCard
                        number="01 / MONITOR"
                        label="Active incidents"
                        value={stats.active_incidents}
                        detail="Currently unresolved"
                        icon={Activity}
                    />

                    <MetricCard
                        number="02 / RESOLVED"
                        label="Resolved today"
                        value={stats.resolved_today}
                        detail="Successfully closed today"
                        icon={CheckCircle2}
                    />

                    <MetricCard
                        number="03 / HISTORY"
                        label="Total incidents"
                        value={stats.total_incidents}
                        detail="All recorded incidents"
                        icon={Layers3}
                    />

                    <MetricCard
                        number="04 / SYSTEMS"
                        label="Services"
                        value={services.length}
                        detail="Registered services"
                        icon={Server}
                        accent
                    />
                </section>

                {/* OVERVIEW PANELS */}
                <section className="mt-7 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">

                    {/* Incident activity */}
                    <div className="relative overflow-hidden rounded-[24px] border border-[#4B1B27]/10 bg-[#D7DDD2] p-6 sm:p-7">
                        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#4B1B27]/[0.06]" />
                        <div className="pointer-events-none absolute -right-5 -top-9 h-36 w-36 rounded-full border border-[#4B1B27]/[0.06]" />

                        <div className="relative flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A65A36]">
                                    Live operational picture
                                </p>

                                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[#4B1B27]">
                                    Incident activity
                                </h2>

                                <p className="mt-1 text-[11px] text-[#817B70]">
                                    Current workload across your organization
                                </p>
                            </div>

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4B1B27] text-[#F5F3EA]">
                                <Activity size={18} />
                            </div>
                        </div>

                        <div className="relative mt-8 grid grid-cols-2 gap-5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#817B70]">
                                    Unresolved
                                </p>

                                <p className="mt-2 text-[43px] font-semibold leading-none tracking-[-0.06em] text-[#4B1B27]">
                                    {activeIncidents.length}
                                </p>

                                <div className="mt-3 flex items-center gap-2">
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${activeIncidents.length
                                            ? "bg-[#D45B27]"
                                            : "bg-[#39785C]"
                                            }`}
                                    />

                                    <span className="text-[10px] font-medium text-[#817B70]">
                                        {activeIncidents.length
                                            ? "Needs attention"
                                            : "All clear"}
                                    </span>
                                </div>
                            </div>

                            <div className="border-l border-[#4B1B27]/10 pl-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#817B70]">
                                    Resolved
                                </p>

                                <p className="mt-2 text-[43px] font-semibold leading-none tracking-[-0.06em] text-[#4B1B27]">
                                    {stats.resolved_incidents}
                                </p>

                                <div className="mt-3 flex items-center gap-2">
                                    <CheckCircle2
                                        size={12}
                                        className="text-[#39785C]"
                                    />
                                    <span className="text-[10px] font-medium text-[#817B70]">
                                        Successfully closed
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="relative mt-7 border-t border-[#4B1B27]/10 pt-5">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#817B70]">
                                    Resolution progress
                                </span>

                                <span className="text-xs font-bold text-[#4B1B27]">
                                    {resolutionRate}%
                                </span>
                            </div>

                            <div className="h-[7px] overflow-hidden rounded-full bg-[#4B1B27]/10">
                                <div
                                    className="h-full rounded-full bg-[#FF6B1A] transition-all duration-700"
                                    style={{
                                        width: `${resolutionRate}%`,
                                    }}
                                />
                            </div>

                            <p className="mt-2 text-[10px] text-[#817B70]">
                                {stats.resolved_incidents} of{" "}
                                {stats.total_incidents} incidents resolved
                            </p>
                        </div>
                    </div>

                    {/* Resolution snapshot */}
                    <div className="relative isolate overflow-hidden rounded-[24px] bg-[#4B1B27] p-6 text-[#F5F3EA] sm:p-7">
                        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/[0.08]" />
                        <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full border border-white/[0.08]" />
                        <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-[#FF6B1A]/10 blur-[65px]" />

                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF9869]">
                                    Performance
                                </p>

                                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                                    Resolution snapshot
                                </h2>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-[#FF9869]">
                                <ShieldCheck size={19} />
                            </div>
                        </div>

                        <div className="relative mt-8">
                            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-white/45">
                                Average resolution time
                            </p>

                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-[54px] font-semibold leading-none tracking-[-0.065em] text-white">
                                    {Number(
                                        stats.average_resolution_hours || 0
                                    ).toFixed(1)}
                                </span>

                                <span className="text-sm font-medium text-white/50">
                                    hours
                                </span>
                            </div>

                            <p className="mt-3 text-[11px] text-white/45">
                                Average time taken to resolve incidents
                            </p>
                        </div>

                        <div className="relative mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                                    Closed today
                                </p>

                                <p className="mt-2 text-2xl font-semibold tracking-tight text-[#FF9869]">
                                    {stats.resolved_today}
                                </p>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                                    Total resolved
                                </p>

                                <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
                                    {stats.resolved_incidents}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MAIN CONTENT */}
                <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_330px]">

                    {/* LEFT COLUMN */}
                    <div className="min-w-0 space-y-10">

                        {/* RECENT INCIDENTS */}
                        <section>
                            <SectionHeading
                                eyebrow="Monitoring / 01"
                                title="Recent incidents"
                                description="The latest activity across your infrastructure."
                                action={
                                    <button
                                        onClick={() =>
                                            router.push("/incidents")
                                        }
                                        className="group inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#4B1B27]/15 bg-[#F5F3EA] px-4 py-2.5 text-[11px] font-bold text-[#4B1B27] transition-all hover:border-[#FF6B1A]/40 hover:text-[#FF6B1A]"
                                    >
                                        View all incidents
                                        <ArrowRight
                                            size={14}
                                            className="transition-transform group-hover:translate-x-1"
                                        />
                                    </button>
                                }
                            />

                            <div className="overflow-hidden rounded-[23px] border border-[#4B1B27]/10 bg-[#F5F3EA] shadow-[0_8px_30px_rgba(53,21,31,0.035)]">
                                <div className="hidden grid-cols-[minmax(0,1fr)_105px_125px_105px] gap-4 border-b border-[#4B1B27]/10 bg-[#4B1B27]/[0.035] px-6 py-4 text-[9px] font-bold uppercase tracking-[0.16em] text-[#9B9188] md:grid">
                                    <span>Incident details</span>
                                    <span>Severity</span>
                                    <span>Status</span>
                                    <span className="text-right">
                                        Reported
                                    </span>
                                </div>

                                {incidents.length === 0 ? (
                                    <div className="px-6 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#D7DDD2] text-[#4B1B27]">
                                            <CircleAlert size={23} />
                                        </div>

                                        <h3 className="mt-4 text-sm font-bold text-[#4B1B27]">
                                            No incidents reported
                                        </h3>

                                        <p className="mx-auto mt-2 max-w-[260px] text-[11px] leading-5 text-[#9B9188]">
                                            Your incident activity will appear
                                            here when something needs attention.
                                        </p>

                                        <button
                                            onClick={() =>
                                                router.push(
                                                    "/incidents/create"
                                                )
                                            }
                                            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#4B1B27] px-4 py-2.5 text-[11px] font-bold text-white transition hover:bg-[#FF6B1A]"
                                        >
                                            <Plus size={14} />
                                            Create incident
                                        </button>
                                    </div>
                                ) : (
                                    incidents.slice(0, 6).map((incident) => {
                                        const severity =
                                            severityConfig[
                                            incident.severity
                                            ] || severityConfig["SEV-4"];

                                        const status =
                                            statusConfig[incident.status] ||
                                            "border-[#4B1B27]/10 bg-[#4B1B27]/5 text-[#766B64]";

                                        const serviceName =
                                            services.find(
                                                (service) =>
                                                    service.id ===
                                                    incident.service_id
                                            )?.name || "Unknown service";

                                        return (
                                            <button
                                                key={incident.id}
                                                onClick={() =>
                                                    router.push(
                                                        `/incidents/${incident.id}`
                                                    )
                                                }
                                                className="group grid w-full grid-cols-1 gap-3 border-b border-[#4B1B27]/[0.08] px-5 py-5 text-left transition-all duration-200 last:border-b-0 hover:bg-[#E9E9DF]/70 sm:px-6 md:grid-cols-[minmax(0,1fr)_105px_125px_105px] md:items-center md:gap-4"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className="h-2 w-2 shrink-0 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    incident.status ===
                                                                        "RESOLVED"
                                                                        ? "#39785C"
                                                                        : severity.color,
                                                                boxShadow: `0 0 0 3px ${incident.status ===
                                                                    "RESOLVED"
                                                                    ? "#39785C"
                                                                    : severity.color
                                                                    }18`,
                                                            }}
                                                        />

                                                        <span className="truncate text-[13px] font-bold text-[#4B1B27] transition group-hover:text-[#D45B27]">
                                                            {incident.title}
                                                        </span>

                                                        <span className="hidden shrink-0 font-mono text-[9px] text-[#A1978D] sm:inline">
                                                            #{incident.id}
                                                        </span>
                                                    </div>

                                                    <p className="ml-5 mt-1.5 truncate text-[10px] text-[#9B9188]">
                                                        {serviceName}
                                                        <span className="mx-1.5 text-[#C5B9AD]">
                                                            /
                                                        </span>
                                                        {incident.environment}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="h-1.5 w-1.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                severity.color,
                                                        }}
                                                    />

                                                    <span
                                                        className="text-[10px] font-bold"
                                                        style={{
                                                            color: severity.color,
                                                        }}
                                                    >
                                                        {incident.severity}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span
                                                        className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-[9px] font-bold tracking-wide ${status}`}
                                                    >
                                                        {incident.status}
                                                    </span>
                                                </div>

                                                <span className="text-[10px] font-medium text-[#9B9188] md:text-right">
                                                    {formatDate(
                                                        incident.created_at
                                                    )}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}

                                {incidents.length > 6 && (
                                    <button
                                        onClick={() =>
                                            router.push("/incidents")
                                        }
                                        className="flex w-full items-center justify-center gap-2 border-t border-[#4B1B27]/10 bg-[#4B1B27]/[0.025] py-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#766B64] transition hover:bg-[#D7DDD2] hover:text-[#4B1B27]"
                                    >
                                        Explore all {incidents.length} incidents
                                        <ArrowRight size={13} />
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* SEVERITY DISTRIBUTION */}
                        <section>
                            <SectionHeading
                                eyebrow="Risk intelligence / 02"
                                title="Severity distribution"
                                description="Understand how incident priorities are distributed."
                            />

                            <div className="rounded-[23px] border border-[#4B1B27]/10 bg-[#F5F3EA] p-6 shadow-[0_8px_30px_rgba(53,21,31,0.025)] sm:p-7">
                                <div className="flex flex-wrap items-end justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9B9188]">
                                            Total classified incidents
                                        </p>

                                        <p className="mt-2 text-[36px] font-semibold leading-none tracking-[-0.055em] text-[#4B1B27]">
                                            {severityTotal}
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-[#D7DDD2] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#4B1B27]">
                                        4 priority levels
                                    </span>
                                </div>

                                <div className="mt-7 flex h-[12px] w-full overflow-hidden rounded-full bg-[#D7DDD2]">
                                    {severityCounts.map((item) => (
                                        <div
                                            key={item.severity}
                                            style={{
                                                width: severityTotal
                                                    ? `${(item.count /
                                                        severityTotal) *
                                                    100
                                                    }%`
                                                    : "0%",
                                                backgroundColor: item.color,
                                            }}
                                            className="h-full transition-all duration-700"
                                        />
                                    ))}
                                </div>

                                <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-4">
                                    {severityCounts.map((item, index) => (
                                        <div
                                            key={item.severity}
                                            className={`${index > 1
                                                ? "border-t border-[#4B1B27]/10 pt-4 sm:border-t-0 sm:pt-0"
                                                : ""
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            item.color,
                                                    }}
                                                />

                                                <span className="text-[10px] font-bold text-[#766B64]">
                                                    {item.severity}
                                                </span>
                                            </div>

                                            <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em] text-[#4B1B27]">
                                                {item.count}
                                            </p>

                                            <p className="mt-1 text-[9px] text-[#A1978D]">
                                                {item.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <aside className="space-y-6 xl:border-l xl:border-[#4B1B27]/10 xl:pl-7">

                        {/* SYSTEM SNAPSHOT */}
                        <section className="rounded-[23px] border border-[#4B1B27]/10 bg-[#F5F3EA] p-6 shadow-[0_8px_30px_rgba(53,21,31,0.025)]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B45B32]">
                                        System snapshot
                                    </p>

                                    <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.04em] text-[#4B1B27]">
                                        At a glance
                                    </h2>
                                </div>

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D7DDD2] text-[#4B1B27]">
                                    <Zap size={17} />
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-4 rounded-[16px] bg-[#D7DDD2]/70 p-4">
                                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#39785C]/20">
                                    <div className="absolute inset-[5px] rounded-full border border-[#39785C]/30" />

                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${activeIncidents.length > 0
                                            ? "bg-[#D45B27]"
                                            : "bg-[#39785C]"
                                            }`}
                                    />
                                </div>

                                <div className="min-w-0">
                                    <p
                                        className={`text-[11px] font-bold ${activeIncidents.length > 0
                                            ? "text-[#B45B32]"
                                            : "text-[#39785C]"
                                            }`}
                                    >
                                        {activeIncidents.length > 0
                                            ? "Attention required"
                                            : "All systems clear"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-[#817B70]">
                                        {activeIncidents.length} unresolved
                                        incidents
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-[#8D8178]">
                                        Resolved incidents
                                    </span>

                                    <span className="text-[12px] font-bold text-[#4B1B27]">
                                        {stats.resolved_incidents}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-[#8D8178]">
                                        Avg. resolution time
                                    </span>

                                    <span className="text-[12px] font-bold text-[#4B1B27]">
                                        {Number(
                                            stats.average_resolution_hours || 0
                                        ).toFixed(1)}
                                        h
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-[#8D8178]">
                                        Services tracked
                                    </span>

                                    <span className="text-[12px] font-bold text-[#4B1B27]">
                                        {services.length}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* SERVICES */}
                        <section className="rounded-[23px] border border-[#4B1B27]/10 bg-[#F5F3EA] p-6 shadow-[0_8px_30px_rgba(53,21,31,0.025)]">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B45B32]">
                                        Infrastructure
                                    </p>

                                    <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.04em] text-[#4B1B27]">
                                        Your services
                                    </h2>
                                </div>

                                <span className="rounded-full bg-[#D7DDD2] px-3 py-1.5 text-[10px] font-bold text-[#4B1B27]">
                                    {services.length} total
                                </span>
                            </div>

                            <div className="mt-5">
                                {services.length === 0 ? (
                                    <div className="border-t border-[#4B1B27]/10 py-6 text-center">
                                        <Server
                                            size={21}
                                            className="mx-auto text-[#A1978D]"
                                        />

                                        <p className="mt-3 text-[11px] font-semibold text-[#766B64]">
                                            No services available
                                        </p>

                                        <p className="mt-1 text-[10px] text-[#A1978D]">
                                            Registered services will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    services.slice(0, 5).map((service) => (
                                        <div
                                            key={service.id}
                                            className="group flex items-center justify-between gap-3 border-t border-[#4B1B27]/[0.08] py-4"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#4B1B27] text-[12px] font-bold text-[#F5F3EA] transition-all duration-300 group-hover:bg-[#FF6B1A]">
                                                    {service.name
                                                        ?.charAt(0)
                                                        ?.toUpperCase() || "S"}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-[11px] font-bold text-[#4B1B27]">
                                                        {service.name}
                                                    </p>

                                                    <p className="mt-1 text-[9px] text-[#A1978D]">
                                                        Service #{service.id}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="flex shrink-0 items-center gap-1.5 text-[9px] font-semibold text-[#39785C]">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#39785C]" />
                                                Active
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* QUICK ACTIONS */}
                        <section className="relative overflow-hidden rounded-[23px] bg-[#4B1B27] p-6 text-[#F5F3EA]">
                            <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border border-white/[0.08]" />

                            <div className="relative">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF9869]">
                                    Workspace tools
                                </p>

                                <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.04em]">
                                    Quick actions
                                </h2>

                                <div className="mt-5 space-y-1">
                                    {[
                                        {
                                            label: "Create an incident",
                                            path: "/incidents/create",
                                            icon: Plus,
                                        },
                                        {
                                            label: "Browse incidents",
                                            path: "/incidents",
                                            icon: Layers3,
                                        },
                                        {
                                            label: "Explore analytics",
                                            path: "/analytics",
                                            icon: Activity,
                                        },
                                    ].map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <button
                                                key={item.label}
                                                onClick={() =>
                                                    router.push(item.path)
                                                }
                                                className="group flex w-full items-center justify-between border-b border-white/[0.09] py-3.5 text-left last:border-b-0"
                                            >
                                                <span className="flex items-center gap-3 text-[11px] font-medium text-white/65 transition group-hover:text-white">
                                                    <Icon
                                                        size={15}
                                                        className="text-[#FF9869]"
                                                    />
                                                    {item.label}
                                                </span>

                                                <ArrowRight
                                                    size={14}
                                                    className="text-white/35 transition group-hover:translate-x-1 group-hover:text-[#FF9869]"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* WORKSPACE FOOTNOTE */}
                        <div className="flex items-start gap-3 px-2 py-2">
                            <Clock3
                                size={15}
                                className="mt-0.5 shrink-0 text-[#A1978D]"
                            />

                            <p className="text-[10px] leading-5 text-[#9B9188]">
                                Your dashboard reflects the latest available
                                activity from your active organization.
                            </p>
                        </div>
                    </aside>
                </div>

                {/* FOOTER */}
                <footer className="mt-10 flex flex-col justify-between gap-4 border-t border-[#4B1B27]/15 pt-6 pb-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#4B1B27] text-[#FF9869]">
                            <Activity size={15} />
                        </div>

                        <div>
                            <p className="text-[11px] font-bold tracking-tight text-[#4B1B27]">
                                IncidentFlow
                            </p>

                            <p className="mt-0.5 text-[9px] text-[#9B9188]">
                                Operations workspace
                            </p>
                        </div>
                    </div>

                    <span className="text-[10px] font-medium text-[#9B9188]">
                        Incident management · Service visibility · Operational intelligence
                    </span>
                </footer>
            </div>
        </main>
    );
}
