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
    Server,
    ShieldCheck,
    Users,
} from "lucide-react";

const severityConfig = {
    "SEV-1": {
        text: "text-[#B83232]",
        bg: "bg-[#B83232]/10",
        dot: "bg-[#B83232]",
    },
    "SEV-2": {
        text: "text-[#D45B27]",
        bg: "bg-[#D45B27]/10",
        dot: "bg-[#D45B27]",
    },
    "SEV-3": {
        text: "text-[#A77B24]",
        bg: "bg-[#A77B24]/10",
        dot: "bg-[#A77B24]",
    },
    "SEV-4": {
        text: "text-[#39785C]",
        bg: "bg-[#39785C]/10",
        dot: "bg-[#39785C]",
    },
};

const statusConfig = {
    INVESTIGATING: "text-[#B83232] bg-[#B83232]/10 border-[#B83232]/15",
    IDENTIFIED: "text-[#D45B27] bg-[#D45B27]/10 border-[#D45B27]/15",
    MITIGATING: "text-[#A77B24] bg-[#A77B24]/10 border-[#A77B24]/15",
    MONITORING: "text-[#526F83] bg-[#526F83]/10 border-[#526F83]/15",
    RESOLVED: "text-[#39785C] bg-[#39785C]/10 border-[#39785C]/15",
};

function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleString("en", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function MetricCard({ metric, index }) {
    const Icon = metric.icon;

    return (
        <div className="group relative overflow-hidden rounded-[22px] border border-[#4B1B27]/10 bg-[#F5F3EA] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B1A]/40 hover:shadow-[0_18px_45px_rgba(75,27,39,0.09)] sm:p-6">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#FF6B1A]/[0.07] blur-3xl transition-all duration-500 group-hover:bg-[#FF6B1A]/15" />

            <div className="relative">
                <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4B1B27] text-[#D7DDD2] transition-all duration-300 group-hover:rotate-[-5deg] group-hover:bg-[#FF6B1A] group-hover:text-white">
                        <Icon size={19} strokeWidth={1.7} />
                    </div>

                    <span className="font-mono text-[10px] tracking-widest text-[#4B1B27]/30">
                        0{index + 1}
                    </span>
                </div>

                <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.17em] text-[#4B1B27]/50">
                    {metric.label}
                </p>

                <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="text-[42px] font-semibold leading-none tracking-[-0.065em] text-[#4B1B27]">
                        {metric.value}
                    </p>

                    <span className="pb-1 text-[10px] text-[#4B1B27]/40">
                        {metric.detail}
                    </span>
                </div>

                <div className="mt-6 h-[3px] overflow-hidden rounded-full bg-[#4B1B27]/[0.08]">
                    <div className="h-full w-0 rounded-full bg-[#FF6B1A] transition-all duration-700 group-hover:w-full" />
                </div>
            </div>
        </div>
    );
}

export default function PlatformAdminDashboard() {
    const router = useRouter();

    const [stats, setStats] = useState({
        total_organizations: 0,
        total_users: 0,
        total_services: 0,
        total_incidents: 0,
        active_incidents: 0,
        resolved_incidents: 0,
    });

    const [organizations, setOrganizations] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            const token = localStorage.getItem("token");
            const api = process.env.NEXT_PUBLIC_API_URL;

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            try {
                const [
                    statsResponse,
                    organizationsResponse,
                    incidentsResponse,
                    servicesResponse,
                ] = await Promise.all([
                    fetch(`${api}/api/analytics/global-stats`, { headers }),
                    fetch(`${api}/api/organizations`, { headers }),
                    fetch(`${api}/api/incidents`, { headers }),
                    fetch(`${api}/api/services`, { headers }),
                ]);

                if (
                    !statsResponse.ok ||
                    !organizationsResponse.ok ||
                    !incidentsResponse.ok ||
                    !servicesResponse.ok
                ) {
                    throw new Error("Unable to load platform dashboard data.");
                }

                const statsData = await statsResponse.json();
                const organizationsData = await organizationsResponse.json();
                const incidentsData = await incidentsResponse.json();
                const servicesData = await servicesResponse.json();

                const rawStats = statsData.data || {};

                setStats({
                    total_organizations: Number(rawStats.total_organizations) || 0,
                    total_users: Number(rawStats.total_users) || 0,
                    total_services: Number(rawStats.total_services) || 0,
                    total_incidents: Number(rawStats.total_incidents) || 0,
                    active_incidents: Number(rawStats.active_incidents) || 0,
                    resolved_incidents: Number(rawStats.resolved_incidents) || 0,
                });

                setOrganizations(organizationsData.organizations || []);
                setIncidents(incidentsData.incidents || []);
                setServices(servicesData.services || []);

            } catch (err) {
                console.error("Platform dashboard error:", err);
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const organizationStats = organizations.map((organization) => {
        const organizationIncidents = incidents.filter(
            (incident) =>
                Number(incident.organization_id) === Number(organization.id)
        );

        const organizationServices = services
            .filter(
                (service) =>
                    Number(service.organization_id) === Number(organization.id)
            )
            .map((service) => {
                const serviceIncidents = organizationIncidents.filter(
                    (incident) =>
                        Number(incident.service_id) === Number(service.id)
                );

                return {
                    ...service,
                    incidentCount: serviceIncidents.length,
                    resolvedIncidentCount: serviceIncidents.filter(
                        (incident) => incident.status === "RESOLVED"
                    ).length,
                };
            });

        return {
            ...organization,
            services: organizationServices,
            serviceCount: organizationServices.length,
            incidentCount: organizationIncidents.length,
            activeCount: organizationIncidents.filter(
                (incident) => incident.status !== "RESOLVED"
            ).length,
            resolvedCount: organizationIncidents.filter(
                (incident) => incident.status === "RESOLVED"
            ).length,
        };
    });

    const metrics = [
        {
            label: "Total organizations",
            value: stats.total_organizations,
            detail: "Registered",
            icon: Building2,
        },
        {
            label: "Total users",
            value: stats.total_users,
            detail: "Platform users",
            icon: Users,
        },
        {
            label: "Total services",
            value: stats.total_services,
            detail: "Infrastructure",
            icon: Server,
        },
        {
            label: "Total incidents",
            value: stats.total_incidents,
            detail: "All recorded",
            icon: Activity,
        },
    ];

    const resolutionPercentage =
        stats.total_incidents > 0
            ? Math.round(
                (stats.resolved_incidents / stats.total_incidents) * 100
            )
            : 0;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#E9E9DF]">
                <div className="flex flex-col items-center gap-5">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4B1B27]">
                        <Activity size={23} className="text-[#FF6B1A]" />
                        <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-[#FF6B1A]" />
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-semibold tracking-tight text-[#4B1B27]">
                            IncidentFlow
                        </p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#4B1B27]/45">
                            Loading platform intelligence
                        </p>
                    </div>

                    <div className="h-[2px] w-32 overflow-hidden bg-[#4B1B27]/10">
                        <div className="h-full w-1/2 animate-pulse bg-[#FF6B1A]" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="relative min-h-screen flex-1 overflow-hidden bg-[#E9E9DF] px-4 py-6 text-[#4B1B27] sm:px-7 sm:py-8 xl:px-10">

            <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-[#FF6B1A]/[0.06] blur-[120px]" />
            <div className="pointer-events-none absolute -left-40 top-[700px] h-[450px] w-[450px] rounded-full bg-[#4B1B27]/[0.035] blur-[120px]" />

            <div className="relative mx-auto max-w-[1500px]">

                {/* TOP HEADER */}
                <header className="relative overflow-hidden rounded-[28px] bg-[#4B1B27] text-[#D7DDD2]">
                    <div className="pointer-events-none absolute -right-24 -top-40 h-[450px] w-[450px] rounded-full border border-[#D7DDD2]/[0.07]" />
                    <div className="pointer-events-none absolute -right-5 -top-20 h-[310px] w-[310px] rounded-full border border-[#D7DDD2]/[0.07]" />
                    <div className="pointer-events-none absolute -bottom-32 right-[30%] h-72 w-72 rounded-full bg-[#FF6B1A]/10 blur-[100px]" />

                    <div className="relative grid gap-10 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end lg:p-12">
                        <div>
                            <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#D7DDD2]/15 bg-[#D7DDD2]/[0.06] px-3.5 py-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B1A] opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B1A]" />
                                </span>

                                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/75">
                                    Platform control center
                                </span>
                            </div>

                            <h1 className="max-w-3xl text-[43px] font-semibold leading-[1.02] tracking-[-0.07em] sm:text-6xl lg:text-[72px]">
                                Everything
                                <br />
                                <span className="text-[#FF6B1A]">under control.</span>
                            </h1>

                            <p className="mt-6 max-w-xl text-sm leading-7 text-[#D7DDD2]/60">
                                A centralized view of your organizations, infrastructure,
                                users and incident activity. Monitor the entire platform
                                from one place.
                            </p>
                        </div>

                        <div className="flex flex-col gap-5 lg:items-end">
                            <div className="flex items-center gap-3 border-l-2 border-[#FF6B1A] pl-4 lg:text-right">
                                <div className="lg:order-2">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/40">
                                        Global operations
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-[#D7DDD2]">
                                        All workspaces · All incidents
                                    </p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D7DDD2]/[0.08] text-[#FF6B1A] lg:order-1">
                                    <Activity size={19} />
                                </div>
                            </div>

                            <button
                                onClick={() => router.push("/admin/organizations")}
                                className="group inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[#FF6B1A] px-5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#e85a0c] hover:shadow-[0_12px_30px_rgba(255,107,26,0.2)]"
                            >
                                <Building2 size={16} />
                                Manage organizations
                                <ArrowUpRight
                                    size={16}
                                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                />
                            </button>
                        </div>
                    </div>

                    <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#D7DDD2]/10 px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#D7DDD2]/40 sm:px-9 lg:px-12">
                        <span>IncidentFlow</span>
                        <span className="h-1 w-1 rounded-full bg-[#FF6B1A]" />
                        <span>Administration</span>
                        <span className="h-1 w-1 rounded-full bg-[#FF6B1A]" />
                        <span>Global visibility</span>
                    </div>
                </header>

                {/* ERROR */}
                {error && (
                    <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#B83232]/20 bg-[#B83232]/[0.06] px-4 py-4 text-sm text-[#B83232]">
                        <CircleAlert size={17} />
                        {error}
                    </div>
                )}

                {/* METRICS */}
                <section className="mt-10">
                    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A]" />
                                Platform intelligence
                            </div>
                            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#4B1B27] sm:text-3xl">
                                Your platform, at a glance.
                            </h2>
                        </div>

                        <span className="text-[10px] text-[#4B1B27]/40">
                            Global platform totals
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {metrics.map((metric, index) => (
                            <MetricCard
                                key={metric.label}
                                metric={metric}
                                index={index}
                            />
                        ))}
                    </div>
                </section>

                {/* INCIDENT HEALTH */}
                <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_0.75fr]">

                    {/* INCIDENT OVERVIEW */}
                    <div className="relative overflow-hidden rounded-[24px] bg-[#D7DDD2] p-6 sm:p-8">
                        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#4B1B27]/[0.07]" />
                        <div className="pointer-events-none absolute -right-4 -top-12 h-48 w-48 rounded-full border border-[#4B1B27]/[0.07]" />

                        <div className="relative">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#4B1B27]/45">
                                        System monitoring
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#4B1B27]">
                                        Incident overview
                                    </h2>
                                </div>

                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#4B1B27] text-[#FF6B1A]">
                                    <Activity size={20} />
                                </div>
                            </div>

                            <div className="mt-10 grid grid-cols-2 gap-6">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4B1B27]/55">
                                        <span className="h-2 w-2 rounded-full bg-[#B83232]" />
                                        Active incidents
                                    </div>

                                    <p className="mt-4 text-5xl font-semibold leading-none tracking-[-0.07em] text-[#4B1B27] sm:text-6xl">
                                        {stats.active_incidents}
                                    </p>

                                    <p className="mt-3 text-[11px] text-[#4B1B27]/45">
                                        Requiring attention
                                    </p>
                                </div>

                                <div className="border-l border-[#4B1B27]/15 pl-5 sm:pl-8">
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#4B1B27]/55">
                                        <span className="h-2 w-2 rounded-full bg-[#39785C]" />
                                        Resolved incidents
                                    </div>

                                    <p className="mt-4 text-5xl font-semibold leading-none tracking-[-0.07em] text-[#4B1B27] sm:text-6xl">
                                        {stats.resolved_incidents}
                                    </p>

                                    <p className="mt-3 text-[11px] text-[#4B1B27]/45">
                                        Successfully resolved
                                    </p>
                                </div>
                            </div>

                            <div className="mt-9 flex flex-wrap items-center justify-between gap-3 border-t border-[#4B1B27]/10 pt-5">
                                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#4B1B27]/40">
                                    Incident status
                                </span>
                                <span className="flex items-center gap-2 rounded-full bg-[#39785C]/10 px-3 py-2 text-[10px] font-semibold text-[#39785C]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#39785C]" />
                                    Platform monitored
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RESOLUTION RATE */}
                    <div className="relative overflow-hidden rounded-[24px] bg-[#35151F] p-6 text-[#D7DDD2] sm:p-8">
                        <div className="pointer-events-none absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[#FF6B1A]/10 blur-[90px]" />

                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/40">
                                        Performance
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                                        Resolution rate
                                    </h2>
                                </div>

                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D7DDD2]/10 bg-[#D7DDD2]/[0.06] text-[#FF6B1A]">
                                    <CheckCircle2 size={20} />
                                </div>
                            </div>

                            <div className="mt-10 flex items-end justify-between gap-3">
                                <p className="text-6xl font-semibold leading-none tracking-[-0.075em]">
                                    {resolutionPercentage}
                                    <span className="ml-1 text-3xl text-[#FF6B1A]">%</span>
                                </p>

                                <span className="mb-1 rounded-full border border-[#D7DDD2]/10 bg-[#D7DDD2]/[0.06] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#D7DDD2]/70">
                                    Resolved
                                </span>
                            </div>

                            <div className="mt-9 h-[6px] overflow-hidden rounded-full bg-[#D7DDD2]/10">
                                <div
                                    className="h-full rounded-full bg-[#FF6B1A] transition-all duration-700"
                                    style={{ width: `${resolutionPercentage}%` }}
                                />
                            </div>

                            <div className="mt-4 flex justify-between text-[10px] text-[#D7DDD2]/45">
                                <span>{stats.resolved_incidents} resolved</span>
                                <span>{stats.total_incidents} total incidents</span>
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-[#D7DDD2]/10 pt-5">
                                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#D7DDD2]/40">
                                    Platform performance
                                </span>
                                <span className="text-[10px] font-semibold text-[#FF6B1A]">
                                    {resolutionPercentage}% complete
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ORGANIZATIONS */}
                <section className="mt-14">
                    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                                <Layers3 size={13} />
                                Workspace management
                            </div>

                            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[#4B1B27] sm:text-4xl">
                                Organizations
                            </h2>

                            <p className="mt-2 max-w-lg text-xs leading-6 text-[#4B1B27]/50">
                                Monitor services, infrastructure and incident activity
                                across every workspace.
                            </p>
                        </div>

                        <div className="flex w-fit items-center gap-3 rounded-xl border border-[#4B1B27]/10 bg-[#F5F3EA] px-4 py-3">
                            <Building2 size={15} className="text-[#FF6B1A]" />
                            <span className="text-xl font-semibold tracking-tight text-[#4B1B27]">
                                {organizations.length}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#4B1B27]/45">
                                Workspaces
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        {organizationStats.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-[#4B1B27]/20 bg-[#F5F3EA]/50 py-20 text-center">
                                <Building2
                                    className="mx-auto text-[#4B1B27]/30"
                                    size={30}
                                />
                                <p className="mt-4 text-sm font-semibold text-[#4B1B27]">
                                    No organizations found
                                </p>
                                <p className="mt-1 text-xs text-[#4B1B27]/45">
                                    Organizations will appear here.
                                </p>
                            </div>
                        ) : (
                            organizationStats.map((organization, index) => (
                                <button
                                    key={organization.id}
                                    onClick={() =>
                                        router.push(
                                            `/platform-admin/organizations/${organization.id}`
                                        )
                                    }
                                    className="group w-full overflow-hidden rounded-[24px] border border-[#4B1B27]/10 bg-[#F5F3EA] text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF6B1A]/40 hover:shadow-[0_18px_45px_rgba(75,27,39,0.08)]"
                                >
                                    {/* ORGANIZATION TOP */}
                                    <div className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
                                        <div className="flex min-w-0 items-center gap-4">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#4B1B27] text-xl font-semibold text-[#FF6B1A] transition-all duration-300 group-hover:rotate-[-4deg] group-hover:bg-[#FF6B1A] group-hover:text-white">
                                                {organization.name?.charAt(0)?.toUpperCase() || "O"}
                                            </div>

                                            <div className="min-w-0">
                                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#FF6B1A]">
                                                        Workspace 0{index + 1}
                                                    </span>
                                                </div>

                                                <h3 className="truncate text-lg font-semibold tracking-tight text-[#4B1B27] transition-colors group-hover:text-[#FF6B1A] sm:text-xl">
                                                    {organization.name}
                                                </h3>

                                                <p className="mt-1 text-[10px] text-[#4B1B27]/40">
                                                    Workspace #{organization.id}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                                            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#4B1B27]/35">
                                                Organization details
                                            </span>
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#4B1B27]/10 text-[#4B1B27]/45 transition-all duration-300 group-hover:border-[#FF6B1A] group-hover:bg-[#FF6B1A] group-hover:text-white">
                                                <ArrowUpRight size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ORGANIZATION METRICS */}
                                    <div className="grid grid-cols-2 border-y border-[#4B1B27]/[0.08] sm:grid-cols-4">
                                        <div className="border-b border-r border-[#4B1B27]/[0.08] p-5 sm:border-b-0">
                                            <div className="flex items-center gap-2 text-[#4B1B27]/45">
                                                <Server size={13} />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                                    Services
                                                </span>
                                            </div>
                                            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#4B1B27]">
                                                {organization.serviceCount}
                                            </p>
                                        </div>

                                        <div className="border-b border-[#4B1B27]/[0.08] p-5 sm:border-b-0 sm:border-r">
                                            <div className="flex items-center gap-2 text-[#4B1B27]/45">
                                                <Activity size={13} />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                                    Incidents
                                                </span>
                                            </div>
                                            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#4B1B27]">
                                                {organization.incidentCount}
                                            </p>
                                        </div>

                                        <div className="border-r border-[#4B1B27]/[0.08] p-5">
                                            <div className="flex items-center gap-2 text-[#B83232]/70">
                                                <CircleAlert size={13} />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                                    Active
                                                </span>
                                            </div>
                                            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#B83232]">
                                                {organization.activeCount}
                                            </p>
                                        </div>

                                        <div className="p-5">
                                            <div className="flex items-center gap-2 text-[#39785C]/70">
                                                <CheckCircle2 size={13} />
                                                <span className="text-[9px] font-bold uppercase tracking-wider">
                                                    Resolved
                                                </span>
                                            </div>
                                            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#39785C]">
                                                {organization.resolvedCount}
                                            </p>
                                        </div>
                                    </div>

                                    {/* SERVICES */}
                                    <div className="p-5 sm:p-7">
                                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[#4B1B27]/55">
                                                <Server size={13} />
                                                Organization services
                                            </div>

                                            <span className="text-[10px] text-[#4B1B27]/40">
                                                {organization.serviceCount} total
                                            </span>
                                        </div>

                                        {organization.services.length === 0 ? (
                                            <p className="rounded-xl border border-dashed border-[#4B1B27]/15 px-4 py-4 text-xs text-[#4B1B27]/45">
                                                No services added to this organization yet.
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                {organization.services.map((service) => (
                                                    <div
                                                        key={service.id}
                                                        className="min-w-0 rounded-xl border border-[#4B1B27]/[0.08] bg-[#E9E9DF]/70 p-4 transition-colors group-hover:border-[#4B1B27]/15"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF6B1A]" />
                                                            <span className="truncate text-xs font-semibold text-[#4B1B27]">
                                                                {service.name}
                                                            </span>
                                                        </div>

                                                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[9px]">
                                                            <span className="text-[#4B1B27]/50">
                                                                {service.incidentCount} total
                                                            </span>
                                                            <span className="text-[#B83232]">
                                                                {service.activeIncidentCount} active
                                                            </span>
                                                            <span className="text-[#39785C]">
                                                                {service.resolvedIncidentCount} resolved
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-end gap-2 border-t border-[#4B1B27]/[0.08] bg-[#E9E9DF]/45 px-5 py-3.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#4B1B27]/40 transition-colors group-hover:text-[#FF6B1A] sm:px-7">
                                        Open workspace
                                        <ArrowRight size={13} />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </section>

                {/* RECENT INCIDENTS */}
                <section className="mt-14">
                    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                                <Activity size={13} />
                                Platform activity
                            </div>

                            <h2 className="text-3xl font-semibold tracking-[-0.06em] text-[#4B1B27] sm:text-4xl">
                                Recent incidents
                            </h2>

                            <p className="mt-2 text-xs text-[#4B1B27]/50">
                                The latest reported incidents across all workspaces.
                            </p>
                        </div>

                        <span className="w-fit rounded-xl border border-[#4B1B27]/10 bg-[#F5F3EA] px-4 py-3 text-[10px] font-semibold text-[#4B1B27]/55">
                            Showing {Math.min(incidents.length, 8)} of {incidents.length}
                        </span>
                    </div>

                    <div className="overflow-hidden rounded-[24px] border border-[#4B1B27]/10 bg-[#F5F3EA]">
                        <div className="flex flex-col justify-between gap-4 border-b border-[#4B1B27]/10 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
                            <div>
                                <p className="text-sm font-semibold text-[#4B1B27]">
                                    Incident activity
                                </p>
                                <p className="mt-1 text-[10px] text-[#4B1B27]/45">
                                    Latest reported incidents across all organizations
                                </p>
                            </div>

                            <div className="flex w-fit items-center gap-2 rounded-full border border-[#39785C]/15 bg-[#39785C]/[0.06] px-3 py-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#39785C]" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#39785C]">
                                    Live monitoring
                                </span>
                            </div>
                        </div>

                        {incidents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D7DDD2] text-[#39785C]">
                                    <CheckCircle2 size={23} />
                                </div>

                                <p className="mt-4 text-sm font-semibold text-[#4B1B27]">
                                    No incidents reported
                                </p>

                                <p className="mt-1 text-xs text-[#4B1B27]/45">
                                    New incidents will appear here.
                                </p>
                            </div>
                        ) : (
                            <div>
                                {incidents.slice(0, 8).map((incident) => {
                                    const organization = organizations.find(
                                        (item) =>
                                            Number(item.id) === Number(incident.organization_id)
                                    );

                                    const service = services.find(
                                        (item) =>
                                            Number(item.id) === Number(incident.service_id)
                                    );

                                    const severity = severityConfig[incident.severity] || {
                                        text: "text-[#4B1B27]/60",
                                        bg: "bg-[#4B1B27]/[0.06]",
                                        dot: "bg-[#4B1B27]/40",
                                    };

                                    return (
                                        <div
                                            key={incident.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() =>
                                                router.push(
                                                    `/incidents/${incident.id}?organization_id=${incident.organization_id}`
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    router.push(
                                                        `/incidents/${incident.id}?organization_id=${incident.organization_id}`
                                                    );
                                                }
                                            }}
                                            className="group flex cursor-pointer flex-col gap-4 border-b border-[#4B1B27]/[0.07] px-5 py-5 transition-colors duration-200 hover:bg-[#E9E9DF]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF6B1A] sm:flex-row sm:items-center sm:justify-between sm:px-7"
                                        >
                                            <div className="flex min-w-0 items-start gap-4">
                                                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#4B1B27]/10 bg-[#E9E9DF] transition-colors group-hover:border-[#FF6B1A]/30 group-hover:bg-[#FF6B1A]/10">
                                                    <CircleAlert
                                                        size={18}
                                                        className={severity.text}
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-[#4B1B27] transition-colors group-hover:text-[#FF6B1A]">
                                                        {incident.title}
                                                    </p>

                                                    <p className="mt-2 truncate text-[10px] text-[#4B1B27]/45">
                                                        {organization?.name || "Unknown organization"}
                                                        <span className="mx-2 text-[#4B1B27]/20">·</span>
                                                        {service?.name || "Unknown service"}
                                                        <span className="mx-2 text-[#4B1B27]/20">·</span>
                                                        Incident #{incident.id}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2.5 pl-[60px] sm:shrink-0 sm:pl-0">
                                                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[9px] font-bold ${severity.bg} ${severity.text}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${severity.dot}`} />
                                                    {incident.severity}
                                                </span>

                                                <span
                                                    className={`rounded-md border px-2.5 py-1.5 text-[9px] font-semibold ${statusConfig[incident.status] ||
                                                        "border-[#4B1B27]/10 bg-[#4B1B27]/[0.05] text-[#4B1B27]/50"
                                                        }`}
                                                >
                                                    {incident.status}
                                                </span>

                                                <span className="flex items-center gap-1.5 text-[9px] text-[#4B1B27]/45 sm:w-24 sm:justify-end">
                                                    <Clock3 size={11} />
                                                    {formatDate(incident.created_at)}
                                                </span>

                                                <ArrowUpRight
                                                    size={14}
                                                    className="hidden text-[#4B1B27]/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#FF6B1A] sm:block"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex flex-col justify-between gap-3 bg-[#E9E9DF]/70 px-5 py-4 sm:flex-row sm:items-center sm:px-7">
                            <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#4B1B27]/50">
                                <ShieldCheck size={13} className="text-[#39785C]" />
                                Platform-wide visibility
                            </span>

                            <span className="text-[9px] text-[#4B1B27]/35">
                                All organizations
                            </span>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="mt-14 flex flex-col justify-between gap-4 border-t border-[#4B1B27]/15 pt-6 text-[10px] sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4B1B27] text-[#FF6B1A]">
                            <Activity size={15} />
                        </div>

                        <div>
                            <span className="font-bold tracking-tight text-[#4B1B27]">
                                IncidentFlow
                            </span>
                            <span className="mx-2 text-[#4B1B27]/25">/</span>
                            <span className="text-[#4B1B27]/45">
                                Platform administration
                            </span>
                        </div>
                    </div>

                    <span className="text-[#4B1B27]/40">
                        Centralized organization and incident monitoring
                    </span>
                </footer>
            </div>
        </main>
    );
}