"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Users,
    ShieldCheck,
    Server,
    Activity,
} from "lucide-react";

const severityConfig = {
    "SEV-1": "text-[#B44343]",
    "SEV-2": "text-[#E45E18]",
    "SEV-3": "text-[#B98522]",
    "SEV-4": "text-[#39734E]",
};

const statusConfig = {
    INVESTIGATING: "text-[#B44343] bg-[#B44343]/10",
    IDENTIFIED: "text-[#75518E] bg-[#75518E]/10",
    MITIGATING: "text-[#D85D20] bg-[#FF6B1A]/10",
    MONITORING: "text-[#397F91] bg-[#397F91]/10",
    RESOLVED: "text-[#39734E] bg-[#39734E]/10",
};

function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleString("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function OrganizationDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const organizationId = params.id;

    const [organization, setOrganization] = useState(null);
    const [members, setMembers] = useState([]);
    const [services, setServices] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadOrganizationDetails = async () => {
            const token = localStorage.getItem("token");
            const api = process.env.NEXT_PUBLIC_API_URL;

            if (!token) {
                router.replace("/login");
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            try {
                const [
                    organizationResponse,
                    membersResponse,
                    servicesResponse,
                    incidentsResponse,
                ] = await Promise.all([
                    fetch(`${api}/api/organizations/${organizationId}`, {
                        headers,
                    }),
                    fetch(`${api}/api/organizations/${organizationId}/members`, {
                        headers,
                    }),
                    fetch(`${api}/api/services?organization_id=${organizationId}`, {
                        headers,
                    }),
                    fetch(`${api}/api/incidents?organization_id=${organizationId}`, {
                        headers,
                    }),
                ]);

                if (
                    !organizationResponse.ok ||
                    !membersResponse.ok ||
                    !servicesResponse.ok ||
                    !incidentsResponse.ok
                ) {
                    throw new Error("Unable to load organization details.");
                }

                const [
                    organizationData,
                    membersData,
                    servicesData,
                    incidentsData,
                ] = await Promise.all([
                    organizationResponse.json(),
                    membersResponse.json(),
                    servicesResponse.json(),
                    incidentsResponse.json(),
                ]);

                setOrganization(organizationData.organization);
                setMembers(membersData.members || []);
                setServices(servicesData.services || []);
                setIncidents(incidentsData.incidents || []);

            } catch (err) {
                console.error("Organization details error:", err);
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        };

        if (organizationId) {
            loadOrganizationDetails();
        }
    }, [organizationId, router]);

    const activeIncidents = incidents.filter(
        (incident) => incident.status !== "RESOLVED"
    ).length;

    const metrics = [
        {
            label: "Total members",
            value: members.length,
            color: "#4B1B27",
            icon: Users,
            description: "People in this organization",
        },
        {
            label: "Organization admins",
            value: members.filter(
                (member) => member.role?.toLowerCase() === "admin"
            ).length,
            color: "#75518E",
            icon: ShieldCheck,
            description: "Members with admin access",
        },
        {
            label: "Total services",
            value: services.length,
            color: "#D85D20",
            icon: Server,
            description: "Registered services",
        },
        {
            label: "Total incidents",
            value: incidents.length,
            color: "#4B1B27",
            icon: Activity,
            description: "Reported incidents",
        },
    ];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#E9E9DF]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#4B1B27]/15 border-t-[#FF6B1A]" />
                    <p className="text-sm font-medium text-[#756B69]">
                        Loading organization details...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !organization) {
        return (
            <main className="min-h-screen flex-1 bg-[#E9E9DF] px-5 py-8 text-[#4B1B27] sm:px-8">
                <div className="mx-auto max-w-[1500px]">
                    <button
                        onClick={() => router.push("/platform-admin/dashboard")}
                        className="text-sm font-semibold text-[#4B1B27] transition hover:text-[#FF6B1A]"
                    >
                        ← Back to platform overview
                    </button>

                    <div className="mt-8 rounded-2xl border border-[#B44343]/15 bg-[#FFFEFA] p-6">
                        <p className="text-sm font-medium text-[#B44343]">
                            {error || "Organization not found."}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex-1 overflow-x-hidden bg-[#E9E9DF] px-5 py-8 text-[#4B1B27] sm:px-8 lg:px-10">
            <div className="mx-auto max-w-[1500px]">

                {/* Header */}
                <header className="relative mb-8 overflow-hidden rounded-[28px] border border-[#4B1B27] bg-[#4B1B27] px-6 py-8 text-white shadow-[0_20px_55px_rgba(75,27,39,0.14)] sm:px-9 sm:py-10">
                    <div className="pointer-events-none absolute -right-20 -top-36 h-80 w-80 rounded-full border border-white/[0.08]" />
                    <div className="pointer-events-none absolute -right-8 -top-24 h-64 w-64 rounded-full border border-white/[0.08]" />
                    <div className="pointer-events-none absolute -right-20 -bottom-40 h-80 w-80 rounded-full bg-[#FF6B1A]/10 blur-[80px]" />
                    <div className="pointer-events-none absolute -left-24 -bottom-40 h-72 w-72 rounded-full bg-[#FF6B1A]/[0.07] blur-[90px]" />

                    <div className="relative z-10">
                        <button
                            onClick={() => router.push("/platform-admin/dashboard")}
                            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-white/60 transition hover:text-[#FF8A48]"
                        >
                            <span>←</span>
                            Back to platform overview
                        </button>

                        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
                            <div className="min-w-0">
                                <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF8A48]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A] shadow-[0_0_10px_rgba(255,107,26,0.8)]" />
                                    Organization details
                                </div>

                                <h1 className="break-words text-3xl font-semibold tracking-[-0.045em] text-[#FFFEFA] sm:text-5xl">
                                    {organization.name}
                                    <span className="text-[#FF6B1A]">.</span>
                                </h1>

                                <p className="mt-3 text-sm text-[#E9E9DF]/65">
                                    Organization #{organization.id}
                                </p>
                            </div>

                            <div className="w-fit rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 sm:min-w-[190px] sm:text-right">
                                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-white/45">
                                    Created on
                                </p>
                                <p className="mt-2 text-sm font-medium text-[#FFFEFA]">
                                    {formatDate(organization.created_at)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
                            <span className="rounded-lg border border-white/10 bg-white/[0.07] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">
                                Platform administration
                            </span>
                            <span className="rounded-lg border border-[#FF6B1A]/20 bg-[#FF6B1A]/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#FF9A65]">
                                Organization workspace
                            </span>
                        </div>
                    </div>
                </header>

                {/* Metrics */}
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

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        {metrics.map((metric) => {
                            const Icon = metric.icon;

                            return (
                                <div
                                    key={metric.label}
                                    className="group relative overflow-hidden rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B1A]/40 hover:shadow-xl hover:shadow-[#4B1B27]/[0.08] sm:p-5"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[11px] font-semibold text-[#756B69]">
                                            {metric.label}
                                        </p>

                                        <span
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                                            style={{
                                                color: metric.color,
                                                backgroundColor: `${metric.color}15`,
                                            }}
                                        >
                                            <Icon size={17} strokeWidth={2} />
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

                                    {/* Animated bottom line */}
                                    <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#E9E9DF]">
                                        <div
                                            className="h-full w-0 transition-all duration-500 ease-out group-hover:w-full"
                                            style={{ backgroundColor: metric.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Incident summary */}
                <section className="grid grid-cols-1 gap-5 border-b border-[#4B1B27]/10 py-8 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-6 sm:p-7">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF6B1A]">
                            Organization health
                        </p>

                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#4B1B27]">
                            Incident summary
                        </h2>

                        <div className="mt-7 grid grid-cols-2 gap-4">
                            <div className="rounded-xl border border-[#B44343]/10 bg-[#B44343]/[0.04] p-4">
                                <p className="text-xs font-medium text-[#756B69]">
                                    Active incidents
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-[#B44343]">
                                    {activeIncidents}
                                </p>
                            </div>

                            <div className="rounded-xl border border-[#39734E]/10 bg-[#39734E]/[0.04] p-4">
                                <p className="text-xs font-medium text-[#756B69]">
                                    Resolved incidents
                                </p>
                                <p className="mt-2 text-3xl font-semibold text-[#39734E]">
                                    {incidents.length - activeIncidents}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-6 sm:p-7">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF6B1A]">
                                    Performance
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#4B1B27]">
                                    Resolution distribution
                                </p>
                            </div>

                            <span className="rounded-xl bg-[#39734E]/10 px-3 py-2 text-sm font-bold text-[#39734E]">
                                {incidents.length > 0
                                    ? Math.round(
                                        ((incidents.length - activeIncidents) /
                                            incidents.length) * 100
                                    )
                                    : 0}%
                            </span>
                        </div>

                        <div className="flex h-3 overflow-hidden rounded-full bg-[#E9E9DF]">
                            <div
                                className="rounded-full bg-[#39734E] transition-all duration-700"
                                style={{
                                    width: `${incidents.length > 0
                                        ? ((incidents.length - activeIncidents) /
                                            incidents.length) * 100
                                        : 0
                                        }%`,
                                }}
                            />
                        </div>

                        <div className="mt-4 flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-2 text-[#756B69]">
                                <span className="h-2 w-2 rounded-full bg-[#39734E]" />
                                Resolved
                            </span>
                            <span className="text-[#938785]">
                                {incidents.length - activeIncidents} of {incidents.length} incidents
                            </span>
                        </div>

                        <p className="mt-4 text-xs leading-5 text-[#938785]">
                            Resolved incidents compared with all organization incidents.
                        </p>
                    </div>
                </section>

                {/* Members */}
                <section className="py-9">
                    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF6B1A]">
                                Organization access
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#4B1B27]">
                                Members
                            </h2>

                            <p className="mt-1 text-sm text-[#938785]">
                                People who belong to this organization.
                            </p>
                        </div>

                        <span className="w-fit rounded-xl border border-[#4B1B27]/10 bg-[#FFFEFA] px-3 py-2 text-xs font-semibold text-[#4B1B27]">
                            {members.length} members
                        </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] shadow-[0_3px_14px_rgba(75,27,39,0.03)]">
                        <table className="w-full min-w-[650px] text-left">
                            <thead>
                                <tr className="border-b border-[#4B1B27]/10 bg-[#4B1B27]/[0.035] text-[10px] font-bold uppercase tracking-[0.15em] text-[#938785]">
                                    <th className="px-5 py-4 pr-4">Member</th>
                                    <th className="px-5 py-4 pr-4">Email</th>
                                    <th className="px-5 py-4 pr-4">Role</th>
                                    <th className="px-5 py-4">Joined</th>
                                </tr>
                            </thead>

                            <tbody>
                                {members.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-10 text-center text-sm text-[#938785]">
                                            No members found.
                                        </td>
                                    </tr>
                                ) : (
                                    members.map((member) => (
                                        <tr
                                            key={member.id}
                                            className="border-b border-[#4B1B27]/[0.07] transition-colors last:border-0 hover:bg-[#E9E9DF]/40"
                                        >
                                            <td className="px-5 py-4 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4B1B27] text-xs font-bold text-[#FFFEFA] shadow-sm">
                                                        {member.name?.charAt(0)?.toUpperCase() || "U"}
                                                    </div>
                                                    <span className="text-sm font-semibold text-[#4B1B27]">
                                                        {member.name}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 pr-4 text-sm text-[#756B69]">
                                                {member.email}
                                            </td>

                                            <td className="px-5 py-4 pr-4">
                                                <span className={`inline-flex rounded-lg px-3 py-1.5 text-[10px] font-bold ${member.role === "admin"
                                                    ? "bg-[#75518E]/10 text-[#75518E]"
                                                    : "bg-[#E9E9DF] text-[#756B69]"
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-xs text-[#938785]">
                                                {formatDate(member.joined_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Services */}
                <section className="border-t border-[#4B1B27]/10 py-9">
                    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF6B1A]">
                                Infrastructure
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#4B1B27]">
                                Services
                            </h2>

                            <p className="mt-1 text-sm text-[#938785]">
                                Services registered under this organization.
                            </p>
                        </div>

                        <span className="w-fit rounded-xl border border-[#4B1B27]/10 bg-[#FFFEFA] px-3 py-2 text-xs font-semibold text-[#4B1B27]">
                            {services.length} services
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {services.length === 0 ? (
                            <p className="rounded-2xl border border-dashed border-[#4B1B27]/20 bg-[#FFFEFA]/70 py-10 text-center text-sm text-[#938785] md:col-span-2 xl:col-span-3">
                                No services found.
                            </p>
                        ) : (
                            services.map((service) => (
                                <div
                                    key={service.id}
                                    className="group rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-5 shadow-[0_3px_14px_rgba(75,27,39,0.03)] transition-all duration-200 hover:-translate-y-1 hover:border-[#FF6B1A]/40 hover:shadow-[0_10px_25px_rgba(75,27,39,0.07)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4B1B27] text-[#FF8A48]">
                                                <span className="text-sm font-bold">S</span>
                                            </div>
                                            <h3 className="truncate text-sm font-semibold text-[#4B1B27]">
                                                {service.name}
                                            </h3>
                                        </div>

                                        <span className="shrink-0 rounded-lg bg-[#E9E9DF] px-2 py-1 text-[10px] font-semibold text-[#938785]">
                                            #{service.id}
                                        </span>
                                    </div>

                                    <p className="mt-4 min-h-10 text-xs leading-5 text-[#756B69]">
                                        {service.description || "No description provided."}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between border-t border-[#4B1B27]/[0.08] pt-3">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B8AAA5]">
                                            Registered service
                                        </span>
                                        <p className="text-[10px] text-[#938785]">
                                            {formatDate(service.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Incidents */}
                <section className="border-t border-[#4B1B27]/10 py-9">
                    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF6B1A]">
                                Incident monitoring
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#4B1B27]">
                                Organization incidents
                            </h2>

                            <p className="mt-1 text-sm text-[#938785]">
                                Incidents reported across this organization's services.
                            </p>
                        </div>

                        <span className="w-fit rounded-xl border border-[#4B1B27]/10 bg-[#FFFEFA] px-3 py-2 text-xs font-semibold text-[#4B1B27]">
                            {incidents.length} incidents
                        </span>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] shadow-[0_3px_14px_rgba(75,27,39,0.03)]">
                        {incidents.length === 0 ? (
                            <p className="py-12 text-center text-sm text-[#938785]">
                                No incidents reported.
                            </p>
                        ) : (
                            incidents.map((incident) => (
                                <div
                                    key={incident.id}
                                    className="flex flex-col justify-between gap-4 border-b border-[#4B1B27]/[0.08] px-5 py-5 transition-colors last:border-0 hover:bg-[#E9E9DF]/35 sm:flex-row sm:items-center sm:px-6"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-sm font-semibold text-[#4B1B27]">
                                                {incident.title}
                                            </h3>

                                            <span className={`rounded-md bg-current/[0.06] text-[10px] font-bold ${severityConfig[incident.severity] || "text-[#938785]"
                                                }`}>
                                                {incident.severity}
                                            </span>
                                        </div>

                                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#756B69]">
                                            {incident.description || "No description provided."}
                                        </p>

                                        <p className="mt-3 text-[10px] font-medium text-[#938785]">
                                            {incident.environment || "Environment unknown"}
                                            {" · "}
                                            {formatDate(incident.created_at)}
                                        </p>
                                    </div>

                                    <span className={`w-fit shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wide ${statusConfig[incident.status] ||
                                        "bg-[#E9E9DF] text-[#756B69]"
                                        }`}>
                                        {incident.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="flex flex-col justify-between gap-3 border-t border-[#4B1B27]/15 py-6 text-[11px] text-[#938785] sm:flex-row">
                    <span className="font-semibold text-[#4B1B27]">
                        IncidentFlow <span className="text-[#FF6B1A]">·</span> Platform administration
                    </span>
                    <span>Organization #{organization.id}</span>
                </footer>
            </div>
        </main>
    );
}
