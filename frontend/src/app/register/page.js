"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Check,
    CircleAlert,
    Eye,
    EyeOff,
    GitBranch,
    LockKeyhole,
    Mail,
    Radio,
    ShieldCheck,
    UserRound,
    Zap,
    Clock3,
    CheckCircle2,
    Plus,
    Building2,
    Users,
    Layers3,
    Command,
    Search,
} from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [organizationName, setOrganizationName] = useState("");
    const [invitationToken, setInvitationToken] = useState("");
    const [requestOrganizationId, setRequestOrganizationId] = useState("");
    const [organizationSearch, setOrganizationSearch] = useState("");
    const [organizations, setOrganizations] = useState([]);
    const [searchingOrganizations, setSearchingOrganizations] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [registrationMode, setRegistrationMode] = useState("create");
    const [requestSubmitted, setRequestSubmitted] = useState(false);

    const passwordChecks = [
        {
            label: "At least 8 characters",
            valid: password.length >= 8,
        },
        {
            label: "Contains a number",
            valid: /\d/.test(password),
        },
    ];

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");

        if (registrationMode === "request" && !requestOrganizationId) {
            setError("Please select an organization from the search results.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        organizationName: registrationMode === "create" ? organizationName : "",
                        invitationToken: registrationMode === "invite" ? invitationToken : "",
                        requestOrganizationId: registrationMode === "request"
                            ? requestOrganizationId
                            : "",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed.");
                return;
            }

            if (registrationMode === "request" && data.joinRequestPending) {
                setRequestSubmitted(true);
                return;
            }

            router.push("/login");

        } catch (error) {
            console.error("Registration error:", error);
            setError("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    const handleOrganizationSearch = async (value) => {
        setOrganizationSearch(value);
        setRequestOrganizationId("");

        if (!value.trim()) {
            setOrganizations([]);
            return;
        }

        setSearchingOrganizations(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/search?search=${encodeURIComponent(value)}`
            );

            const data = await response.json();

            if (response.ok) {
                setOrganizations(data.organizations || []);
            }
        } catch (error) {
            console.error("Organization search error:", error);
            setOrganizations([]);
        } finally {
            setSearchingOrganizations(false);
        }
    };

    // REQUEST SUBMITTED SCREEN
    if (requestSubmitted) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#E9E9DF] px-5 py-12 text-[#4B1B27]">

                <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#FF6B1A]/10 blur-[130px]" />
                <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#4B1B27]/10 blur-[140px]" />

                <div className="relative w-full max-w-[570px] overflow-hidden rounded-[28px] border border-[#4B1B27]/10 bg-[#F5F4EC] shadow-[0_30px_100px_rgba(75,27,39,0.14)]">

                    <div className="relative overflow-hidden bg-[#4B1B27] px-7 py-9 text-[#D7DDD2] sm:px-10 sm:py-11">

                        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
                        <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border border-white/[0.08]" />

                        <div className="relative">
                            <Link href="/" className="group inline-flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B1A] text-lg font-black text-white transition-transform group-hover:rotate-[-8deg]">
                                    I
                                </div>

                                <span className="text-xl font-bold tracking-[-0.06em]">
                                    Incident<span className="text-[#FF6B1A]">Flow</span>
                                </span>
                            </Link>

                            <div className="mt-10 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF9A64]">
                                <span className="h-2 w-2 rounded-full bg-[#FF6B1A]" />
                                Access request received
                            </div>

                            <h1 className="mt-4 max-w-md text-[36px] font-semibold leading-[1.05] tracking-[-0.055em] sm:text-[46px]">
                                You're one step
                                <span className="block text-[#FF6B1A]">closer to joining.</span>
                            </h1>

                            <p className="mt-4 max-w-sm text-[13px] leading-7 text-[#D7DDD2]/65">
                                Your request has reached the organization.
                                An administrator will review it before
                                workspace access is granted.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 sm:p-10">

                        <div className="flex items-start gap-4 rounded-2xl border border-[#FF6B1A]/20 bg-[#FF6B1A]/[0.06] p-5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B1A]/10 text-[#FF6B1A]">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF6B1A]">
                                    Request submitted
                                </p>
                                <p className="mt-1.5 text-base font-bold text-[#4B1B27]">
                                    Successfully sent for review
                                </p>
                                <p className="mt-1.5 text-xs leading-6 text-[#4B1B27]/60">
                                    Your organization join request has been submitted successfully.
                                </p>
                            </div>
                        </div>

                        <div className="my-6 rounded-2xl border border-[#4B1B27]/10 bg-white/60 p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4B1B27] text-[#D7DDD2]">
                                    <Building2 className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#4B1B27]/40">
                                        Requested organization
                                    </p>
                                    <p className="mt-1 truncate text-sm font-bold text-[#4B1B27]">
                                        {organizationSearch || "Selected organization"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex items-start gap-3 border-t border-[#4B1B27]/10 pt-5">
                                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#FF6B1A]" />
                                <div>
                                    <p className="text-sm font-bold text-[#4B1B27]">
                                        Waiting for administrator approval
                                    </p>
                                    <p className="mt-1.5 text-xs leading-6 text-[#4B1B27]/55">
                                        The organization admin will review your request.
                                        You can log in later to check your access status.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push("/login")}
                            className="group flex h-[54px] w-full items-center justify-center gap-3 rounded-xl bg-[#4B1B27] text-sm font-semibold text-[#D7DDD2] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#35151F] hover:shadow-[0_12px_30px_rgba(75,27,39,0.2)]"
                        >
                            Back to Login
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>

                        <p className="mt-5 text-center text-[10px] text-[#4B1B27]/40">
                            Your workspace access will be available after approval.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen overflow-x-hidden bg-[#E9E9DF] text-[#4B1B27] selection:bg-[#FF6B1A]/20">

            {/* NAVBAR — EXACT SAME AS LANDING PAGE */}
            <nav className="relative z-30 border-b border-white/10 bg-[#4B1B27] text-[#D7DDD2]">
                <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-12">

                    <Link href="/" className="group flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B1A] text-lg font-black text-white transition-transform duration-300 group-hover:rotate-[-8deg]">
                            I
                        </div>

                        <span className="text-xl font-bold tracking-[-0.06em]">
                            Incident<span className="text-[#FF6B1A]">Flow</span>
                        </span>
                    </Link>


                    <div className="flex items-center gap-5">
                        <Link
                            href="/login"
                            className="text-sm font-medium text-[#D7DDD2]/75 transition-colors hover:text-white"
                        >
                            Login
                        </Link>

                        <Link
                            href="/register"
                            className="group inline-flex items-center gap-3 rounded-lg bg-[#FF6B1A] px-5 py-3 text-sm font-semibold text-white shadow-[0_5px_20px_rgba(255,107,26,0.15)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#e85a0c] hover:shadow-[0_12px_30px_rgba(255,107,26,0.25)]"
                        >
                            Get Started
                            <span className="transition-transform duration-300 group-hover:translate-x-1">
                                ↗
                            </span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* BACKGROUND */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -right-48 top-32 h-[600px] w-[600px] rounded-full bg-[#FF6B1A]/[0.07] blur-[130px]" />
                <div className="absolute -left-52 bottom-0 h-[550px] w-[550px] rounded-full bg-[#4B1B27]/[0.06] blur-[140px]" />

                <div
                    className="absolute inset-0 opacity-[0.15]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(75,27,39,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(75,27,39,0.10) 1px, transparent 1px)",
                        backgroundSize: "64px 64px",
                        maskImage: "linear-gradient(to bottom, black, transparent 85%)",
                        WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
                    }}
                />
            </div>

            {/* MAIN CONTENT */}
            <section className="relative mx-auto grid min-h-[calc(100svh-81px)] max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-12 lg:py-12 xl:gap-20">

                {/* LEFT — BRAND EXPERIENCE */}
                <div className="relative mx-auto w-full max-w-[650px] lg:mx-0">

                    <div className="mb-7 flex items-center gap-3">
                        <div className="h-px w-9 bg-[#FF6B1A]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#4B1B27]/60">
                            A better way to respond
                        </span>
                    </div>

                    <h1 className="max-w-[620px] text-[43px] font-semibold leading-[1.02] tracking-[-0.065em] sm:text-[58px] lg:text-[64px] xl:text-[74px]">
                        Bring your
                        <br />
                        <span className="italic font-medium text-[#4B1B27]/45">
                            people together.
                        </span>
                        <br />
                        <span className="relative inline-block text-[#FF6B1A]">
                            Start stronger.
                            <span className="absolute -bottom-1 left-0 h-[3px] w-[72%] bg-[#FF6B1A]/40" />
                        </span>
                    </h1>

                    <p className="mt-7 max-w-[480px] text-[14px] leading-8 text-[#4B1B27]/65 sm:text-[15px]">
                        Create your workspace, join an existing organization,
                        and give your team one place to manage incidents
                        from first signal to final resolution.
                    </p>

                    {/* WORKSPACE PREVIEW */}
                    <div className="relative mt-10 max-w-[600px] overflow-hidden rounded-[22px] bg-[#4B1B27] text-[#D7DDD2] shadow-[0_24px_65px_rgba(75,27,39,0.18)] sm:mt-12">

                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B1A] text-white">
                                    <Layers3 className="h-[17px] w-[17px]" />
                                </div>

                                <div>
                                    <p className="text-[11px] font-bold tracking-wide">
                                        Your workspace
                                    </p>
                                    <p className="mt-0.5 text-[9px] text-[#D7DDD2]/45">
                                        Everything connected
                                    </p>
                                </div>
                            </div>

                            <span className="rounded-full border border-[#D7DDD2]/15 px-3 py-1.5 text-[9px] font-semibold tracking-wider text-[#D7DDD2]/65">
                                INCIDENTFLOW
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-2 sm:p-6">

                            <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                                <div className="flex items-center justify-between">
                                    <Building2 className="h-4 w-4 text-[#FF6B1A]" />
                                    <Plus className="h-3.5 w-3.5 text-[#D7DDD2]/35" />
                                </div>
                                <p className="mt-5 text-[13px] font-semibold">
                                    Your organization
                                </p>
                                <p className="mt-1 text-[10px] text-[#D7DDD2]/45">
                                    A central place for your team
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                                <div className="flex items-center justify-between">
                                    <Users className="h-4 w-4 text-[#FF6B1A]" />
                                    <ArrowUpRight className="h-3.5 w-3.5 text-[#D7DDD2]/35" />
                                </div>
                                <p className="mt-5 text-[13px] font-semibold">
                                    Your responders
                                </p>
                                <p className="mt-1 text-[10px] text-[#D7DDD2]/45">
                                    Work together in real time
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                                <div className="flex items-center justify-between">
                                    <Radio className="h-4 w-4 text-[#FF6B1A]" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A]" />
                                </div>
                                <p className="mt-5 text-[13px] font-semibold">
                                    Incident visibility
                                </p>
                                <p className="mt-1 text-[10px] text-[#D7DDD2]/45">
                                    Stay on top of every signal
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                                <div className="flex items-center justify-between">
                                    <GitBranch className="h-4 w-4 text-[#FF6B1A]" />
                                    <Check className="h-3.5 w-3.5 text-[#D7DDD2]/35" />
                                </div>
                                <p className="mt-5 text-[13px] font-semibold">
                                    Connected workflows
                                </p>
                                <p className="mt-1 text-[10px] text-[#D7DDD2]/45">
                                    From detection to resolution
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-[#FF6B1A]" />
                                <span className="text-[10px] text-[#D7DDD2]/60">
                                    Built around your team's response
                                </span>
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-[#FF6B1A]" />
                        </div>
                    </div>

                    {/* CAPABILITIES */}
                    <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#4B1B27]/15 pt-6 sm:gap-6">
                        <Capability icon={ShieldCheck} title="Controlled" subtitle="Role-based access" />
                        <Capability icon={GitBranch} title="Connected" subtitle="Unified workflows" />
                        <Capability icon={Clock3} title="Traceable" subtitle="Incident history" />
                    </div>
                </div>

                {/* RIGHT — REGISTRATION FORM */}
                <div className="relative mx-auto w-full max-w-[570px] lg:ml-auto">

                    <div className="absolute -inset-5 rounded-[35px] bg-[#FF6B1A]/[0.06] blur-2xl" />

                    <div className="relative overflow-hidden rounded-[25px] border border-[#4B1B27]/10 bg-[#F5F4EC] shadow-[0_28px_90px_rgba(75,27,39,0.12)] sm:rounded-[30px]">

                        <div className="h-[5px] bg-gradient-to-r from-[#4B1B27] via-[#FF6B1A] to-[#FF9A64]" />

                        <div className="p-5 sm:p-7 lg:p-8">

                            {/* FORM HEADER */}
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#4B1B27] text-[#D7DDD2]">
                                        <Command className="h-5 w-5" />
                                    </div>

                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                                        Start your journey
                                    </p>

                                    <h2 className="mt-2 text-[29px] font-semibold tracking-[-0.055em] text-[#4B1B27] sm:text-[34px]">
                                        Create your account.
                                    </h2>

                                    <p className="mt-1.5 text-[12px] leading-6 text-[#4B1B27]/55">
                                        Set up your profile and choose your workspace.
                                    </p>
                                </div>

                                <div className="hidden h-11 w-11 items-center justify-center rounded-full border border-[#4B1B27]/10 text-[#4B1B27]/30 sm:flex">
                                    <ArrowUpRight className="h-5 w-5" />
                                </div>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-3.5">

                                {/* ERROR */}
                                <div className="min-h-[42px]">
                                    {error && (
                                        <div
                                            role="alert"
                                            className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3"
                                        >
                                            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                            <p className="text-xs leading-5 text-red-700">
                                                {error}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* FULL NAME */}
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="mb-2 block text-[11px] font-bold text-[#4B1B27]"
                                    >
                                        Full name
                                    </label>

                                    <div className="group relative">
                                        <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B1B27]/35 transition-colors group-focus-within:text-[#FF6B1A]" />

                                        <input
                                            id="name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Enter your full name"
                                            required
                                            autoComplete="name"
                                            className="h-[43px] w-full rounded-xl border border-[#4B1B27]/15 bg-white/60 pl-11 pr-4 text-[12px] font-medium text-[#4B1B27] outline-none transition-all placeholder:font-normal placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/30 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/[0.08]"
                                        />
                                    </div>
                                </div>

                                {/* EMAIL */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-[11px] font-bold text-[#4B1B27]"
                                    >
                                        Work email
                                    </label>

                                    <div className="group relative">
                                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B1B27]/35 transition-colors group-focus-within:text-[#FF6B1A]" />

                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@company.com"
                                            required
                                            autoComplete="email"
                                            className="h-[43px] w-full rounded-xl border border-[#4B1B27]/15 bg-white/60 pl-11 pr-4 text-[12px] font-medium text-[#4B1B27] outline-none transition-all placeholder:font-normal placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/30 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/[0.08]"
                                        />
                                    </div>
                                </div>

                                {/* PASSWORD */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <label
                                            htmlFor="password"
                                            className="block text-[11px] font-bold text-[#4B1B27]"
                                        >
                                            Password
                                        </label>

                                        <span className="text-[9px] text-[#4B1B27]/45">
                                            At least 8 characters
                                        </span>
                                    </div>

                                    <div className="group relative">
                                        <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B1B27]/35 transition-colors group-focus-within:text-[#FF6B1A]" />

                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create a strong password"
                                            required
                                            autoComplete="new-password"
                                            className="h-[43px] w-full rounded-xl border border-[#4B1B27]/15 bg-white/60 pl-11 pr-12 text-[12px] font-medium text-[#4B1B27] outline-none transition-all placeholder:font-normal placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/30 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/[0.08]"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#4B1B27]/40 transition hover:bg-[#4B1B27]/[0.06] hover:text-[#FF6B1A]"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                                        {passwordChecks.map((check) => (
                                            <div
                                                key={check.label}
                                                className={`flex items-center gap-1.5 text-[9px] transition-colors ${check.valid
                                                    ? "text-emerald-700"
                                                    : "text-[#4B1B27]/40"
                                                    }`}
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                                {check.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* REGISTRATION METHOD */}
                                <div className="pt-1">
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-[#4B1B27]">
                                            Choose how to get started
                                        </label>

                                        <span className="text-[9px] font-semibold uppercase tracking-wider text-[#4B1B27]/35">
                                            Select one
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            {
                                                value: "create",
                                                label: "Create workspace",
                                                icon: Plus,
                                            },
                                            {
                                                value: "invite",
                                                label: "Use invitation",
                                                icon: Mail,
                                            },
                                            {
                                                value: "request",
                                                label: "Request access",
                                                icon: Building2,
                                            },
                                        ].map((option) => {
                                            const Icon = option.icon;
                                            const active = registrationMode === option.value;

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setRegistrationMode(option.value);
                                                        setInvitationToken("");
                                                        setOrganizationName("");
                                                        setOrganizationSearch("");
                                                        setRequestOrganizationId("");
                                                        setOrganizations([]);
                                                        setError("");
                                                    }}
                                                    className={`group relative flex min-h-[76px] flex-col items-start justify-between overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-200 sm:p-3 ${active
                                                        ? "border-[#4B1B27] bg-[#4B1B27] text-[#D7DDD2] shadow-[0_6px_16px_rgba(75,27,39,0.12)]"
                                                        : "border-[#4B1B27]/10 bg-white/50 text-[#4B1B27]/65 hover:border-[#4B1B27]/30 hover:bg-white"
                                                        }`}
                                                >
                                                    <div className="flex w-full items-center justify-between">
                                                        <Icon className={`h-4 w-4 ${active ? "text-[#FF6B1A]" : "text-[#4B1B27]/45"
                                                            }`} />

                                                        {active && (
                                                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B1A] text-white">
                                                                <Check className="h-2.5 w-2.5" />
                                                            </span>
                                                        )}
                                                    </div>

                                                    <span className="mt-3 text-[9px] font-bold leading-4 sm:text-[10px]">
                                                        {option.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* REGISTRATION DETAILS — FIXED HEIGHT */}
                                <div className="h-[135px] pt-1">

                                    {registrationMode === "create" && (
                                        <div>
                                            <label
                                                htmlFor="organizationName"
                                                className="mb-2 block text-[11px] font-bold text-[#4B1B27]"
                                            >
                                                Organization name
                                            </label>

                                            <div className="group relative">
                                                <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B1B27]/35" />

                                                <input
                                                    id="organizationName"
                                                    type="text"
                                                    value={organizationName}
                                                    onChange={(e) => setOrganizationName(e.target.value)}
                                                    placeholder="Enter your organization name"
                                                    required
                                                    className="h-[43px] w-full rounded-xl border border-[#4B1B27]/15 bg-white/60 pl-11 pr-4 text-[12px] text-[#4B1B27] outline-none transition-all placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/30 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/[0.08]"
                                                />
                                            </div>

                                            <p className="mt-2 text-[10px] leading-5 text-[#4B1B27]/45">
                                                This will become your new organization workspace.
                                            </p>
                                        </div>
                                    )}

                                    {registrationMode === "invite" && (
                                        <div>
                                            <label
                                                htmlFor="invitationToken"
                                                className="mb-2 block text-[11px] font-bold text-[#4B1B27]"
                                            >
                                                Invitation token
                                            </label>

                                            <div className="group relative">
                                                <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B1B27]/35" />

                                                <input
                                                    id="invitationToken"
                                                    type="text"
                                                    value={invitationToken}
                                                    required
                                                    onChange={(e) => setInvitationToken(e.target.value)}
                                                    placeholder="Enter your invitation token"
                                                    className="h-[43px] w-full rounded-xl border border-[#4B1B27]/15 bg-white/60 pl-11 pr-4 text-[12px] text-[#4B1B27] outline-none transition-all placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/30 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/[0.08]"
                                                />
                                            </div>

                                            <p className="mt-2 text-[10px] leading-5 text-[#4B1B27]/45">
                                                Use the invitation token shared by your organization.
                                            </p>
                                        </div>
                                    )}

                                    {registrationMode === "request" && (
                                        <div>
                                            <label
                                                htmlFor="organizationSearch"
                                                className="mb-2 block text-[11px] font-bold text-[#4B1B27]"
                                            >
                                                Find your organization
                                            </label>

                                            <div className="group relative">
                                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B1B27]/35" />

                                                <input
                                                    id="organizationSearch"
                                                    type="text"
                                                    value={organizationSearch}
                                                    onChange={(e) => handleOrganizationSearch(e.target.value)}
                                                    placeholder="Search organization name"
                                                    required
                                                    className="h-[43px] w-full rounded-xl border border-[#4B1B27]/15 bg-white/60 pl-11 pr-4 text-[12px] text-[#4B1B27] outline-none transition-all placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/30 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/[0.08]"
                                                />
                                            </div>

                                            <div className="relative">
                                                {(searchingOrganizations ||
                                                    (organizationSearch.trim() &&
                                                        organizations.length === 0 &&
                                                        !requestOrganizationId)) && (
                                                        <p className="mt-1.5 text-[10px] text-[#4B1B27]/50">
                                                            {searchingOrganizations
                                                                ? "Searching organizations..."
                                                                : "No organizations found."}
                                                        </p>
                                                    )}

                                                {organizations.length > 0 && !requestOrganizationId && (
                                                    <div className="absolute left-0 right-0 top-1 z-30 max-h-28 overflow-y-auto rounded-xl border border-[#4B1B27]/10 bg-[#F5F4EC] shadow-[0_15px_35px_rgba(75,27,39,0.16)]">
                                                        {organizations.map((organization) => (
                                                            <button
                                                                key={organization.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setRequestOrganizationId(String(organization.id));
                                                                    setOrganizationSearch(organization.name);
                                                                    setOrganizations([]);
                                                                }}
                                                                className="flex w-full items-center gap-3 border-b border-[#4B1B27]/[0.07] px-4 py-3 text-left text-[11px] font-medium text-[#4B1B27] transition last:border-b-0 hover:bg-[#D7DDD2]/50"
                                                            >
                                                                <Building2 className="h-4 w-4 shrink-0 text-[#FF6B1A]" />
                                                                <span className="truncate">
                                                                    {organization.name}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <p className="mt-1.5 text-[10px] leading-4 text-[#4B1B27]/45">
                                                Your organization admin will review your request.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* SUBMIT */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative flex h-[51px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#4B1B27] text-[12px] font-bold tracking-wide text-[#D7DDD2] shadow-[0_10px_25px_rgba(75,27,39,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#35151F] hover:shadow-[0_14px_30px_rgba(75,27,39,0.23)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="absolute inset-y-0 left-0 w-1 bg-[#FF6B1A] transition-all duration-300 group-hover:w-full group-hover:opacity-10" />

                                    <span className="relative">
                                        {loading ? "Creating your account..." : "Create your account"}
                                    </span>

                                    {loading ? (
                                        <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-[#D7DDD2]/30 border-t-[#D7DDD2]" />
                                    ) : (
                                        <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    )}
                                </button>

                                {/* SIGN IN */}
                                <div className="border-t border-[#4B1B27]/10 pt-4 text-center">
                                    <p className="text-[11px] text-[#4B1B27]/55">
                                        Already have an account?{" "}
                                        <Link
                                            href="/login"
                                            className="font-bold text-[#FF6B1A] transition-colors hover:text-[#4B1B27]"
                                        >
                                            Sign in
                                            <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
                                        </Link>
                                    </p>
                                </div>
                            </form>

                            {/* SECURITY */}
                            <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#4B1B27]/10 pt-4">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#4B1B27]/40" />
                                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4B1B27]/40">
                                    Secure workspace registration
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="relative mt-5 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-[#4B1B27]/35">
                        IncidentFlow · Built for the moments that matter
                    </p>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="relative border-t border-[#4B1B27]/10 bg-[#D7DDD2]/40">
                <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row lg:px-12">
                    <p className="text-[10px] font-medium text-[#4B1B27]/45">
                        © {new Date().getFullYear()} IncidentFlow. All rights reserved.
                    </p>

                    <p className="flex items-center gap-2 text-[10px] font-semibold text-[#4B1B27]/45">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A]" />
                        Every incident has a path to resolution.
                    </p>
                </div>
            </footer>
        </main>
    );
}

/* REUSABLE COMPONENT */

function Capability({ icon: Icon, title, subtitle }) {
    return (
        <div className="min-w-0">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-[#FF6B1A]" />
                <span className="text-[10px] font-bold text-[#4B1B27] sm:text-[11px]">
                    {title}
                </span>
            </div>

            <p className="mt-2 pl-6 text-[9px] text-[#4B1B27]/45 sm:text-[10px]">
                {subtitle}
            </p>
        </div>
    );
}
