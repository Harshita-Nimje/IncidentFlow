"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateIncident() {

    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState("SEV-3");
    const [environment, setEnvironment] = useState("production");
    const [organizationId, setOrganizationId] = useState("1");
    const [serviceId, setServiceId] = useState("1");
    const [organizations, setOrganizations] = useState([]);
    const [services, setServices] = useState([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const selectedServices = services.filter(
            (service) =>
                String(service.organization_id) === String(organizationId)
        );

        if (selectedServices.length > 0) {
            setServiceId(String(selectedServices[0].id));
        } else {
            setServiceId("");
        }
    }, [organizationId, services]);
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const response = await fetch(
                    // "http://localhost:5000/api/organizations",
                    `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();


                setOrganizations(data.organizations || data.data || []);

            } catch (error) {
                console.error("Error fetching organizations:", error);
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


                setServices(data.services || data.data || []);

            } catch (error) {
                console.error("Error fetching services:", error);
            }
        };

        fetchOrganizations();
        fetchServices();
    }, []);

    const handleCreateIncident = async () => {
        if (!title.trim() || !description.trim()) {
            setError("Please enter a title and description.");
            return;
        }

        if (!serviceId) {
            setError("Please select a service.");
            return;
        }
        setError("");
        try {
            setCreating(true);
            const response = await fetch(
                // "http://localhost:5000/api/incidents",
                `${process.env.NEXT_PUBLIC_API_URL}/api/incidents`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        severity,
                        environment,
                        organization_id: organizationId,
                        service_id: serviceId
                    })
                }
            );

            const data = await response.json();


            if (response.ok) {
                router.push(`/incidents/${data.incident.id}`);
            } else {
                setError(data.message || "Failed to create incident.");
            }

        } catch (error) {
            console.error("Error creating incident:", error);
            setError("Failed to create incident. Please try again.");
        } finally {
            setCreating(false);
        }
    };
    return (
        <main className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-3xl mx-auto">
                <button
                    type="button"
                    onClick={() => router.push("/incidents")}
                    className="text-slate-400 hover:text-white transition"
                >
                    ← Back
                </button>
                <h1 className="text-3xl font-bold mt-6">
                    Create Incident
                </h1>

                <p className="text-slate-400 mt-2">
                    Report a new production incident.
                </p>
                <div className="mt-6">
                    <label className="block text-sm text-slate-400 mb-2">
                        Incident Title
                    </label>

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={200}
                        placeholder="Example: Payment service is down"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                    <p className="text-right text-xs text-slate-500 mt-1">
                        {title.length}/200
                    </p>
                </div>
                <div className="mt-6">
                    <label className="block text-sm text-slate-400 mb-2">
                        Description
                    </label>

                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={1000}
                        placeholder="Describe what is happening..."
                        rows={5}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                    <p className="text-right text-xs text-slate-500 mt-1">
                        {description.length}/1000
                    </p>
                </div>
                <div className="mt-6">
                    <label className="block text-sm text-slate-400 mb-2">
                        Severity
                    </label>

                    <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    >
                        <option value="SEV-1">SEV-1 - Critical</option>
                        <option value="SEV-2">SEV-2 - High</option>
                        <option value="SEV-3">SEV-3 - Medium</option>
                        <option value="SEV-4">SEV-4 - Low</option>
                    </select>
                </div>
                <div className="mt-6">
                    <label className="block text-sm text-slate-400 mb-2">
                        Environment
                    </label>

                    <select
                        value={environment}
                        onChange={(e) => setEnvironment(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    >
                        <option value="production">Production</option>
                        <option value="staging">Staging</option>
                        <option value="development">Development</option>
                    </select>
                </div>
                <div className="mt-6">
                    <label className="block text-sm text-slate-400 mb-2">
                        Organization
                    </label>

                    <select
                        value={organizationId}
                        onChange={(e) => setOrganizationId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    >
                        {organizations.map((organization) => (
                            <option
                                key={organization.id}
                                value={organization.id}
                            >
                                {organization.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mt-6">
                    <label className="block text-sm text-slate-400 mb-2">
                        Service
                    </label>

                    <select
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500"
                    >
                        {services.filter(
                            (service) =>
                                String(service.organization_id) === String(organizationId)
                        ).length === 0 ? (
                            <option value="">
                                No services available
                            </option>
                        ) : (
                            services
                                .filter(
                                    (service) =>
                                        String(service.organization_id) === String(organizationId)
                                )
                                .map((service) => (
                                    <option
                                        key={service.id}
                                        value={service.id}
                                    >
                                        {service.name}
                                    </option>
                                ))
                        )}
                    </select>
                </div>
                <div className="mt-8">
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                            <p className="text-red-400">
                                {error}
                            </p>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleCreateIncident}
                        disabled={creating}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating ? "Creating..." : "Create Incident"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        disabled={creating}
                        className="ml-3 px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </main>
    );
}