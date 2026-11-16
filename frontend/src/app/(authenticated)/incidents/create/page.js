"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Activity,
    AlertCircle,
    Building2,
    CheckCircle2,
    ChevronDown,
    FileText,
    Layers3,
    Plus,
    Server,
    ShieldAlert,
    Zap,
} from "lucide-react";

export default function CreateIncident() {

    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [severity, setSeverity] = useState("SEV-3");
    const [environment, setEnvironment] = useState("production");
    const [organizationId, setOrganizationId] = useState("");
    const [serviceId, setServiceId] = useState("");
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
                    `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`
                        }
                    }
                );

                const data = await response.json();

                const organizationList = data.organizations || data.data || [];

                setOrganizations(organizationList);

                if (organizationList.length > 0) {
                    setOrganizationId(String(organizationList[0].id));
                }

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

    const filteredServices = services.filter(
        (service) =>
            String(service.organization_id) === String(organizationId)
    );

    const severityOptions = [
        { value: "SEV-1", label: "Critical", description: "Major service outage", color: "#B83232" },
        { value: "SEV-2", label: "High", description: "Significant impact", color: "#D45B27" },
        { value: "SEV-3", label: "Medium", description: "Partial degradation", color: "#A77B24" },
        { value: "SEV-4", label: "Low", description: "Minor issue", color: "#39785C" },
    ];
    const storedUser =
        typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("user") || "{}")
            : {};

    const isPlatformAdmin = storedUser.role === "platform_admin";


    return (
        <main className="min-h-screen bg-[#E9E9DF] text-[#35151F]">

            {/* Decorative background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-[550px] w-[550px] rounded-full bg-[#FF6B1A]/[0.06] blur-[100px]" />
                <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-[#4B1B27]/[0.05] blur-[100px]" />
            </div>

            <div className="relative mx-auto max-w-[1150px] px-5 py-8 sm:px-8 lg:py-12">

                {/* Back navigation */}
                <button
                    type="button"
                    onClick={() => router.push("/incidents")}
                    className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#4B1B27]/60 transition hover:text-[#FF6B1A]"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4B1B27]/10 bg-white/60 transition group-hover:border-[#FF6B1A]/40 group-hover:bg-[#FF6B1A]/10">
                        <ArrowLeft size={16} />
                    </span>
                    Back to incidents
                </button>

                {/* Hero */}
                <section className="relative mb-8 overflow-hidden rounded-[28px] bg-[#4B1B27] p-7 text-white shadow-[0_20px_60px_rgba(75,27,39,0.16)] sm:p-10 lg:p-12">

                    <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border border-white/[0.07]" />
                    <div className="pointer-events-none absolute -right-4 -top-12 h-64 w-64 rounded-full border border-white/[0.07]" />
                    <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-[#FF6B1A]/10 blur-[80px]" />

                    <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">

                        <div className="max-w-2xl">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#FF6B1A]/30 bg-[#FF6B1A]/10 px-3 py-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF9A62]">
                                    Incident management
                                </span>
                            </div>

                            <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl lg:text-[58px]">
                                Create an
                                <span className="block text-[#FF8A48]">incident.</span>
                            </h1>

                            <p className="mt-5 max-w-lg text-sm leading-7 text-white/60 sm:text-base">
                                Report an issue, identify its impact, and bring your team together to resolve it.
                            </p>
                        </div>

                        <div className="hidden shrink-0 md:block">
                            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.06]">
                                <ShieldAlert size={43} strokeWidth={1.2} className="text-[#FF8A48]" />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-2 text-xs text-white/55">
                            <CheckCircle2 size={14} className="text-[#FF8A48]" />
                            Structured incident reporting
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/55">
                            <Activity size={14} className="text-[#FF8A48]" />
                            Severity classification
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/55">
                            <Layers3 size={14} className="text-[#FF8A48]" />
                            Organization-aware
                        </div>
                    </div>
                </section>

                {/* Main content */}
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_320px]">

                    {/* Form */}
                    <section className="rounded-[26px] border border-[#4B1B27]/10 bg-[#FFFEFA] p-6 shadow-[0_12px_40px_rgba(75,27,39,0.05)] sm:p-9">

                        <div className="mb-8 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                                    Incident details
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#4B1B27]">
                                    What happened?
                                </h2>
                                <p className="mt-2 text-sm text-[#4B1B27]/50">
                                    Provide the information your team needs to investigate.
                                </p>
                            </div>

                            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E9E9DF] text-[#4B1B27] sm:flex">
                                <FileText size={20} />
                            </div>
                        </div>

                        {/* Title */}
                        <div className="mb-7">
                            <label className="mb-2.5 flex items-center justify-between text-xs font-bold text-[#4B1B27]">
                                <span>Incident title <span className="text-[#FF6B1A]">*</span></span>
                                <span className="font-medium text-[#4B1B27]/35">{title.length}/200</span>
                            </label>

                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={200}
                                placeholder="Example: Payment service is down"
                                className="w-full rounded-xl border border-[#4B1B27]/15 bg-[#F5F3EA] px-4 py-3.5 text-sm text-[#35151F] outline-none transition placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/25 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/10"
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-8">
                            <label className="mb-2.5 flex items-center justify-between text-xs font-bold text-[#4B1B27]">
                                <span>Description <span className="text-[#FF6B1A]">*</span></span>
                                <span className="font-medium text-[#4B1B27]/35">{description.length}/1000</span>
                            </label>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={1000}
                                placeholder="Describe what is happening, when it started, and how it affects your users..."
                                rows={5}
                                className="w-full resize-y rounded-xl border border-[#4B1B27]/15 bg-[#F5F3EA] px-4 py-3.5 text-sm leading-7 text-[#35151F] outline-none transition placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/25 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/10"
                            />
                        </div>

                        {/* Severity */}
                        <div className="mb-8">
                            <div className="mb-3">
                                <label className="text-xs font-bold text-[#4B1B27]">
                                    Severity level <span className="text-[#FF6B1A]">*</span>
                                </label>
                                <p className="mt-1 text-xs text-[#4B1B27]/45">
                                    How seriously is this incident affecting your service?
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {severityOptions.map((option) => {
                                    const selected = severity === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setSeverity(option.value)}
                                            className={`relative rounded-xl border p-3 text-left transition-all ${selected
                                                ? "border-[#4B1B27] bg-[#4B1B27] text-white shadow-[0_6px_18px_rgba(75,27,39,0.15)]"
                                                : "border-[#4B1B27]/10 bg-[#F5F3EA] text-[#4B1B27] hover:border-[#4B1B27]/30 hover:bg-white"
                                                }`}
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <span
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{ backgroundColor: option.color }}
                                                />
                                                {selected && (
                                                    <CheckCircle2 size={15} className="text-[#FF8A48]" />
                                                )}
                                            </div>

                                            <p className="text-sm font-bold">{option.value}</p>
                                            <p className={`mt-1 text-xs font-semibold ${selected ? "text-white/90" : "text-[#4B1B27]"}`}>
                                                {option.label}
                                            </p>
                                            <p className={`mt-1 text-[10px] leading-4 ${selected ? "text-white/50" : "text-[#4B1B27]/40"}`}>
                                                {option.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Environment */}
                        <div className="mb-8">
                            <label className="mb-2.5 block text-xs font-bold text-[#4B1B27]">
                                Environment
                            </label>

                            <div className="relative">
                                <select
                                    value={environment}
                                    onChange={(e) => setEnvironment(e.target.value)}
                                    className="w-full appearance-none rounded-xl border border-[#4B1B27]/15 bg-[#F5F3EA] px-4 py-3.5 pr-11 text-sm font-medium capitalize text-[#35151F] outline-none transition hover:border-[#4B1B27]/25 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/10"
                                >
                                    <option value="production">Production</option>
                                    <option value="staging">Staging</option>
                                    <option value="development">Development</option>
                                </select>
                                <ChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4B1B27]/50" />
                            </div>
                        </div>

                        {/* Organization */}
                        {isPlatformAdmin && (
                            <div className="mb-7">
                                <label className="mb-2.5 flex items-center gap-2 text-xs font-bold text-[#4B1B27]">
                                    <Building2 size={14} className="text-[#FF6B1A]" />
                                    Organization
                                </label>

                                <div className="relative">
                                    <select
                                        value={organizationId}
                                        onChange={(e) => setOrganizationId(e.target.value)}
                                        className="w-full appearance-none rounded-xl border border-[#4B1B27]/15 bg-[#F5F3EA] px-4 py-3.5 pr-11 text-sm font-medium text-[#35151F] outline-none transition hover:border-[#4B1B27]/25 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/10"
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

                                    <ChevronDown
                                        size={17}
                                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4B1B27]/50"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Service */}
                        <div className="mb-8">
                            <label className="mb-2.5 flex items-center gap-2 text-xs font-bold text-[#4B1B27]">
                                <Server size={14} className="text-[#FF6B1A]" />
                                Affected service
                            </label>

                            <div className="relative">
                                <select
                                    value={serviceId}
                                    onChange={(e) => setServiceId(e.target.value)}
                                    className="w-full appearance-none rounded-xl border border-[#4B1B27]/15 bg-[#F5F3EA] px-4 py-3.5 pr-11 text-sm font-medium text-[#35151F] outline-none transition hover:border-[#4B1B27]/25 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/10"
                                >
                                    {filteredServices.length === 0 ? (
                                        <option value="">
                                            No services available
                                        </option>
                                    ) : (
                                        filteredServices.map((service) => (
                                            <option
                                                key={service.id}
                                                value={service.id}
                                            >
                                                {service.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <ChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#4B1B27]/50" />
                            </div>

                            <p className="mt-2 text-[11px] text-[#4B1B27]/40">
                                Select the service experiencing the issue.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-50 px-4 py-3.5">
                                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                                <p className="text-sm font-medium text-red-700">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col-reverse gap-3 border-t border-[#4B1B27]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="button"
                                onClick={() => router.push("/incidents")}
                                disabled={creating}
                                className="rounded-xl border border-[#4B1B27]/15 bg-white px-6 py-3.5 text-sm font-semibold text-[#4B1B27] transition hover:border-[#4B1B27]/30 hover:bg-[#F5F3EA] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleCreateIncident}
                                disabled={creating}
                                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#FF6B1A] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(255,107,26,0.22)] transition hover:-translate-y-0.5 hover:bg-[#e95b10] hover:shadow-[0_12px_28px_rgba(255,107,26,0.3)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {creating ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Creating incident...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={17} />
                                        Create incident
                                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </section>

                    {/* Right information panel */}
                    <aside className="space-y-5">

                        {/* Guidance card */}
                        <div className="overflow-hidden rounded-[24px] bg-[#4B1B27] p-6 text-white shadow-[0_12px_35px_rgba(75,27,39,0.12)]">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF6B1A]/15 text-[#FF8A48]">
                                <Zap size={21} />
                            </div>

                            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF8A48]">
                                Before submitting
                            </p>

                            <h3 className="mt-2 text-xl font-semibold tracking-tight">
                                Make every detail count.
                            </h3>

                            <p className="mt-3 text-sm leading-6 text-white/55">
                                A clear incident report helps your team understand the impact and start investigating faster.
                            </p>

                            <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
                                <div className="flex gap-3">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#FF8A48]" />
                                    <p className="text-xs leading-5 text-white/65">
                                        Use a descriptive title that explains the issue.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#FF8A48]" />
                                    <p className="text-xs leading-5 text-white/65">
                                        Include relevant symptoms and user impact.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#FF8A48]" />
                                    <p className="text-xs leading-5 text-white/65">
                                        Choose the correct severity and affected service.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Severity reference */}
                        <div className="rounded-[24px] border border-[#4B1B27]/10 bg-[#FFFEFA] p-6">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9E9DF] text-[#4B1B27]">
                                    <ShieldAlert size={17} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-[#4B1B27]">
                                        Severity guide
                                    </h3>
                                    <p className="text-[10px] text-[#4B1B27]/40">
                                        Classification reference
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                {severityOptions.map((option) => (
                                    <div key={option.value} className="flex items-center gap-3">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: option.color }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-[#4B1B27]">
                                                    {option.value}
                                                </p>
                                                <p className="text-[10px] font-medium text-[#4B1B27]/45">
                                                    {option.label}
                                                </p>
                                            </div>
                                            <p className="mt-0.5 text-[10px] text-[#4B1B27]/40">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status note */}
                        <div className="rounded-[20px] border border-[#39785C]/15 bg-[#D7DDD2]/70 p-5">
                            <div className="flex items-center gap-2 text-[#39785C]">
                                <Activity size={16} />
                                <p className="text-xs font-bold">Incident workflow</p>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-[#4B1B27]/65">
                                Once created, your incident will be available in the incident workspace for investigation and status updates.
                            </p>
                        </div>

                    </aside>
                </div>

                {/* Footer */}
                <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-[#4B1B27]/10 py-5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#4B1B27]/35 sm:flex-row">
                    <span>IncidentFlow · Incident management</span>
                    <span>Stay informed. Resolve faster.</span>
                </div>
            </div>
        </main>
    );
}
