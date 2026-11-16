"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Activity,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    CircleAlert,
    Layers3,
    Plus,
    Search,
    Server,
    ChevronDown,
    Trash2,
    X,
    Pencil,
} from "lucide-react";

import { useOrganization } from "../../context/OrganizationContext";

const severityColors = {
    "SEV-1": "bg-[#B44343]",
    "SEV-2": "bg-[#D66A32]",
    "SEV-3": "bg-[#C4972B]",
    "SEV-4": "bg-[#39734E]",
};

export default function ServicesPage() {
    const router = useRouter();
    const { activeOrganization } = useOrganization();

    const [services, setServices] = useState([]);
    const [expandedServices, setExpandedServices] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const servicesPerPage = 6;

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedServiceOrganization, setSelectedServiceOrganization] = useState("");

    const [form, setForm] = useState({
        name: "",
        description: "",
    });

    const [canManageServices, setCanManageServices] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [updating, setUpdating] = useState(false);

    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
    });

    // Platform admin and organization filter
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrganizationFilter, setSelectedOrganizationFilter] =
        useState("all");

    // Identify the logged-in user
    useEffect(() => {
        const storedUser = JSON.parse(
            localStorage.getItem("user") || "{}"
        );

        setIsPlatformAdmin(storedUser.role === "platform_admin");
    }, []);

    // Load organizations for platform admin
    useEffect(() => {
        if (!isPlatformAdmin) return;

        const loadOrganizations = async () => {
            const api = process.env.NEXT_PUBLIC_API_URL;
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(`${api}/api/organizations`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Unable to load organizations.");
                }

                const data = await response.json();
                setOrganizations(data.organizations || []);
            } catch (err) {
                console.error("Organizations loading error:", err);
            }
        };

        loadOrganizations();
    }, [isPlatformAdmin]);

    const loadServices = async () => {
        const user = JSON.parse(
            localStorage.getItem("user") || "{}"
        );

        const platformAdmin = user.role === "platform_admin";

        if (!activeOrganization?.id && !platformAdmin) {
            setServices([]);
            setIncidents([]);
            setLoading(false);
            return;
        }

        const api = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem("token");

        const headers = {
            Authorization: `Bearer ${token}`,
        };

        try {
            setLoading(true);
            setError("");

            const organizationQuery = platformAdmin
                ? ""
                : `?organization_id=${encodeURIComponent(
                    activeOrganization.id
                )}`;

            const [servicesResponse, incidentsResponse] = await Promise.all([
                fetch(`${api}/api/services${organizationQuery}`, { headers }),
                fetch(`${api}/api/incidents${organizationQuery}`, { headers }),
            ]);

            if (!servicesResponse.ok) {
                throw new Error("Unable to load services.");
            }

            const servicesData = await servicesResponse.json();
            setServices(servicesData.services || []);

            if (incidentsResponse.ok) {
                const incidentsData = await incidentsResponse.json();
                setIncidents(incidentsData.incidents || []);
                // console.log(
                //     "Organization incidents:",
                //     incidentsData.incidents
                // );
            }
        } catch (err) {
            console.error("Services loading error:", err);
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const toggleService = (serviceId) => {
        setExpandedServices((prev) =>
            prev.includes(serviceId)
                ? prev.filter((id) => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    useEffect(() => {
        loadServices();
    }, [activeOrganization?.id]);

    // Load service management permissions
    useEffect(() => {
        const loadPermissions = async () => {
            const user = JSON.parse(
                localStorage.getItem("user") || "{}"
            );

            if (user.role === "platform_admin") {
                setCanManageServices(true);
                return;
            }

            if (!activeOrganization?.id) {
                setCanManageServices(false);
                return;
            }

            const api = process.env.NEXT_PUBLIC_API_URL;
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(`${api}/api/organizations`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) return;

                const data = await response.json();
                const organizationList = data.organizations || [];

                const currentOrganization = organizationList.find(
                    (organization) =>
                        Number(organization.id) ===
                        Number(activeOrganization.id)
                );

                setCanManageServices(
                    currentOrganization?.role === "admin"
                );
            } catch (err) {
                console.error("Permission loading error:", err);
            }
        };

        loadPermissions();
    }, [activeOrganization?.id]);

    const serviceStats = useMemo(() => {
        return services.map((service) => {
            const serviceIncidents = incidents.filter(
                (incident) =>
                    Number(incident.service_id) === Number(service.id)
            );

            const activeIncidents = serviceIncidents.filter(
                (incident) => incident.status !== "RESOLVED"
            );

            return {
                ...service,
                incidentCount: serviceIncidents.length,
                activeCount: activeIncidents.length,
                resolvedCount:
                    serviceIncidents.length - activeIncidents.length,
                latestIncident: serviceIncidents[0] || null,
                incidents: serviceIncidents,
            };
        });
    }, [services, incidents]);

    // Search and organization filtering
    const filteredServices = serviceStats.filter((service) => {
        const matchesSearch =
            `${service.name} ${service.description || ""}`
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesOrganization =
            !isPlatformAdmin ||
            selectedOrganizationFilter === "all" ||
            String(service.organization_id) ===
            selectedOrganizationFilter;

        return matchesSearch && matchesOrganization;
    });

    const totalPages = Math.ceil(
        filteredServices.length / servicesPerPage
    );

    const paginatedServices = filteredServices.slice(
        (currentPage - 1) * servicesPerPage,
        currentPage * servicesPerPage
    );

    const totalActive = serviceStats.reduce(
        (sum, service) => sum + service.activeCount,
        0
    );

    const totalIncidents = serviceStats.reduce(
        (sum, service) => sum + service.incidentCount,
        0
    );

    const handleCreateService = async (event) => {
        event.preventDefault();

        if (!form.name.trim() || !activeOrganization?.id) return;

        const api = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem("token");

        try {
            setCreating(true);

            const response = await fetch(`${api}/api/services`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: form.name.trim(),
                    description: form.description.trim(),
                    organization_id: activeOrganization.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to create service."
                );
            }

            setForm({ name: "", description: "" });
            setShowCreateModal(false);
            setCurrentPage(1);
            await loadServices();
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleUpdateService = async (event) => {
        event.preventDefault();

        if (!editingService || !editForm.name.trim()) return;

        setUpdating(true);

        const api = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `${api}/api/services/${editingService.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: editForm.name.trim(),
                        description: editForm.description.trim(),
                        organization_id: activeOrganization.id,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update service."
                );
            }

            await loadServices();

            setShowEditModal(false);
            setEditingService(null);
            setEditForm({ name: "", description: "" });
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteService = async () => {
        if (!serviceToDelete) return;

        setDeleting(true);

        const serviceId = serviceToDelete.id;
        const api = process.env.NEXT_PUBLIC_API_URL;
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(
                `${api}/api/services/${serviceId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to delete service."
                );
            }

            await loadServices();

            setCurrentPage(1);
            setShowDeleteModal(false);
            setServiceToDelete(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <main className="flex min-h-screen flex-1 items-center justify-center bg-[#E9E9DF]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#D7DDD2] border-t-[#FF6B1A]" />
                    <p className="text-xs font-medium text-[#817673]">
                        Loading services...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen flex-1 overflow-hidden bg-[#E9E9DF] px-5 py-8 text-[#4B1B27] sm:px-8 lg:px-10">
            <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#FF6B1A]/[0.09] blur-[120px]" />
            <div className="pointer-events-none absolute -left-40 top-80 h-96 w-96 rounded-full bg-[#4B1B27]/[0.06] blur-[120px]" />

            <div className="relative mx-auto max-w-[1500px]">

                {/* HEADER */}
                <header className="relative mb-8 overflow-hidden rounded-[28px] bg-[#4B1B27] px-6 py-8 text-white shadow-[0_20px_55px_rgba(75,27,39,0.15)] sm:px-9 sm:py-10">
                    <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full border border-white/[0.07]" />
                    <div className="pointer-events-none absolute -right-4 -top-20 h-64 w-64 rounded-full border border-white/[0.07]" />
                    <div className="pointer-events-none absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-[#FF6B1A]/15 blur-[90px]" />

                    <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                        <div>
                            <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF8A48]">
                                <Layers3 size={14} />
                                Infrastructure management
                            </div>

                            <h1 className="text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
                                Services<span className="text-[#FF8A48]">.</span>
                            </h1>

                            <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">
                                Monitor and manage the services powering your organization.
                            </p>

                            {!isPlatformAdmin && activeOrganization && (
                                <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-medium text-white/80">
                                    <Building2 size={14} className="text-[#FF8A48]" />
                                    {activeOrganization.name}
                                </div>
                            )}
                        </div>

                        {canManageServices && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#FF6B1A] px-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#F45B0A] hover:shadow-xl"
                            >
                                <Plus size={17} />
                                Add service
                            </button>
                        )}
                    </div>

                    <div className="relative mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5">
                        <div className="flex items-center gap-2 text-xs text-white/55">
                            <Server size={14} className="text-[#FF8A48]" />
                            Service directory
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/55">
                            <Activity size={14} className="text-[#FF8A48]" />
                            Incident monitoring
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/55">
                            <Building2 size={14} className="text-[#FF8A48]" />
                            Organization infrastructure
                        </div>
                    </div>
                </header>

                {/* ERROR */}
                {error && (
                    <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-[#B44343]/20 bg-[#B44343]/[0.07] px-4 py-3 text-sm text-[#A33B3B]">
                        <span className="flex items-center gap-2">
                            <CircleAlert size={16} />
                            {error}
                        </span>
                        <button
                            onClick={() => setError("")}
                            className="rounded-lg p-1 transition hover:bg-[#B44343]/10"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {!activeOrganization && !isPlatformAdmin ? (
                    <div className="mt-10 rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4B1B27]/[0.07] text-[#4B1B27]">
                            <Building2 size={26} />
                        </div>
                        <p className="mt-4 text-sm font-bold text-[#4B1B27]">
                            No organization selected
                        </p>
                        <p className="mt-2 text-xs text-[#817673]">
                            Select an organization to view its services.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* METRICS */}
                        <section className="grid grid-cols-1 gap-3 py-8 sm:grid-cols-3">
                            {[
                                {
                                    label: "Total services",
                                    value: filteredServices.length,
                                    icon: Server,
                                    color: "#4B1B27",
                                    description: "Registered services",
                                },
                                {
                                    label: "Active incidents",
                                    value: filteredServices.reduce(
                                        (sum, service) => sum + service.activeCount,
                                        0
                                    ),
                                    icon: Activity,
                                    color: "#B44343",
                                    description: "Currently requiring attention",
                                },
                                {
                                    label: "Total incidents",
                                    value: filteredServices.reduce(
                                        (sum, service) => sum + service.incidentCount,
                                        0
                                    ),
                                    icon: CircleAlert,
                                    color: "#C4972B",
                                    description: "Across all services",
                                },
                            ].map((metric) => {
                                const Icon = metric.icon;

                                return (
                                    <div
                                        key={metric.label}
                                        className="group relative overflow-hidden rounded-2xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B1A]/40 hover:shadow-xl hover:shadow-[#4B1B27]/[0.07] sm:p-6"
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#817673]">
                                                {metric.label}
                                            </p>
                                            <span
                                                className="flex h-9 w-9 items-center justify-center rounded-xl"
                                                style={{
                                                    color: metric.color,
                                                    backgroundColor: `${metric.color}15`,
                                                }}
                                            >
                                                <Icon size={18} />
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

                                        <div
                                            className="absolute bottom-0 left-0 h-[3px] w-0 transition-all duration-300 group-hover:w-full"
                                            style={{ backgroundColor: metric.color }}
                                        />
                                    </div>
                                );
                            })}
                        </section>

                        {/* SERVICE DIRECTORY */}
                        <section>
                            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                                        Service directory
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#4B1B27]">
                                        All services
                                    </h2>
                                    <p className="mt-1 text-xs text-[#817673]">
                                        View service health and incident activity.
                                    </p>
                                </div>

                                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                                    {isPlatformAdmin && (
                                        <div className="relative w-full sm:w-60">
                                            <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-[#FF6B1A]">
                                                <Building2 size={16} />
                                            </div>

                                            <select
                                                value={selectedOrganizationFilter}
                                                onChange={(event) => {
                                                    setSelectedOrganizationFilter(event.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-[#4B1B27]/15 bg-[#FFFEFA] pl-10 pr-11 text-[13px] font-semibold text-[#4B1B27] shadow-[0_3px_12px_rgba(75,27,39,0.04)] outline-none transition-all duration-200 hover:border-[#FF6B1A]/50 hover:shadow-[0_5px_16px_rgba(75,27,39,0.08)] focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10"
                                            >
                                                <option value="all">All Organizations</option>

                                                {organizations.map((organization) => (
                                                    <option
                                                        key={organization.id}
                                                        value={String(organization.id)}
                                                    >
                                                        {organization.name}
                                                    </option>
                                                ))}
                                            </select>

                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4B1B27]/[0.06] text-[#4B1B27] transition-colors">
                                                    <ChevronDown size={15} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative w-full sm:w-64">
                                        <Search
                                            size={16}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9188]"
                                        />
                                        <input
                                            value={search}
                                            onChange={(event) => {
                                                setSearch(event.target.value);
                                                setCurrentPage(1);
                                            }}
                                            placeholder="Search services..."
                                            className="h-11 w-full rounded-xl border border-[#4B1B27]/15 bg-[#FFFEFA] pl-10 pr-4 text-sm text-[#4B1B27] outline-none transition placeholder:text-[#AAA09A] focus:border-[#FF6B1A]/70 focus:ring-2 focus:ring-[#FF6B1A]/10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {filteredServices.length === 0 ? (
                                <div className="rounded-[24px] border border-dashed border-[#4B1B27]/20 bg-[#FFFEFA]/70 py-16 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4B1B27]/[0.07] text-[#4B1B27]">
                                        <Server size={25} />
                                    </div>
                                    <p className="mt-4 text-sm font-bold text-[#4B1B27]">
                                        {search
                                            ? "No matching services"
                                            : "No services yet"}
                                    </p>
                                    <p className="mt-2 text-xs text-[#817673]">
                                        {search
                                            ? "Try another search term."
                                            : "Services created for this organization will appear here."}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {paginatedServices.map((service) => (
                                        <article
                                            key={service.id}
                                            className="group overflow-hidden rounded-[20px] border border-[#4B1B27]/10 bg-[#FFFEFA] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF6B1A]/35 hover:shadow-xl hover:shadow-[#4B1B27]/[0.06]"
                                        >
                                            <div className="flex items-center justify-between gap-3 p-5 sm:p-6">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleService(service.id)
                                                    }
                                                    aria-expanded={expandedServices.includes(
                                                        service.id
                                                    )}
                                                    className="flex min-w-0 flex-1 items-center gap-4 text-left"
                                                >
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#4B1B27]/10 bg-[#4B1B27]/[0.07] text-[#4B1B27] transition group-hover:border-[#FF6B1A]/25 group-hover:bg-[#FF6B1A]/10 group-hover:text-[#B94F1B]">
                                                        <Server size={20} />
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="truncate text-sm font-bold text-[#4B1B27]">
                                                            {service.name}
                                                        </h3>

                                                        <p className="mt-1 text-[10px] text-[#938785]">
                                                            Service #{service.id}
                                                        </p>

                                                        {isPlatformAdmin && (
                                                            <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#B65323]">
                                                                <Building2 size={11} />
                                                                {service.organization_name ||
                                                                    `Organization #${service.organization_id}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>

                                                <div className="flex shrink-0 items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleService(service.id)
                                                        }
                                                        aria-label="Toggle service details"
                                                        className="rounded-lg p-2 text-[#938785] transition hover:bg-[#E9E9DF] hover:text-[#4B1B27]"
                                                    >
                                                        <ChevronDown
                                                            size={18}
                                                            className={`transition-transform duration-200 ${expandedServices.includes(
                                                                service.id
                                                            )
                                                                ? "rotate-180"
                                                                : ""
                                                                }`}
                                                        />
                                                    </button>

                                                    {canManageServices && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingService(service);
                                                                    setEditForm({
                                                                        name: service.name || "",
                                                                        description:
                                                                            service.description || "",
                                                                    });
                                                                    setShowEditModal(true);
                                                                }}
                                                                title="Edit service"
                                                                className="rounded-lg p-2 text-[#938785] transition hover:bg-[#FF6B1A]/10 hover:text-[#C45A24]"
                                                            >
                                                                <Pencil size={15} />
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setServiceToDelete(service);
                                                                    setShowDeleteModal(true);
                                                                }}
                                                                title="Delete service"
                                                                className="rounded-lg p-2 text-[#938785] transition hover:bg-[#B44343]/10 hover:text-[#B44343]"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {expandedServices.includes(service.id) && (
                                                <div className="border-t border-[#4B1B27]/10 bg-[#E9E9DF]/55 px-5 py-5 sm:px-6">
                                                    <p className="min-h-10 text-xs leading-6 text-[#756B69]">
                                                        {service.description ||
                                                            "No description provided for this service."}
                                                    </p>

                                                    {/* SERVICE INCIDENT METRICS */}
                                                    <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#4B1B27]/10 py-4">
                                                        <div>
                                                            <p className="text-[10px] font-semibold text-[#938785]">
                                                                Incidents
                                                            </p>
                                                            <p className="mt-1.5 text-xl font-bold text-[#4B1B27]">
                                                                {service.incidentCount}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] font-semibold text-[#938785]">
                                                                Active
                                                            </p>
                                                            <p className="mt-1.5 text-xl font-bold text-[#B44343]">
                                                                {service.activeCount}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] font-semibold text-[#938785]">
                                                                Resolved
                                                            </p>
                                                            <p className="mt-1.5 text-xl font-bold text-[#39734E]">
                                                                {service.resolvedCount}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* RECENT INCIDENTS */}
                                                    {service.incidents.length > 0 && (
                                                        <div className="mt-5">
                                                            <div className="mb-3 flex items-center justify-between">
                                                                <p className="text-xs font-bold text-[#4B1B27]">
                                                                    Recent incidents
                                                                </p>
                                                                <span className="text-[10px] text-[#938785]">
                                                                    {service.incidents.length} total
                                                                </span>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {service.incidents
                                                                    .slice(0, 3)
                                                                    .map((incident) => (
                                                                        <div
                                                                            key={incident.id}
                                                                            className="flex items-center justify-between gap-3 rounded-xl border border-[#4B1B27]/10 bg-[#FFFEFA] px-3 py-3 transition hover:border-[#FF6B1A]/30"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        router.push(
                                                                                            `/incidents/${incident.id}`
                                                                                        )
                                                                                    }
                                                                                    className="truncate text-left text-xs font-semibold text-[#4B1B27] transition hover:text-[#FF6B1A]"
                                                                                >
                                                                                    {incident.title}
                                                                                </button>

                                                                                <p className="mt-1 text-[10px] text-[#938785]">
                                                                                    {incident.created_at
                                                                                        ? new Date(
                                                                                            incident.created_at
                                                                                        ).toLocaleDateString()
                                                                                        : "Date unavailable"}
                                                                                </p>
                                                                            </div>

                                                                            <div className="flex shrink-0 flex-col items-end gap-2">
                                                                                <span
                                                                                    className={`rounded-md px-2 py-1 text-[9px] font-bold text-white ${severityColors[
                                                                                        incident.severity
                                                                                    ] ||
                                                                                        "bg-[#8B807E]"
                                                                                        }`}
                                                                                >
                                                                                    {incident.severity}
                                                                                </span>

                                                                                <span className="text-[9px] font-medium text-[#817673]">
                                                                                    {incident.status}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                            </div>

                                                            {service.incidents.length > 3 && (
                                                                <p className="mt-3 text-right text-[10px] text-[#938785]">
                                                                    +
                                                                    {service.incidents.length -
                                                                        3}{" "}
                                                                    more incidents
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* SERVICE FOOTER */}
                                                    <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[#4B1B27]/10 pt-4 sm:flex-row sm:items-center">
                                                        <span className="flex items-center gap-2 text-[10px] font-medium text-[#756B69]">
                                                            {service.activeCount > 0 ? (
                                                                <>
                                                                    <span className="h-2 w-2 rounded-full bg-[#B44343]" />
                                                                    Requires attention
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2
                                                                        size={13}
                                                                        className="text-[#39734E]"
                                                                    />
                                                                    No active incidents
                                                                </>
                                                            )}
                                                        </span>

                                                        <button
                                                            onClick={() =>
                                                                router.push(
                                                                    `/incidents?service_id=${service.id}`
                                                                )
                                                            }
                                                            className="flex items-center gap-1 text-[10px] font-bold text-[#B65323] transition hover:text-[#FF6B1A]"
                                                        >
                                                            View incidents
                                                            <ArrowUpRight size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}

                            {/* PAGINATION */}
                            {totalPages > 1 && (
                                <div className="mt-8 flex flex-col justify-between gap-4 border-t border-[#4B1B27]/15 pt-5 sm:flex-row sm:items-center">
                                    <p className="text-xs text-[#817673]">
                                        Page {currentPage} of {totalPages}
                                        <span className="ml-2">
                                            ({filteredServices.length} services)
                                        </span>
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.max(page - 1, 1)
                                                )
                                            }
                                            disabled={currentPage === 1}
                                            className="rounded-lg border border-[#4B1B27]/15 bg-[#FFFEFA] px-4 py-2.5 text-xs font-semibold text-[#4B1B27] transition hover:border-[#FF6B1A]/40 hover:bg-[#FF6B1A]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Previous
                                        </button>

                                        <button
                                            onClick={() =>
                                                setCurrentPage((page) =>
                                                    Math.min(page + 1, totalPages)
                                                )
                                            }
                                            disabled={currentPage === totalPages}
                                            className="rounded-lg border border-[#4B1B27]/15 bg-[#FFFEFA] px-4 py-2.5 text-xs font-semibold text-[#4B1B27] transition hover:border-[#FF6B1A]/40 hover:bg-[#FF6B1A]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* FOOTER */}
                <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-[#4B1B27]/15 pt-6 text-[10px] font-medium text-[#938785] sm:flex-row">
                    <span className="font-bold tracking-wide text-[#4B1B27]">
                        INCIDENTFLOW{" "}
                        <span className="font-normal text-[#938785]">
                            · Infrastructure management
                        </span>
                    </span>
                    <span>
                        Service visibility and incident monitoring
                    </span>
                </footer>
            </div>

            {/* CREATE SERVICE MODAL */}

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#35151F]/60 p-4 backdrop-blur-sm">
                    <form
                        onSubmit={handleCreateService}
                        className="w-full max-w-md overflow-hidden rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] shadow-2xl shadow-[#35151F]/30"
                    >
                        <div className="relative overflow-hidden bg-[#4B1B27] px-6 py-5 text-white">
                            <div className="pointer-events-none absolute -right-8 -top-16 h-40 w-40 rounded-full border border-white/[0.08]" />

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8A48]">
                                        Service directory
                                    </p>
                                    <h2 className="mt-1 text-lg font-bold text-white">
                                        Create service
                                    </h2>
                                    <p className="mt-1 text-xs text-white/55">
                                        {isPlatformAdmin
                                            ? "Choose an organization for this service."
                                            : `Add a service to ${activeOrganization?.name || "your organization"}.`}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 px-6 py-5">
                            {isPlatformAdmin && (
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#4B1B27]">
                                        <Building2 size={14} className="text-[#FF6B1A]" />
                                        Organization
                                    </label>

                                    <div className="relative">
                                        <select
                                            required
                                            value={selectedServiceOrganization}
                                            onChange={(event) =>
                                                setSelectedServiceOrganization(event.target.value)
                                            }
                                            className="h-11 w-full appearance-none rounded-xl border border-[#4B1B27]/15 bg-[#F5F3EA] px-3 pr-10 text-sm font-medium text-[#35151F] outline-none transition hover:border-[#FF6B1A]/50 focus:border-[#FF6B1A] focus:bg-white focus:ring-2 focus:ring-[#FF6B1A]/10"
                                        >
                                            <option value="">Select an organization</option>
                                            {organizations.map((organization) => (
                                                <option
                                                    key={organization.id}
                                                    value={String(organization.id)}
                                                >
                                                    {organization.name}
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown
                                            size={16}
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4B1B27]/50"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-[#4B1B27]">
                                    Service name
                                </label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            name: event.target.value,
                                        })
                                    }
                                    placeholder="e.g. Payment Service"
                                    className="h-11 w-full rounded-xl border border-[#4B1B27]/15 bg-white px-3 text-sm text-[#4B1B27] outline-none transition placeholder:text-[#AAA09A] focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A]/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-[#4B1B27]">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            description: event.target.value,
                                        })
                                    }
                                    placeholder="What does this service do?"
                                    className="w-full resize-none rounded-xl border border-[#4B1B27]/15 bg-white px-3 py-3 text-sm text-[#4B1B27] outline-none transition placeholder:text-[#AAA09A] focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A]/10"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-[#4B1B27]/10 bg-[#E9E9DF]/60 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-xl border border-[#4B1B27]/15 bg-[#FFFEFA] px-4 py-2.5 text-xs font-semibold text-[#4B1B27] transition hover:bg-[#E9E9DF]"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    creating ||
                                    !form.name.trim() ||
                                    (isPlatformAdmin && !selectedServiceOrganization)
                                }
                                className="rounded-xl bg-[#FF6B1A] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#E85A0B] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {creating ? "Creating..." : "Create service"}
                            </button>
                        </div>
                    </form>
                </div>
            )}


            {/* DELETE SERVICE MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#35151F]/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] p-6 shadow-2xl shadow-[#35151F]/30">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#B44343]/10 text-[#B44343]">
                            <Trash2 className="h-6 w-6" />
                        </div>

                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B44343]">
                            Confirm action
                        </p>
                        <h2 className="mt-2 text-xl font-bold text-[#4B1B27]">
                            Delete service?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#817673]">
                            Are you sure you want to delete{" "}
                            <span className="font-bold text-[#4B1B27]">
                                {serviceToDelete?.name}
                            </span>
                            ? This action cannot be undone.
                        </p>

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setServiceToDelete(null);
                                }}
                                disabled={deleting}
                                className="rounded-xl border border-[#4B1B27]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#756B69] transition hover:bg-[#E9E9DF]"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleDeleteService}
                                disabled={deleting}
                                className="rounded-xl bg-[#B44343] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#963737] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleting ? "Deleting..." : "Delete Service"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT SERVICE MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#35151F]/60 p-4 backdrop-blur-sm">
                    <form
                        onSubmit={handleUpdateService}
                        className="w-full max-w-md overflow-hidden rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] shadow-2xl shadow-[#35151F]/30"
                    >
                        <div className="relative overflow-hidden bg-[#4B1B27] px-6 py-5 text-white">
                            <div className="pointer-events-none absolute -right-8 -top-16 h-40 w-40 rounded-full border border-white/[0.08]" />

                            <div className="relative flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8A48]">
                                        Service directory
                                    </p>
                                    <h2 className="mt-1 text-lg font-bold text-white">
                                        Edit service
                                    </h2>
                                    <p className="mt-1 text-xs text-white/55">
                                        Update service details.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingService(null);
                                    }}
                                    className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 px-6 py-5">
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-[#4B1B27]">
                                    Service name
                                </label>
                                <input
                                    required
                                    value={editForm.name}
                                    onChange={(event) =>
                                        setEditForm({
                                            ...editForm,
                                            name: event.target.value,
                                        })
                                    }
                                    placeholder="Service name"
                                    className="h-11 w-full rounded-xl border border-[#4B1B27]/15 bg-white px-3 text-sm text-[#4B1B27] outline-none transition placeholder:text-[#AAA09A] focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A]/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold text-[#4B1B27]">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(event) =>
                                        setEditForm({
                                            ...editForm,
                                            description: event.target.value,
                                        })
                                    }
                                    placeholder="Service description"
                                    className="w-full resize-none rounded-xl border border-[#4B1B27]/15 bg-white px-3 py-3 text-sm text-[#4B1B27] outline-none transition placeholder:text-[#AAA09A] focus:border-[#FF6B1A] focus:ring-2 focus:ring-[#FF6B1A]/10"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-[#4B1B27]/10 bg-[#E9E9DF]/60 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingService(null);
                                }}
                                disabled={updating}
                                className="rounded-xl border border-[#4B1B27]/15 bg-[#FFFEFA] px-4 py-2.5 text-xs font-semibold text-[#4B1B27] transition hover:bg-[#E9E9DF]"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={updating || !editForm.name.trim()}
                                className="rounded-xl bg-[#FF6B1A] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#E85A0B] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {updating ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}

