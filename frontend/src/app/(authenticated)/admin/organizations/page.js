"use client";
import { useEffect, useState } from "react";
export default function OrganizationsPage() {
    const [organizations, setOrganizations] = useState([]);
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

    return (
        <main className="min-h-screen bg-slate-950 text-white p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        Organization Management
                    </h1>

                    <p className="text-slate-400 mt-2">
                        Manage organizations and their services.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setOrganizationName("");
                        setOrganizationError("");
                        setShowCreateModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                    Create Organization
                </button>
            </div>

            <div className="mt-8 space-y-4">
                {organizations.map((organization) => {
                    const organizationServices = services.filter(
                        (service) =>
                            String(service.organization_id) ===
                            String(organization.id)
                    );

                    return (
                        <div
                            key={organization.id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-white">
                                    {organization.name}
                                </h2>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openEditOrganization(organization)}
                                        className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDeletingOrganization(organization);
                                            setDeleteOrganizationError("");
                                        }}
                                        className="px-3 py-1.5 text-sm rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition"
                                    >
                                        Delete
                                    </button>
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
                                    setSelectedOrganizationId(String(organization.id));

                                    setShowServiceModal(true);
                                }}
                                className="mt-4 px-4 mb-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                            >
                                Create Service
                            </button>

                            <p className="text-sm text-slate-400 mt-1">
                                {organizationServices.length}{" "}
                                {organizationServices.length === 1
                                    ? "service"
                                    : "services"}
                            </p>

                            <div className="mt-4 space-y-2">
                                {organizationServices.length > 0 ? (
                                    organizationServices.map((service) => (
                                        <div
                                            key={service.id}
                                            className="bg-slate-800/60 rounded-lg px-4 py-3"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-white font-medium">
                                                        {service.name}
                                                    </p>

                                                    <p className="text-sm text-slate-400 mt-1">
                                                        {service.description || "No description"}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowServiceModal(false);
                                                            openEditService(service);
                                                        }}
                                                        className="px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeletingService(service);
                                                            setDeleteServiceError("");
                                                        }}
                                                        className="px-3 py-1.5 text-sm rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        No services available
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">

                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                                Create Organization
                            </h2>

                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="text-slate-400 hover:text-white text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mt-2">
                            Create a new organization for your IncidentFlow workspace.
                        </p>

                        <div className="mt-6">
                            <label className="block text-sm text-slate-300 mb-2">
                                Organization Name
                            </label>

                            <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => setOrganizationName(e.target.value)}
                                placeholder="Enter organization name"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        {organizationError && (
                            <p className="text-sm text-red-400 mt-3">
                                {organizationError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleCreateOrganization}
                                disabled={creatingOrganization}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
                            >
                                {creatingOrganization ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showServiceModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">

                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                                Create Service
                            </h2>

                            <button
                                type="button"
                                onClick={() => setShowServiceModal(false)}
                                className="text-slate-400 hover:text-white text-xl"
                            >
                                ×
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mt-2">
                            Add a service to this organization.
                        </p>

                        <div className="mt-6">
                            <label className="block text-sm text-slate-300 mb-2">
                                Organization
                            </label>

                            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-300">
                                {organizations.find(
                                    (organization) =>
                                        String(organization.id) ===
                                        String(selectedOrganizationId)
                                )?.name || "Unknown organization"}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm text-slate-300 mb-2">
                                Service Name
                            </label>

                            <input
                                type="text"
                                value={serviceName}
                                onChange={(e) => setServiceName(e.target.value)}
                                placeholder="e.g. Payment Service"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm text-slate-300 mb-2">
                                Description
                            </label>

                            <textarea
                                value={serviceDescription}
                                onChange={(e) =>
                                    setServiceDescription(e.target.value)
                                }
                                placeholder="Describe what this service handles"
                                rows={4}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
                            />
                        </div>

                        {serviceError && (
                            <p className="text-sm text-red-400 mt-3">
                                {serviceError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowServiceModal(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleCreateService}
                                disabled={creatingService}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
                            >
                                {creatingService ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {editingOrganization && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">

                        <div className="mb-5">
                            <h2 className="text-xl font-semibold text-white">
                                Edit Organization
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Update the organization name.
                            </p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                Organization Name
                            </label>

                            <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => {
                                    setOrganizationName(e.target.value);
                                    setOrganizationError("");
                                }}
                                placeholder="Enter organization name"
                                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                            />

                            {organizationError && (
                                <p className="mt-3 text-sm text-red-400">
                                    {organizationError}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingOrganization(null);
                                    setOrganizationName("");
                                    setOrganizationError("");
                                }}
                                disabled={organizationLoading}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={updateOrganization}
                                disabled={organizationLoading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
                            >
                                {organizationLoading
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
            {editingService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">

                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                                Edit Service
                            </h2>

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
                                className="text-slate-400 hover:text-white text-xl disabled:opacity-50"
                            >
                                ×
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mt-2">
                            Update the service details.
                        </p>

                        <div className="mt-6">
                            <label className="block text-sm text-slate-300 mb-2">
                                Organization
                            </label>

                            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-300">
                                {organizations.find(
                                    (organization) =>
                                        String(organization.id) ===
                                        String(editingServiceOrganizationId)
                                )?.name || "Unknown organization"}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm text-slate-300 mb-2">
                                Service Name
                            </label>

                            <input
                                type="text"
                                value={serviceName}
                                onChange={(e) => {
                                    setServiceName(e.target.value);
                                    setServiceError("");
                                }}
                                placeholder="Enter service name"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm text-slate-300 mb-2">
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
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
                            />
                        </div>

                        {serviceError && (
                            <p className="text-sm text-red-400 mt-3">
                                {serviceError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
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
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={updateService}
                                disabled={serviceLoading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
                            >
                                {serviceLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
            {deletingOrganization && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">

                        <h2 className="text-xl font-semibold text-white">
                            Delete Organization
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Are you sure you want to delete{" "}
                            <span className="text-white font-medium">
                                {deletingOrganization.name}
                            </span>
                            ?
                        </p>

                        <p className="mt-3 text-sm text-red-400">
                            This action cannot be undone.
                        </p>

                        {deleteOrganizationError && (
                            <p className="mt-3 text-sm text-red-400">
                                {deleteOrganizationError}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeletingOrganization(null);
                                    setDeleteOrganizationError("");
                                }}
                                disabled={deleteOrganizationLoading}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deleteOrganization}
                                disabled={deleteOrganizationLoading}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
                            >
                                {deleteOrganizationLoading
                                    ? "Deleting..."
                                    : "Delete Organization"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
            {deletingService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">

                        <h2 className="text-xl font-semibold text-white">
                            Delete Service
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Are you sure you want to delete{" "}
                            <span className="text-white font-medium">
                                {deletingService.name}
                            </span>
                            ?
                        </p>

                        <p className="mt-3 text-sm text-red-400">
                            This action cannot be undone.
                        </p>

                        {deleteServiceError && (
                            <p className="mt-3 text-sm text-red-400">
                                {deleteServiceError}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeletingService(null);
                                    setDeleteServiceError("");
                                }}
                                disabled={deleteServiceLoading}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deleteService}
                                disabled={deleteServiceLoading}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 transition"
                            >
                                {deleteServiceLoading
                                    ? "Deleting..."
                                    : "Delete Service"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </main>

    );
}