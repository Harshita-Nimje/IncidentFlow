
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Eye,
    EyeOff,
    Mail,
    LockKeyhole,
    ShieldCheck,
    Zap,
    CircleAlert,
    Radio,
    Check,
    Clock3,
    Layers3,
    Users,
    Building2,
    GitBranch,
    Command,
    ArrowUpRight as ExternalArrow,
} from "lucide-react";
import socket from "../socket";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [pendingJoinRequest, setPendingJoinRequest] = useState(null);

    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Invalid email or password.");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Check whether the user has a pending organization request.
            if (data.user.role !== "platform_admin") {
                const organizationResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
                    {
                        headers: {
                            Authorization: `Bearer ${data.token}`,
                        },
                    }
                );

                const organizationData = await organizationResponse.json();

                if (!organizationResponse.ok) {
                    throw new Error(
                        organizationData.message || "Unable to check organization status."
                    );
                }

                const pendingRequests = organizationData.pendingJoinRequests || [];

                if (pendingRequests.length > 0) {
                    setPendingJoinRequest(pendingRequests[0]);
                    return;
                }
            }

            socket.auth = {
                token: data.token
            };

            socket.connect();

            if (data.user.role === "platform_admin") {
                router.push("/platform-admin/dashboard");
            } else {
                router.push("/dashboard");
            }

        } catch (error) {
            console.error("Login error:", error);
            setError(error.message || "Unable to connect to the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // PENDING ORGANIZATION APPROVAL
    if (pendingJoinRequest) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#E9E9DF] px-5 py-12 text-[#4B1B27]">

                <div className="pointer-events-none absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-[#FF6B1A]/10 blur-[120px]" />
                <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#4B1B27]/10 blur-[130px]" />

                <div className="relative w-full max-w-[560px] overflow-hidden rounded-[28px] border border-[#4B1B27]/10 bg-[#F5F4EC] shadow-[0_30px_100px_rgba(75,27,39,0.12)]">

                    <div className="relative overflow-hidden bg-[#4B1B27] px-7 py-9 text-[#D7DDD2] sm:px-10 sm:py-11">

                        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
                        <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full border border-white/[0.08]" />

                        <div className="relative">
                            <Link href="/" className="inline-flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B1A] text-lg font-black text-white">
                                    I
                                </div>
                                <span className="text-lg font-bold tracking-[-0.06em]">
                                    Incident<span className="text-[#FF6B1A]">Flow</span>
                                </span>
                            </Link>

                            <div className="mt-10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF9A64]">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6B1A]" />
                                Access request status
                            </div>

                            <h1 className="mt-4 max-w-md text-[34px] font-semibold leading-[1.08] tracking-[-0.05em] sm:text-[42px]">
                                Almost there.
                                <span className="block text-[#FF6B1A]">Just one more step.</span>
                            </h1>

                            <p className="mt-4 max-w-sm text-[13px] leading-7 text-[#D7DDD2]/65">
                                Your account is registered. Your workspace administrator
                                just needs to approve your access request.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 sm:p-10">

                        <div className="flex items-start gap-4 rounded-2xl border border-[#FF6B1A]/20 bg-[#FF6B1A]/[0.06] p-5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6B1A]/10 text-[#FF6B1A]">
                                <Clock3 className="h-6 w-6" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF6B1A]">
                                    Approval pending
                                </p>
                                <p className="mt-1.5 text-base font-bold text-[#4B1B27]">
                                    Awaiting administrator review
                                </p>
                                <p className="mt-1.5 text-xs leading-6 text-[#4B1B27]/60">
                                    Your request has been submitted successfully.
                                    Workspace access will be available once approved.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-[#4B1B27]/10 bg-white/60 p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4B1B27] text-[#D7DDD2]">
                                    <Building2 className="h-5 w-5" />
                                </div>

                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#4B1B27]/40">
                                        Requested organization
                                    </p>
                                    <p className="mt-1 truncate text-sm font-bold text-[#4B1B27]">
                                        {pendingJoinRequest.organization_name ||
                                            pendingJoinRequest.name ||
                                            "Your organization"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center gap-3 border-t border-[#4B1B27]/10 pt-5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D7DDD2] text-[#4B1B27]">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <p className="text-[11px] text-[#4B1B27]/60">
                                    Your account has been registered successfully.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                localStorage.removeItem("token");
                                localStorage.removeItem("user");
                                socket.disconnect();
                                router.push("/login");
                            }}
                            className="group mt-7 flex h-[54px] w-full items-center justify-center gap-3 rounded-xl bg-[#4B1B27] text-sm font-semibold text-[#D7DDD2] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#35151F] hover:shadow-[0_12px_30px_rgba(75,27,39,0.2)]"
                        >
                            Back to Login
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
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

            {/* PAGE BACKGROUND */}
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

            {/* MAIN LOGIN LAYOUT */}
            <section className="relative mx-auto grid min-h-[calc(100svh-81px)] max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:px-12 lg:py-14 xl:gap-24">

                {/* LEFT — BRAND EXPERIENCE */}
                <div className="relative mx-auto w-full max-w-[700px] lg:mx-0">

                    <div className="mb-7 flex items-center gap-3">
                        <div className="h-px w-9 bg-[#FF6B1A]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#4B1B27]/60">
                            Incident management, reimagined
                        </span>
                    </div>

                    <h1 className="max-w-[680px] text-[43px] font-semibold leading-[1.02] tracking-[-0.065em] sm:text-[58px] lg:text-[64px] xl:text-[76px]">
                        When things
                        <br />
                        <span className="italic font-medium text-[#4B1B27]/45">
                            go wrong,
                        </span>
                        <br />
                        <span className="relative inline-block text-[#FF6B1A]">
                            move forward.
                            <span className="absolute -bottom-1 left-0 h-[3px] w-[72%] bg-[#FF6B1A]/40" />
                        </span>
                    </h1>

                    <p className="mt-7 max-w-[490px] text-[14px] leading-8 text-[#4B1B27]/65 sm:text-[15px]">
                        Incidents don't wait. Your team shouldn't have to.
                        Bring visibility, coordination and resolution together
                        in one place built for the moments that matter.
                    </p>

                    {/* OPERATIONAL CONSOLE */}
                    <div className="relative mt-10 max-w-[630px] overflow-hidden rounded-[22px] bg-[#4B1B27] text-[#D7DDD2] shadow-[0_24px_65px_rgba(75,27,39,0.18)] sm:mt-12">

                        {/* Console top */}
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B1A] text-white">
                                    <Activity className="h-[17px] w-[17px]" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold tracking-wide">
                                        Incident operations
                                    </p>
                                    <p className="mt-0.5 text-[9px] text-[#D7DDD2]/45">
                                        Response overview
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-full border border-[#D7DDD2]/15 px-3 py-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute h-full w-full animate-ping rounded-full bg-[#FF6B1A] opacity-50" />
                                    <span className="relative h-2 w-2 rounded-full bg-[#FF6B1A]" />
                                </span>
                                <span className="text-[9px] font-semibold tracking-wide text-[#D7DDD2]/75">
                                    LIVE WORKFLOW
                                </span>
                            </div>
                        </div>

                        {/* Incident sample */}
                        <div className="p-5 sm:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/40">
                                        Response lifecycle
                                    </p>
                                    <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                                        From alert to resolution.
                                    </h3>
                                </div>
                                <span className="rounded-lg bg-[#FF6B1A]/15 px-3 py-2 text-[9px] font-bold tracking-wider text-[#FF9A64]">
                                    SEV RESPONSE
                                </span>
                            </div>

                            <div className="relative mt-8 grid grid-cols-3 gap-2">
                                <div className="absolute left-[16%] right-[16%] top-[17px] h-px bg-[#D7DDD2]/20" />

                                <ConsoleStage
                                    icon={Radio}
                                    number="01"
                                    title="Detect"
                                    subtitle="Signal received"
                                    active
                                />
                                <ConsoleStage
                                    icon={Users}
                                    number="02"
                                    title="Coordinate"
                                    subtitle="Team engaged"
                                />
                                <ConsoleStage
                                    icon={Check}
                                    number="03"
                                    title="Resolve"
                                    subtitle="Recovery tracked"
                                />
                            </div>

                            <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#4B1B27] bg-[#D7DDD2] text-[9px] font-black text-[#4B1B27]">R</div>
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#4B1B27] bg-[#FF6B1A] text-[9px] font-black text-white">A</div>
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#4B1B27] bg-[#8B7779] text-[9px] font-black text-white">M</div>
                                    </div>
                                    <span className="text-[10px] text-[#D7DDD2]/55">
                                        One team. One response.
                                    </span>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-[#FF6B1A]" />
                            </div>
                        </div>
                    </div>

                    {/* CAPABILITIES */}
                    <div className="mt-8 grid grid-cols-3 gap-3 border-t border-[#4B1B27]/15 pt-6 sm:gap-6">
                        <Capability icon={ShieldCheck} title="Controlled" subtitle="Role-based access" />
                        <Capability icon={GitBranch} title="Connected" subtitle="Unified workflows" />
                        <Capability icon={Layers3} title="Traceable" subtitle="Incident history" />
                    </div>
                </div>

                {/* RIGHT — LOGIN FORM */}
                <div className="relative mx-auto w-full max-w-[490px] lg:ml-auto">

                    <div className="absolute -inset-5 rounded-[35px] bg-[#FF6B1A]/[0.06] blur-2xl" />

                    <div className="relative overflow-hidden rounded-[25px] border border-[#4B1B27]/10 bg-[#F5F4EC] shadow-[0_28px_90px_rgba(75,27,39,0.12)] sm:rounded-[30px]">

                        {/* Accent strip */}
                        <div className="h-[5px] bg-gradient-to-r from-[#4B1B27] via-[#FF6B1A] to-[#FF9A64]" />

                        <div className="p-6 sm:p-9 lg:p-10">

                            {/* Form header */}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4B1B27] text-[#D7DDD2] shadow-lg shadow-[#4B1B27]/10">
                                        <Command className="h-5 w-5" />
                                    </div>

                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6B1A]">
                                        Your workspace awaits
                                    </p>

                                    <h2 className="mt-3 text-[34px] font-semibold tracking-[-0.06em] text-[#4B1B27] sm:text-[39px]">
                                        Welcome back.
                                    </h2>

                                    <p className="mt-2 text-[13px] leading-6 text-[#4B1B27]/55">
                                        Sign in and get back to what matters.
                                    </p>
                                </div>

                                <div className="hidden h-12 w-12 items-center justify-center rounded-full border border-[#4B1B27]/10 text-[#4B1B27]/30 sm:flex">
                                    <ExternalArrow className="h-5 w-5" />
                                </div>
                            </div>

                            {/* Login form */}
                            <form onSubmit={handleLogin} className="mt-9 space-y-5">

                                {error && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3.5"
                                    >
                                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                        <p className="text-xs leading-5 text-red-700">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2.5 block text-[11px] font-bold tracking-wide text-[#4B1B27]"
                                    >
                                        Email address
                                    </label>

                                    <div className="group relative">
                                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#4B1B27]/35 transition-colors group-focus-within:text-[#FF6B1A]" />

                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@company.com"
                                            autoComplete="email"
                                            required
                                            className="h-[55px] w-full rounded-xl border border-[#4B1B27]/15 bg-white/60 pl-12 pr-4 text-[13px] font-medium text-[#4B1B27] outline-none transition-all placeholder:font-normal placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/30 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/[0.08]"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <label
                                            htmlFor="password"
                                            className="block text-[11px] font-bold tracking-wide text-[#4B1B27]"
                                        >
                                            Password
                                        </label>
                                    </div>

                                    <div className="group relative">
                                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#4B1B27]/35 transition-colors group-focus-within:text-[#FF6B1A]" />

                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            required
                                            className="h-[55px] w-full rounded-xl border border-[#4B1B27]/15 bg-white/60 pl-12 pr-12 text-[13px] font-medium text-[#4B1B27] outline-none transition-all placeholder:font-normal placeholder:text-[#4B1B27]/30 hover:border-[#4B1B27]/30 focus:border-[#FF6B1A] focus:bg-white focus:ring-4 focus:ring-[#FF6B1A]/[0.08]"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#4B1B27]/40 transition hover:bg-[#4B1B27]/[0.06] hover:text-[#FF6B1A]"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-[17px] w-[17px]" />
                                            ) : (
                                                <Eye className="h-[17px] w-[17px]" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative mt-3 flex h-[56px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#4B1B27] text-[12px] font-bold tracking-wide text-[#D7DDD2] shadow-[0_10px_25px_rgba(75,27,39,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#35151F] hover:shadow-[0_14px_30px_rgba(75,27,39,0.23)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="absolute inset-y-0 left-0 w-1 bg-[#FF6B1A] transition-all duration-300 group-hover:w-full group-hover:opacity-10" />

                                    <span className="relative">
                                        {loading ? "Signing you in..." : "Sign in to workspace"}
                                    </span>

                                    {loading ? (
                                        <span className="relative h-4 w-4 animate-spin rounded-full border-2 border-[#D7DDD2]/30 border-t-[#D7DDD2]" />
                                    ) : (
                                        <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    )}
                                </button>
                            </form>

                            {/* Register */}
                            <div className="mt-8 border-t border-[#4B1B27]/10 pt-6 text-center">
                                <p className="text-[12px] text-[#4B1B27]/55">
                                    New to IncidentFlow?{" "}
                                    <Link
                                        href="/register"
                                        className="font-bold text-[#FF6B1A] transition-colors hover:text-[#4B1B27]"
                                    >
                                        Create an account
                                        <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
                                    </Link>
                                </p>
                            </div>

                            {/* Security footer */}
                            <div className="mt-6 flex items-center justify-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#4B1B27]/45" />
                                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4B1B27]/40">
                                    Secure workspace authentication
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="relative mt-5 text-center text-[9px] font-medium uppercase tracking-[0.18em] text-[#4B1B27]/35">
                        IncidentFlow · Built for the moments that matter
                    </p>
                </div>
            </section>

            {/* BOTTOM BRAND STRIP */}
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

/* REUSABLE VISUAL COMPONENTS */

function ConsoleStage({ icon: Icon, number, title, subtitle, active }) {
    return (
        <div className="relative z-10 flex min-w-0 flex-col items-center text-center">
            <div
                className={`flex h-[35px] w-[35px] items-center justify-center rounded-xl border transition-colors ${active
                    ? "border-[#FF6B1A]/50 bg-[#FF6B1A] text-white shadow-[0_0_25px_rgba(255,107,26,0.25)]"
                    : "border-[#D7DDD2]/15 bg-[#D7DDD2]/[0.06] text-[#D7DDD2]/65"
                    }`}
            >
                <Icon className="h-4 w-4" />
            </div>

            <span className={`mt-3 text-[8px] font-bold tracking-[0.16em] ${active ? "text-[#FF9A64]" : "text-[#D7DDD2]/35"
                }`}>
                {number}
            </span>

            <p className="mt-1.5 text-[11px] font-semibold text-[#D7DDD2] sm:text-xs">
                {title}
            </p>

            <p className="mt-1 text-[8px] text-[#D7DDD2]/40 sm:text-[9px]">
                {subtitle}
            </p>
        </div>
    );
}

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
