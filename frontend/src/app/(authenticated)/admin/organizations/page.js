"use client";

import { useEffect, useState } from "react";

import {
    Building2,
    Layers3,
    Plus,
    Search,
    Pencil,
    Trash2,
    Server,
    ArrowUpRight,
    ChevronDown,
    X,
    ShieldCheck,
    Activity,
    Boxes,
    Network,
    AlertCircle,
    Loader2,
    BriefcaseBusiness,
    CircleDot,
} from "lucide-react";

export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState([]);
    const [expandedOrganizations, setExpandedOrganizations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const organizationsPerPage = 6;
    const [services, setServices] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [organizationName, setOrganizationName] = useState("");
    const [creatingOrganization, setCreatingOrganization] = useState(false);
    const [organizationError, setOrganizationError] = useState("");
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [serviceName, setServiceName] = useState("");
    const [serviceDescription, setServiceDescription] = useState("");
    const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
    const [creatingService, setCreatingService] = useState(false);
    const [serviceError, setServiceError] = useState("");
    const [editingOrganization, setEditingOrganization] = useState(null);
    const [deletingOrganization, setDeletingOrganization] = useState(null);
    const [deleteOrganizationLoading, setDeleteOrganizationLoading] = useState(false);
    const [deleteOrganizationError, setDeleteOrganizationError] = useState("");
    const [organizationLoading, setOrganizationLoading] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [deletingService, setDeletingService] = useState(null);
    const [deleteServiceLoading, setDeleteServiceLoading] = useState(false);
    const [deleteServiceError, setDeleteServiceError] = useState("");
    const [editingServiceOrganizationId, setEditingServiceOrganizationId] = useState("");
    const [serviceLoading, setServiceLoading] = useState(false);

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();

                setOrganizations(data.organizations || []);
            } catch (error) {
                console.error("Error fetching organizations:", error);
            }
        };

        const fetchServices = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/services`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();

                setServices(data.services || []);
            } catch (error) {
                console.error("Error fetching services:", error);
            }
        };

        fetchOrganizations();
        fetchServices();
    }, []);

    const handleCreateOrganization = async () => {
        if (!organizationName.trim()) {
            setOrganizationError("Please enter an organization name.");
            return;
        }

        try {
            setCreatingOrganization(true);
            setOrganizationError("");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        name: organizationName.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setOrganizationError(
                    data.message || "Failed to create organization."
                );
                return;
            }

            setOrganizations((prev) => [
                ...prev,
                data.organization
            ]);

            setCurrentPage(1);
            setOrganizationName("");
            setShowCreateModal(false);
        } catch (error) {
            console.error("Error creating organization:", error);
            setOrganizationError("Something went wrong.");
        } finally {
            setCreatingOrganization(false);
        }
    };

    const handleCreateService = async () => {
        if (!serviceName.trim()) {
            setServiceError("Please enter a service name.");
            return;
        }

        if (!selectedOrganizationId) {
            setServiceError("Organization is required.");
            return;
        }

        try {
            setCreatingService(true);
            setServiceError("");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/services`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        name: serviceName.trim(),
                        description: serviceDescription.trim(),
                        organization_id: Number(selectedOrganizationId)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setServiceError(
                    data.message || "Failed to create service."
                );
                return;
            }

            setServices((prev) => [
                ...prev,
                data.service
            ]);

            setServiceName("");
            setServiceDescription("");
            setSelectedOrganizationId("");
            setShowServiceModal(false);
        } catch (error) {
            console.error("Error creating service:", error);
            setServiceError("Something went wrong.");
        } finally {
            setCreatingService(false);
        }
    };

    const openEditOrganization = (organization) => {
        setEditingOrganization(organization);
        setOrganizationName(organization.name);
        setOrganizationError("");
    };

    const updateOrganization = async () => {
        if (!organizationName.trim()) {
            setOrganizationError("Organization name is required");
            return;
        }

        try {
            setOrganizationLoading(true);
            setOrganizationError("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${editingOrganization.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: organizationName.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update organization"
                );
            }

            setOrganizations((prev) =>
                prev.map((organization) =>
                    organization.id === editingOrganization.id
                        ? data.organization
                        : organization
                )
            );

            setEditingOrganization(null);
            setOrganizationName("");
        } catch (error) {
            setOrganizationError(error.message);
        } finally {
            setOrganizationLoading(false);
        }
    };

    const openEditService = (service) => {
        setEditingService(service);
        setServiceName(service.name);
        setServiceDescription(service.description || "");
        setEditingServiceOrganizationId(
            String(service.organization_id)
        );
        setServiceError("");
    };

    const updateService = async () => {
        if (!serviceName.trim()) {
            setServiceError("Service name is required");
            return;
        }

        if (!editingServiceOrganizationId) {
            setServiceError("Organization is required");
            return;
        }

        try {
            setServiceLoading(true);
            setServiceError("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/services/${editingService.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: serviceName.trim(),
                        description: serviceDescription.trim(),
                        organization_id: Number(
                            editingServiceOrganizationId
                        )
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to update service"
                );
            }

            setServices((prev) =>
                prev.map((service) =>
                    service.id === editingService.id
                        ? data.service
                        : service
                )
            );

            setEditingService(null);
            setServiceName("");
            setServiceDescription("");
            setEditingServiceOrganizationId("");
        } catch (error) {
            setServiceError(error.message);
        } finally {
            setServiceLoading(false);
        }
    };

    const deleteOrganization = async () => {
        if (!deletingOrganization) {
            return;
        }

        try {
            setDeleteOrganizationLoading(true);
            setDeleteOrganizationError("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${deletingOrganization.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to delete organization"
                );
            }

            setOrganizations((prev) =>
                prev.filter(
                    (organization) =>
                        organization.id !== deletingOrganization.id
                )
            );

            setCurrentPage(1);

            setServices((prev) =>
                prev.filter(
                    (service) =>
                        service.organization_id !== deletingOrganization.id
                )
            );

            setDeletingOrganization(null);
        } catch (error) {
            setDeleteOrganizationError(error.message);
        } finally {
            setDeleteOrganizationLoading(false);
        }
    };

    const deleteService = async () => {
        if (!deletingService) {
            return;
        }

        try {
            setDeleteServiceLoading(true);
            setDeleteServiceError("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/services/${deletingService.id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to delete service"
                );
            }

            setServices((prev) =>
                prev.filter(
                    (service) =>
                        service.id !== deletingService.id
                )
            );

            setDeletingService(null);
        } catch (error) {
            setDeleteServiceError(error.message);
        } finally {
            setDeleteServiceLoading(false);
        }
    };

    const filteredOrganizations = organizations.filter((organization) =>
        organization.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(
        filteredOrganizations.length / organizationsPerPage
    );

    const paginatedOrganizations = filteredOrganizations.slice(
        (currentPage - 1) * organizationsPerPage,
        currentPage * organizationsPerPage
    );

    const toggleOrganization = (organizationId) => {
        setExpandedOrganizations((prev) =>
            prev.includes(organizationId)
                ? prev.filter((id) => id !== organizationId)
                : [...prev, organizationId]
        );
    };

    const inputClass =
        "h-10 w-full rounded-lg border border-[#4B1B27]/15 bg-[#F8F6F0] px-3.5 text-[12px] text-[#35151F] outline-none transition placeholder:text-[#A49A90] focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10";

    const labelClass =
        "mb-1.5 block text-[11px] font-semibold text-[#5E4A49]";

    const cancelButtonClass =
        "h-9 rounded-lg border border-[#4B1B27]/15 bg-white px-3.5 text-[11px] font-semibold text-[#6F625D] transition hover:border-[#4B1B27]/25 hover:bg-[#F3EFE7] hover:text-[#35151F] disabled:opacity-50";

    const primaryButtonClass =
        "inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF6B1A] px-3.5 text-[11px] font-semibold text-[#35151F] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#F45B0A] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <main className="organizations-page min-h-screen overflow-hidden bg-[#E9E9DF] text-[#35151F]">
            <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9 lg:py-8">

                {/* PAGE HEADER */}
                <header className="relative overflow-hidden rounded-[22px] border border-[#4B1B27] bg-[#4B1B27] px-6 py-6 shadow-[0_14px_35px_rgba(53,21,31,0.12)] sm:px-8 sm:py-7">
                    <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-[#FF6B1A]/20 blur-[85px]" />
                    <div className="pointer-events-none absolute -bottom-32 right-1/3 h-56 w-56 rounded-full bg-[#D7DDD2]/10 blur-[85px]" />
                    <div className="pointer-events-none absolute right-12 top-1/2 hidden h-56 w-56 -translate-y-1/2 rounded-full border border-white/[0.07] lg:block" />
                    <div className="pointer-events-none absolute right-24 top-1/2 hidden h-36 w-36 -translate-y-1/2 rounded-full border border-white/[0.07] lg:block" />

                    <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#F5B18C]">
                                <Building2 className="h-3 w-3 text-[#FF6B1A]" />
                                <span>Administration</span>
                                <span className="text-white/30">/</span>
                                <span className="text-white/60">Workspace</span>
                            </div>

                            <h1 className="text-[27px] font-semibold tracking-[-0.04em] text-[#FFFEFA] sm:text-[30px]">
                                Organizations
                            </h1>

                            <p className="mt-2 max-w-xl text-[12px] leading-5 text-white/65">
                                Manage your organization structure, organize services
                                and keep your incident operations connected.
                            </p>

                            <div className="mt-4 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A] shadow-[0_0_10px_rgba(255,107,26,0.8)]" />
                                <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/55">
                                    Organization management
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setOrganizationName("");
                                setOrganizationError("");
                                setShowCreateModal(true);
                            }}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#FF6B1A] px-4 text-[11px] font-semibold text-[#35151F] shadow-[0_7px_18px_rgba(255,107,26,0.2)] transition hover:-translate-y-0.5 hover:bg-[#FF8240] hover:shadow-[0_10px_24px_rgba(255,107,26,0.28)]"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Create organization
                            <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
                        </button>
                    </div>
                </header>

                {/* OVERVIEW METRICS */}
                <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="group flex items-center gap-3 rounded-xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-4 shadow-[0_3px_12px_rgba(53,21,31,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-[#FF6B1A]/40 hover:shadow-[0_10px_24px_rgba(53,21,31,0.07)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#FF6B1A]/20 bg-[#FF6B1A]/10 transition group-hover:bg-[#FF6B1A]/15">
                            <Building2 className="h-4 w-4 text-[#4B1B27]" />
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.09em] text-[#8D8177]">
                                Total organizations
                            </p>
                            <p className="mt-1 text-xl font-semibold tracking-tight text-[#35151F]">
                                {organizations.length}
                            </p>
                        </div>
                        <div className="ml-auto self-start rounded-md bg-[#4B1B27]/[0.06] px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#4B1B27]">
                            Workspaces
                        </div>
                    </div>

                    <div className="group flex items-center gap-3 rounded-xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-4 shadow-[0_3px_12px_rgba(53,21,31,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-[#FF6B1A]/40 hover:shadow-[0_10px_24px_rgba(53,21,31,0.07)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#4B1B27]/10 bg-[#4B1B27]/[0.07] transition group-hover:bg-[#4B1B27]/[0.11]">
                            <Layers3 className="h-4 w-4 text-[#4B1B27]" />
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.09em] text-[#8D8177]">
                                Total services
                            </p>
                            <p className="mt-1 text-xl font-semibold tracking-tight text-[#35151F]">
                                {services.length}
                            </p>
                        </div>
                        <div className="ml-auto self-start rounded-md bg-[#4B1B27]/[0.06] px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#4B1B27]">
                            Systems
                        </div>
                    </div>

                    <div className="group flex items-center gap-3 rounded-xl border border-[#4B1B27]/10 bg-[#FFFEFA] p-4 shadow-[0_3px_12px_rgba(53,21,31,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-[#FF6B1A]/40 hover:shadow-[0_10px_24px_rgba(53,21,31,0.07)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D7DDD2] bg-[#D7DDD2]/60 transition group-hover:bg-[#D7DDD2]">
                            <Activity className="h-4 w-4 text-[#4B1B27]" />
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.09em] text-[#8D8177]">
                                Service coverage
                            </p>
                            <p className="mt-1 text-xl font-semibold tracking-tight text-[#35151F]">
                                {organizations.length > 0
                                    ? `${Math.round(
                                        (organizations.filter((org) =>
                                            services.some(
                                                (service) =>
                                                    String(service.organization_id) ===
                                                    String(org.id)
                                            )
                                        ).length /
                                            organizations.length) *
                                        100
                                    )}%`
                                    : "0%"}
                            </p>
                        </div>
                        <div className="ml-auto self-start rounded-md bg-[#D7DDD2]/70 px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#4B1B27]">
                            Coverage
                        </div>
                    </div>
                </section>

                {/* ORGANIZATION DIRECTORY */}
                <section className="mt-8">
                    <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-4 w-1 rounded-full bg-[#FF6B1A]" />
                                <h2 className="text-[15px] font-semibold tracking-tight text-[#35151F]">
                                    Organization directory
                                </h2>
                            </div>
                            <p className="mt-1.5 pl-3 text-[11px] text-[#877A70]">
                                Your organizations and their associated services.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A09287]" />

                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search organizations..."
                                    className="h-9 w-full rounded-lg border border-[#4B1B27]/15 bg-[#FFFEFA] pl-9 pr-3.5 text-[11px] text-[#35151F] outline-none transition placeholder:text-[#A49A90] focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10 sm:w-60"
                                />
                            </div>

                            <div className="flex h-9 items-center gap-2 rounded-lg border border-[#4B1B27]/10 bg-[#D7DDD2]/45 px-3 text-[10px] font-medium text-[#4B1B27]">
                                <CircleDot className="h-3 w-3 text-[#FF6B1A]" />
                                {filteredOrganizations.length} organizations found
                            </div>
                        </div>
                    </div>

                    {/* ORGANIZATION LIST */}
                    <div className="space-y-3">
                        {filteredOrganizations.length > 0 ? (
                            paginatedOrganizations.map((organization) => {
                                const organizationServices = services.filter(
                                    (service) =>
                                        String(service.organization_id) ===
                                        String(organization.id)
                                );

                                return (
                                    <article
                                        key={organization.id}
                                        className="overflow-hidden rounded-xl border border-[#4B1B27]/10 bg-[#FFFEFA] shadow-[0_3px_14px_rgba(53,21,31,0.03)] transition duration-200 hover:border-[#FF6B1A]/35 hover:shadow-[0_9px_24px_rgba(53,21,31,0.07)]"
                                    >
                                        {/* ORGANIZATION HEADER */}
                                        <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                                            <button
                                                type="button"
                                                onClick={() => toggleOrganization(organization.id)}
                                                aria-expanded={expandedOrganizations.includes(organization.id)}
                                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#4B1B27]/10 bg-[#4B1B27]/[0.07] transition group-hover:bg-[#FF6B1A]/10">
                                                    <Building2 className="h-4 w-4 text-[#4B1B27]" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="truncate text-[13px] font-semibold text-[#35151F]">
                                                            {organization.name}
                                                        </h3>

                                                        <span className="rounded border border-[#4B1B27]/10 bg-[#D7DDD2]/50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#4B1B27]">
                                                            Organization
                                                        </span>
                                                    </div>

                                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                        <p className="text-[10px] text-[#9A8E84]">
                                                            Organization ID: #{organization.id}
                                                        </p>

                                                        <span className="h-1 w-1 rounded-full bg-[#B9ADA3]" />

                                                        <p className="text-[10px] font-medium text-[#766B64]">
                                                            {organizationServices.length}{" "}
                                                            {organizationServices.length === 1
                                                                ? "service"
                                                                : "services"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>

                                            <div className="flex shrink-0 items-center gap-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleOrganization(organization.id)}
                                                    aria-label="Toggle organization details"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8D8177] transition hover:bg-[#FF6B1A]/10 hover:text-[#4B1B27]"
                                                >
                                                    <ChevronDown
                                                        size={16}
                                                        className={`transition-transform duration-200 ${expandedOrganizations.includes(organization.id)
                                                            ? "rotate-180"
                                                            : ""
                                                            }`}
                                                    />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => openEditOrganization(organization)}
                                                    title="Edit organization"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8D8177] transition hover:bg-[#FF6B1A]/10 hover:text-[#FF6B1A]"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDeletingOrganization(organization);
                                                        setDeleteOrganizationError("");
                                                    }}
                                                    title="Delete organization"
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#A18A83] transition hover:bg-[#FCEDEA] hover:text-[#C34B42]"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* SERVICE SECTION */}
                                        {expandedOrganizations.includes(organization.id) && (
                                            <div className="border-t border-[#4B1B27]/10 bg-[#F4F1E8] px-4 py-4 sm:px-5">
                                                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#4B1B27]/10 bg-[#4B1B27]/[0.07]">
                                                            <Layers3 className="h-3.5 w-3.5 text-[#4B1B27]" />
                                                        </div>

                                                        <div>
                                                            <h4 className="text-[12px] font-semibold text-[#35151F]">
                                                                Services
                                                            </h4>
                                                            <p className="mt-0.5 text-[10px] text-[#877A70]">
                                                                {organizationServices.length}{" "}
                                                                {organizationServices.length === 1
                                                                    ? "service"
                                                                    : "services"}{" "}
                                                                associated with this organization
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingService(null);
                                                            setShowServiceModal(false);
                                                            setServiceName("");
                                                            setServiceDescription("");
                                                            setServiceError("");
                                                            setSelectedOrganizationId(
                                                                String(organization.id)
                                                            );
                                                            setShowServiceModal(true);
                                                        }}
                                                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#FF6B1A] px-3 text-[10px] font-semibold text-[#35151F] transition hover:bg-[#FF8240] hover:shadow-md"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Add service
                                                    </button>
                                                </div>

                                                {/* SERVICE ROWS */}
                                                {organizationServices.length > 0 ? (
                                                    <div className="overflow-hidden rounded-lg border border-[#4B1B27]/10 bg-[#FFFEFA]">
                                                        {organizationServices.map((service, index) => (
                                                            <div
                                                                key={service.id}
                                                                className={`group flex flex-col justify-between gap-3 px-3.5 py-3 transition hover:bg-[#F8F4EC] sm:flex-row sm:items-center sm:px-4 ${index !== 0 ? "border-t border-[#4B1B27]/10" : ""
                                                                    }`}
                                                            >
                                                                <div className="flex min-w-0 items-start gap-2.5">
                                                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#4B1B27]/10 bg-[#4B1B27]/[0.06]">
                                                                        <Server className="h-3.5 w-3.5 text-[#4B1B27]" />
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <p className="text-[12px] font-semibold text-[#4B1B27] transition group-hover:text-[#FF6B1A]">
                                                                            {service.name}
                                                                        </p>

                                                                        <p className="mt-0.5 break-words text-[10px] leading-4 text-[#83776E]">
                                                                            {service.description || "No description provided"}
                                                                        </p>

                                                                        <p className="mt-1.5 text-[9px] font-medium text-[#A69A90]">
                                                                            Service ID: #{service.id}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex shrink-0 items-center gap-1.5 sm:pl-4">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setShowServiceModal(false);
                                                                            openEditService(service);
                                                                        }}
                                                                        className="inline-flex h-8 items-center gap-1 rounded-md border border-[#4B1B27]/15 bg-white px-2.5 text-[10px] font-semibold text-[#6F625D] transition hover:border-[#FF6B1A]/40 hover:bg-[#FF6B1A]/10 hover:text-[#4B1B27]"
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                        Edit
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setDeletingService(service);
                                                                            setDeleteServiceError("");
                                                                        }}
                                                                        className="inline-flex h-8 items-center gap-1 rounded-md border border-[#EAD4CE] bg-[#FDF6F3] px-2.5 text-[10px] font-semibold text-[#B45B50] transition hover:border-[#DCAAA0] hover:bg-[#FCEDEA]"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#4B1B27]/20 bg-[#FFFEFA] px-5 py-8 text-center">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#4B1B27]/10 bg-[#D7DDD2]/50">
                                                            <Boxes className="h-4 w-4 text-[#4B1B27]" />
                                                        </div>

                                                        <p className="mt-2.5 text-[12px] font-semibold text-[#4B1B27]">
                                                            No services yet
                                                        </p>

                                                        <p className="mt-1 max-w-xs text-[10px] leading-4 text-[#8D8177]">
                                                            Add a service to start organizing
                                                            this organization&apos;s operations.
                                                        </p>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingService(null);
                                                                setShowServiceModal(false);
                                                                setServiceName("");
                                                                setServiceDescription("");
                                                                setServiceError("");
                                                                setSelectedOrganizationId(
                                                                    String(organization.id)
                                                                );
                                                                setShowServiceModal(true);
                                                            }}
                                                            className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#4B1B27] transition hover:text-[#FF6B1A]"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Create first service
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#4B1B27]/20 bg-[#FFFEFA] px-6 py-12 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF6B1A]/20 bg-[#FF6B1A]/10">
                                    <Building2 className="h-5 w-5 text-[#4B1B27]" />
                                </div>

                                <h3 className="mt-4 text-[14px] font-semibold tracking-tight text-[#35151F]">
                                    {searchTerm ? "No matching organizations found" : "No organizations created"}
                                </h3>

                                <p className="mt-1.5 max-w-sm text-[11px] leading-5 text-[#877A70]">
                                    {searchTerm
                                        ? "Try searching with a different organization name."
                                        : "Create your first organization to start grouping services and managing your incident operations."}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setOrganizationName("");
                                        setOrganizationError("");
                                        setShowCreateModal(true);
                                    }}
                                    className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF6B1A] px-3.5 text-[11px] font-semibold text-[#35151F] transition hover:bg-[#FF8240]"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Create organization
                                </button>
                            </div>
                        )}
                    </div>

                    {/* PAGINATION */}
                    {filteredOrganizations.length > organizationsPerPage && (
                        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[#4B1B27]/15 pt-4 sm:flex-row sm:items-center">
                            <p className="text-[10px] text-[#877A70]">
                                Page <span className="font-semibold text-[#4B1B27]">{currentPage}</span> of {totalPages}
                                <span className="ml-2">
                                    ({filteredOrganizations.length} organizations)
                                </span>
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setCurrentPage((page) => Math.max(page - 1, 1))
                                    }
                                    disabled={currentPage === 1}
                                    className="rounded-lg border border-[#4B1B27]/15 bg-[#FFFEFA] px-3.5 py-2 text-[10px] font-semibold text-[#6F625D] transition hover:border-[#FF6B1A]/40 hover:bg-[#FF6B1A]/10 hover:text-[#4B1B27] disabled:cursor-not-allowed disabled:opacity-40"
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
                                    className="rounded-lg border border-[#4B1B27]/15 bg-[#FFFEFA] px-3.5 py-2 text-[10px] font-semibold text-[#6F625D] transition hover:border-[#FF6B1A]/40 hover:bg-[#FF6B1A]/10 hover:text-[#4B1B27] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {/* CREATE ORGANIZATION MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24141A]/65 px-4 py-8 backdrop-blur-[6px]">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#4B1B27]/15 bg-[#FFFEFA] shadow-[0_25px_80px_rgba(53,21,31,0.3)]">
                        <div className="flex items-center justify-between border-b border-[#4B1B27]/10 bg-[#F4F1E8] px-5 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#FF6B1A]/20 bg-[#FF6B1A]/10">
                                    <Building2 className="h-4 w-4 text-[#4B1B27]" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-semibold text-[#35151F]">
                                        Create organization
                                    </h2>
                                    <p className="mt-0.5 text-[10px] text-[#8D8177]">
                                        Add a new workspace organization.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8D8177] transition hover:bg-[#FF6B1A]/10 hover:text-[#4B1B27]"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="p-5">
                            <label className={labelClass}>
                                Organization name
                            </label>

                            <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => setOrganizationName(e.target.value)}
                                placeholder="Enter organization name"
                                className={inputClass}
                            />

                            {organizationError && (
                                <p className="mt-2.5 flex items-center gap-2 text-[11px] font-medium text-[#B84B43]">
                                    <AlertCircle className="h-3 w-3" />
                                    {organizationError}
                                </p>
                            )}

                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className={cancelButtonClass}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCreateOrganization}
                                    disabled={creatingOrganization}
                                    className={primaryButtonClass}
                                >
                                    {creatingOrganization && (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    {creatingOrganization ? "Creating..." : "Create organization"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE SERVICE MODAL */}
            {showServiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24141A]/65 px-4 py-8 backdrop-blur-[6px]">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#4B1B27]/15 bg-[#FFFEFA] shadow-[0_25px_80px_rgba(53,21,31,0.3)]">
                        <div className="flex items-center justify-between border-b border-[#4B1B27]/10 bg-[#F4F1E8] px-5 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#4B1B27]/10 bg-[#4B1B27]/[0.07]">
                                    <Layers3 className="h-4 w-4 text-[#4B1B27]" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-semibold text-[#35151F]">
                                        Create service
                                    </h2>
                                    <p className="mt-0.5 text-[10px] text-[#8D8177]">
                                        Add a service to an organization.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowServiceModal(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8D8177] transition hover:bg-[#FF6B1A]/10 hover:text-[#4B1B27]"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 p-5">
                            <div>
                                <label className={labelClass}>
                                    Organization
                                </label>
                                <div className="flex h-10 items-center gap-2 rounded-lg border border-[#4B1B27]/15 bg-[#F4F1E8] px-3.5 text-[12px] font-medium text-[#766B64]">
                                    <Building2 className="h-3.5 w-3.5 text-[#FF6B1A]" />
                                    {organizations.find(
                                        (organization) =>
                                            String(organization.id) ===
                                            String(selectedOrganizationId)
                                    )?.name || "Unknown organization"}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Service name
                                </label>
                                <input
                                    type="text"
                                    value={serviceName}
                                    onChange={(e) => setServiceName(e.target.value)}
                                    placeholder="e.g. Payment Service"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Description
                                </label>
                                <textarea
                                    value={serviceDescription}
                                    onChange={(e) => setServiceDescription(e.target.value)}
                                    placeholder="Describe what this service handles"
                                    rows={4}
                                    className="w-full resize-none rounded-lg border border-[#4B1B27]/15 bg-[#F8F6F0] px-3.5 py-2.5 text-[12px] text-[#35151F] outline-none transition placeholder:text-[#A49A90] focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10"
                                />
                            </div>

                            {serviceError && (
                                <p className="flex items-center gap-2 text-[11px] font-medium text-[#B84B43]">
                                    <AlertCircle className="h-3 w-3" />
                                    {serviceError}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setShowServiceModal(false)}
                                    className={cancelButtonClass}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCreateService}
                                    disabled={creatingService}
                                    className={primaryButtonClass}
                                >
                                    {creatingService && (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    {creatingService ? "Creating..." : "Create service"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT ORGANIZATION MODAL */}
            {editingOrganization && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24141A]/65 px-4 py-8 backdrop-blur-[6px]">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#4B1B27]/15 bg-[#FFFEFA] shadow-[0_25px_80px_rgba(53,21,31,0.3)]">
                        <div className="flex items-center justify-between border-b border-[#4B1B27]/10 bg-[#F4F1E8] px-5 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#FF6B1A]/20 bg-[#FF6B1A]/10">
                                    <Pencil className="h-3.5 w-3.5 text-[#4B1B27]" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-semibold text-[#35151F]">
                                        Edit organization
                                    </h2>
                                    <p className="mt-0.5 text-[10px] text-[#8D8177]">
                                        Update organization details.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingOrganization(null);
                                    setOrganizationName("");
                                    setOrganizationError("");
                                }}
                                disabled={organizationLoading}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8D8177] transition hover:bg-[#FF6B1A]/10 hover:text-[#4B1B27] disabled:opacity-50"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="p-5">
                            <label className={labelClass}>
                                Organization name
                            </label>

                            <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => {
                                    setOrganizationName(e.target.value);
                                    setOrganizationError("");
                                }}
                                placeholder="Enter organization name"
                                className={inputClass}
                            />

                            {organizationError && (
                                <p className="mt-2.5 text-[11px] font-medium text-[#B84B43]">
                                    {organizationError}
                                </p>
                            )}

                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingOrganization(null);
                                        setOrganizationName("");
                                        setOrganizationError("");
                                    }}
                                    disabled={organizationLoading}
                                    className={cancelButtonClass}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={updateOrganization}
                                    disabled={organizationLoading}
                                    className={primaryButtonClass}
                                >
                                    {organizationLoading && (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    {organizationLoading ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT SERVICE MODAL */}
            {editingService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24141A]/65 px-4 py-8 backdrop-blur-[6px]">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#4B1B27]/15 bg-[#FFFEFA] shadow-[0_25px_80px_rgba(53,21,31,0.3)]">
                        <div className="flex items-center justify-between border-b border-[#4B1B27]/10 bg-[#F4F1E8] px-5 py-4">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#4B1B27]/10 bg-[#4B1B27]/[0.07]">
                                    <Layers3 className="h-3.5 w-3.5 text-[#4B1B27]" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-semibold text-[#35151F]">
                                        Edit service
                                    </h2>
                                    <p className="mt-0.5 text-[10px] text-[#8D8177]">
                                        Update service details.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingService(null);
                                    setServiceName("");
                                    setServiceDescription("");
                                    setEditingServiceOrganizationId("");
                                    setServiceError("");
                                }}
                                disabled={serviceLoading}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8D8177] transition hover:bg-[#FF6B1A]/10 hover:text-[#4B1B27] disabled:opacity-50"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 p-5">
                            <div>
                                <label className={labelClass}>
                                    Organization
                                </label>
                                <div className="flex h-10 items-center gap-2 rounded-lg border border-[#4B1B27]/15 bg-[#F4F1E8] px-3.5 text-[12px] font-medium text-[#766B64]">
                                    <Building2 className="h-3.5 w-3.5 text-[#FF6B1A]" />
                                    {organizations.find(
                                        (organization) =>
                                            String(organization.id) ===
                                            String(editingServiceOrganizationId)
                                    )?.name || "Unknown organization"}
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Service name
                                </label>
                                <input
                                    type="text"
                                    value={serviceName}
                                    onChange={(e) => {
                                        setServiceName(e.target.value);
                                        setServiceError("");
                                    }}
                                    placeholder="Enter service name"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Description
                                </label>
                                <textarea
                                    value={serviceDescription}
                                    onChange={(e) => {
                                        setServiceDescription(e.target.value);
                                        setServiceError("");
                                    }}
                                    placeholder="Describe what this service handles"
                                    rows={4}
                                    className="w-full resize-none rounded-lg border border-[#4B1B27]/15 bg-[#F8F6F0] px-3.5 py-2.5 text-[12px] text-[#35151F] outline-none transition placeholder:text-[#A49A90] focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10"
                                />
                            </div>

                            {serviceError && (
                                <p className="text-[11px] font-medium text-[#B84B43]">
                                    {serviceError}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingService(null);
                                        setServiceName("");
                                        setServiceDescription("");
                                        setEditingServiceOrganizationId("");
                                        setServiceError("");
                                    }}
                                    disabled={serviceLoading}
                                    className={cancelButtonClass}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={updateService}
                                    disabled={serviceLoading}
                                    className={primaryButtonClass}
                                >
                                    {serviceLoading && (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    )}
                                    {serviceLoading ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE ORGANIZATION MODAL */}
            {deletingOrganization && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24141A]/65 px-4 py-8 backdrop-blur-[6px]">
                    <div className="w-full max-w-md rounded-2xl border border-[#4B1B27]/15 bg-[#FFFEFA] p-5 shadow-[0_25px_80px_rgba(53,21,31,0.3)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#EACDC6] bg-[#FCEDEA]">
                            <Trash2 className="h-4 w-4 text-[#B84B43]" />
                        </div>

                        <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-[#35151F]">
                            Delete organization?
                        </h2>

                        <p className="mt-1.5 text-[12px] leading-5 text-[#766B64]">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-[#4B1B27]">
                                {deletingOrganization.name}
                            </span>
                            ?
                        </p>

                        <p className="mt-3 rounded-lg bg-[#FCEDEA] px-3 py-2 text-[10px] font-medium text-[#B84B43]">
                            This action cannot be undone.
                        </p>

                        {deleteOrganizationError && (
                            <p className="mt-2.5 text-[11px] font-medium text-[#B84B43]">
                                {deleteOrganizationError}
                            </p>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeletingOrganization(null);
                                    setDeleteOrganizationError("");
                                }}
                                disabled={deleteOrganizationLoading}
                                className={cancelButtonClass}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deleteOrganization}
                                disabled={deleteOrganizationLoading}
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#B84B43] px-3.5 text-[11px] font-semibold text-white transition hover:bg-[#963A35] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleteOrganizationLoading && (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                                {deleteOrganizationLoading ? "Deleting..." : "Delete organization"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE SERVICE MODAL */}
            {deletingService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#24141A]/65 px-4 py-8 backdrop-blur-[6px]">
                    <div className="w-full max-w-md rounded-2xl border border-[#4B1B27]/15 bg-[#FFFEFA] p-5 shadow-[0_25px_80px_rgba(53,21,31,0.3)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#EACDC6] bg-[#FCEDEA]">
                            <Trash2 className="h-4 w-4 text-[#B84B43]" />
                        </div>

                        <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-[#35151F]">
                            Delete service?
                        </h2>

                        <p className="mt-1.5 text-[12px] leading-5 text-[#766B64]">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-[#4B1B27]">
                                {deletingService.name}
                            </span>
                            ?
                        </p>

                        <p className="mt-3 rounded-lg bg-[#FCEDEA] px-3 py-2 text-[10px] font-medium text-[#B84B43]">
                            This action cannot be undone.
                        </p>

                        {deleteServiceError && (
                            <p className="mt-2.5 text-[11px] font-medium text-[#B84B43]">
                                {deleteServiceError}
                            </p>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeletingService(null);
                                    setDeleteServiceError("");
                                }}
                                disabled={deleteServiceLoading}
                                className={cancelButtonClass}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deleteService}
                                disabled={deleteServiceLoading}
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#B84B43] px-3.5 text-[11px] font-semibold text-white transition hover:bg-[#963A35] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleteServiceLoading && (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                                {deleteServiceLoading ? "Deleting..." : "Delete service"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}