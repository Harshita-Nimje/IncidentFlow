"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const stages = [
    {
        status: "INVESTIGATING",
        title: "Incident detected",
        description: "Payment API is returning 503 errors.",
        time: "14:32",
    },
    {
        status: "IDENTIFIED",
        title: "Root cause identified",
        description: "Database connection pool is exhausted.",
        time: "14:36",
    },
    {
        status: "MITIGATING",
        title: "Mitigation started",
        description: "Responders are restoring database connections.",
        time: "14:41",
    },
    {
        status: "MONITORING",
        title: "Service recovering",
        description: "Error rate has dropped. Team is monitoring recovery.",
        time: "14:49",
    },
    {
        status: "RESOLVED",
        title: "Incident resolved",
        description: "Payment service is operating normally again.",
        time: "14:55",
    },
];

const lifecycleDescriptions = [
    "Investigate the alert and understand its impact.",
    "Identify the underlying cause of the incident.",
    "Coordinate responders and begin mitigation.",
    "Monitor recovery and verify system stability.",
    "Close the incident with a clear resolution.",
];

export default function HomePage() {
    const [lifecycleStage, setLifecycleStage] = useState(0);
    const [stage, setStage] = useState(0);
    const [running, setRunning] = useState(false);

    const current = stages[stage];
    const isResolved = current.status === "RESOLVED";

    useEffect(() => {
        if (!running) return;

        if (stage >= stages.length - 1) {
            setRunning(false);
            return;
        }

        const timer = setTimeout(() => {
            setStage((prev) => prev + 1);
        }, 1800);

        return () => clearTimeout(timer);
    }, [running, stage]);

    useEffect(() => {
        const timer = setInterval(() => {
            setLifecycleStage((prev) => (prev + 1) % stages.length);
        }, 1800);

        return () => clearInterval(timer);
    }, []);

    const startSimulation = () => {
        setStage(0);
        setRunning(true);
    };

    return (
        <main className="min-h-screen overflow-hidden bg-[#D7DDD2] text-[#4B1B27]">

            {/* NAVIGATION */}
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

                    <div className="hidden items-center gap-9 text-[13px] font-medium text-[#D7DDD2]/65 md:flex">
                        <a href="#lifecycle" className="transition-colors hover:text-[#FF6B1A]">
                            Lifecycle
                        </a>
                        <a href="#capabilities" className="transition-colors hover:text-[#FF6B1A]">
                            Capabilities
                        </a>
                    </div>

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

            {/* HERO */}
            <section className="relative isolate">
                <div className="pointer-events-none absolute inset-0 hero-grid opacity-[0.22]" />

                <div className="pointer-events-none absolute -left-48 top-20 h-[500px] w-[500px] rounded-full bg-[#FF6B1A]/10 blur-[130px]" />

                <div className="relative mx-auto grid max-w-[1440px] items-center gap-16 px-6 pb-24 pt-20 lg:grid-cols-[0.88fr_1.12fr] lg:px-12 lg:pb-32 lg:pt-28">

                    {/* HERO CONTENT */}
                    <div className="relative z-10 hero-enter">

                        <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#4B1B27]/15 bg-white/30 px-4 py-2 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B1A] opacity-60" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF6B1A]" />
                            </span>

                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                                Incident response, rethought
                            </span>
                        </div>

                        <h1 className="max-w-[680px] text-[clamp(3.5rem,7vw,6.8rem)] font-bold leading-[0.91] tracking-[-0.075em]">
                            When
                            <br />
                            production
                            <span className="relative mt-2 block text-[#FF6B1A]">
                                goes down.
                                <svg
                                    className="absolute -bottom-3 left-0 w-[78%]"
                                    viewBox="0 0 420 18"
                                    fill="none"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d="M2 13C102 2 272 1 418 10"
                                        stroke="#FF6B1A"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>
                            <span className="mt-5 block text-[0.48em] font-medium leading-tight tracking-[-0.045em] text-[#4B1B27]/65">
                                Your response should be
                                <br />
                                anything but chaotic.
                            </span>
                        </h1>

                        <p className="mt-9 max-w-[480px] text-base leading-8 text-[#4B1B27]/70 sm:text-lg">
                            IncidentFlow gives engineering teams one structured
                            place to detect incidents, coordinate responders,
                            manage resolution, and learn from every outage.
                        </p>

                        <div className="mt-10 flex flex-wrap items-center gap-4">

                            <button
                                type="button"
                                onClick={startSimulation}
                                className="group inline-flex items-center gap-4 rounded-xl bg-[#4B1B27] px-6 py-4 text-sm font-semibold text-[#D7DDD2] shadow-[0_12px_35px_rgba(75,27,39,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#35121c] hover:shadow-[0_18px_40px_rgba(75,27,39,0.25)] active:translate-y-0"
                            >
                                {running
                                    ? "Incident in progress..."
                                    : isResolved
                                        ? "Run simulation again"
                                        : "Explore incident simulation"
                                }

                                <span className="text-[#FF6B1A] transition-transform duration-300 group-hover:translate-x-1">
                                    →
                                </span>
                            </button>

                            <Link
                                href="/register"
                                className="group inline-flex items-center gap-3 rounded-xl border border-[#4B1B27]/20 px-6 py-4 text-sm font-semibold transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B1A] hover:bg-white/30"
                            >
                                Explore IncidentFlow
                                <span className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                                    ↗
                                </span>
                            </Link>
                        </div>

                        <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[#4B1B27]/15 pt-7">
                            {["Real-time response", "Role-based access", "Incident analytics"].map((item) => (
                                <div key={item} className="flex items-center gap-2 text-[11px] font-semibold text-[#4B1B27]/65">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A]" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* INCIDENT COMMAND INTERFACE */}
                    <div className="relative hero-dashboard">

                        <div className="pointer-events-none absolute -inset-12 rounded-full bg-[#FF6B1A]/10 blur-[100px]" />

                        <div className="absolute -right-5 -top-9 z-20 hidden rotate-3 rounded-xl border border-[#4B1B27]/10 bg-[#E9E9DF] px-5 py-3 shadow-xl sm:block">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6B1A]" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.18em]">
                                    Live simulation
                                </span>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#35151F] shadow-[0_40px_100px_rgba(75,27,39,0.28)]">

                            {/* WINDOW HEADER */}
                            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-7">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#FF6B1A]" />
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#D7DDD2]/30" />
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#D7DDD2]/20" />
                                    </div>

                                    <div className="h-4 w-px bg-white/10" />

                                    <span className="text-[10px] font-medium tracking-wide text-[#D7DDD2]/50">
                                        INCIDENTFLOW / COMMAND CENTER
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 rounded-full border border-[#FF6B1A]/20 bg-[#FF6B1A]/10 px-3 py-1.5">
                                    <span className={`h-1.5 w-1.5 rounded-full ${isResolved ? "bg-emerald-400" : "animate-pulse bg-[#FF6B1A]"}`} />
                                    <span className={`text-[9px] font-bold tracking-widest ${isResolved ? "text-emerald-400" : "text-[#FF8A45]"}`}>
                                        {isResolved ? "RESOLVED" : "LIVE"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 sm:p-8">

                                {/* INCIDENT HEADING */}
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="rounded-md border border-red-400/20 bg-red-400/10 px-2 py-1 text-[9px] font-bold tracking-widest text-red-400">
                                                SEV-1
                                            </span>
                                            <span className="text-[9px] font-medium tracking-[0.18em] text-[#D7DDD2]/40">
                                                PRODUCTION INCIDENT
                                            </span>
                                        </div>

                                        <h2 className="text-xl font-semibold tracking-tight text-[#D7DDD2] sm:text-2xl">
                                            Payment Service Down
                                        </h2>

                                        <p className="mt-2 text-[11px] text-[#D7DDD2]/45">
                                            Incident response workspace
                                        </p>
                                    </div>

                                    <div className="hidden rounded-xl border border-white/10 bg-white/[0.04] p-3 text-right sm:block">
                                        <p className="text-[8px] font-semibold uppercase tracking-widest text-[#D7DDD2]/40">
                                            Incident ID
                                        </p>
                                        <p className="mt-1 font-mono text-xs text-[#D7DDD2]/80">
                                            #INC-0042
                                        </p>
                                    </div>
                                </div>

                                {/* STATUS PANEL */}
                                <div className="mt-8 rounded-2xl border border-white/[0.09] bg-[#D7DDD2]/[0.045] p-5 sm:p-6">
                                    <div className="mb-5 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/40">
                                                Current incident update
                                            </p>
                                            <p className="mt-1 text-[10px] text-[#D7DDD2]/35">
                                                Response timeline
                                            </p>
                                        </div>

                                        <span className="font-mono text-xs text-[#FF8A45]">
                                            {current.time}
                                        </span>
                                    </div>

                                    <div key={current.status} className="flex gap-4 animate-event">
                                        <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isResolved ? "bg-emerald-400/10 text-emerald-400" : "bg-[#FF6B1A]/10 text-[#FF8A45]"}`}>
                                            {isResolved ? "✓" : "!"}
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-[#D7DDD2]">
                                                {current.title}
                                            </p>
                                            <p className="mt-1.5 text-xs leading-6 text-[#D7DDD2]/55">
                                                {current.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* RESPONSE LIFECYCLE */}
                                <div className="mt-8">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/45">
                                                Response lifecycle
                                            </p>
                                        </div>
                                        <span className="font-mono text-[10px] text-[#D7DDD2]/55">
                                            {String(stage + 1).padStart(2, "0")} / 05
                                        </span>
                                    </div>

                                    <div className="flex gap-1.5">
                                        {stages.map((item, index) => {
                                            const active = index === stage;
                                            const completed = index < stage;

                                            return (
                                                <div
                                                    key={item.status}
                                                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"
                                                >
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${completed || active ? "w-full bg-[#FF6B1A]" : "w-0"}`}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-3 flex justify-between gap-1">
                                        {stages.map((item, index) => (
                                            <span
                                                key={item.status}
                                                className={`text-[8px] font-semibold tracking-wide transition-colors duration-500 ${index === stage ? "text-[#FF8A45]" : index < stage ? "text-[#D7DDD2]/65" : "text-[#D7DDD2]/25"}`}
                                            >
                                                {item.status.slice(0, 3)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* TEAM */}
                                <div className="mt-8 flex items-center justify-between border-t border-white/[0.08] pt-6">
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/40">
                                            Response team
                                        </p>
                                        <p className="mt-2 text-xs text-[#D7DDD2]/65">
                                            {running
                                                ? "Responders are coordinating"
                                                : isResolved
                                                    ? "Incident resolved successfully"
                                                    : "Ready to respond"
                                            }
                                        </p>
                                    </div>

                                    <div className="flex -space-x-2">
                                        {["H", "R", "A"].map((letter, index) => (
                                            <div
                                                key={letter}
                                                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#35151F] bg-[#FF6B1A] text-[10px] font-bold text-white transition-all duration-300 hover:-translate-y-2 hover:scale-110"
                                                style={{ backgroundColor: index === 1 ? "#74404B" : index === 2 ? "#D7DDD2" : "#FF6B1A", color: index === 2 ? "#4B1B27" : "#fff" }}
                                            >
                                                {letter}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM ACCENT */}
                            <div className="h-1 w-full bg-gradient-to-r from-[#4B1B27] via-[#FF6B1A] to-[#D7DDD2]" />
                        </div>

                        {/* FLOATING ACTIVITY CARD */}
                        <div className="relative z-10 -mt-5 ml-5 mr-5 rounded-2xl border border-[#4B1B27]/10 bg-[#E9E9DF] p-4 shadow-[0_20px_50px_rgba(75,27,39,0.13)] sm:ml-10 sm:mr-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF6B1A]/10 text-lg text-[#FF6B1A]">
                                        ↗
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold">
                                            Incident activity
                                        </p>
                                        <p className="mt-1 text-[9px] text-[#4B1B27]/50">
                                            Every update in one place
                                        </p>
                                    </div>
                                </div>

                                <span className="rounded-full bg-[#4B1B27]/[0.06] px-3 py-1.5 text-[9px] font-semibold text-[#4B1B27]/60">
                                    TIMELINE
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRODUCT VALUE STRIP */}
            <section className="relative overflow-hidden border-y border-[#4B1B27]/15 bg-[#D7DDD2]">
                <div className="pointer-events-none absolute inset-0 opacity-[0.12]"
                    style={{
                        backgroundImage:
                            "linear-gradient(#4B1B27 1px, transparent 1px), linear-gradient(90deg, #4B1B27 1px, transparent 1px)",
                        backgroundSize: "42px 42px",
                    }}
                />

                <div className="relative mx-auto max-w-[1440px] px-6 py-14 lg:px-12 lg:py-16">

                    <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF6B1A]">
                                / The response sequence
                            </p>
                            <h2 className="mt-3 max-w-xl text-3xl font-black tracking-[-0.06em] text-[#4B1B27] sm:text-4xl">
                                FROM FIRST SIGNAL
                                <span className="block text-[#4B1B27]/35">TO FULL RECOVERY.</span>
                            </h2>
                        </div>

                        <p className="max-w-xs text-xs leading-6 text-[#4B1B27]/65">
                            One connected workflow. Every action accounted for.
                            Every incident becomes an opportunity to improve.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                number: "01",
                                title: "DETECT",
                                description: "Understand what went wrong.",
                                tag: "SIGNAL RECEIVED",
                                symbol: "⌁",
                            },
                            {
                                number: "02",
                                title: "COORDINATE",
                                description: "Bring the right responders together.",
                                tag: "TEAM ASSEMBLED",
                                symbol: "⟷",
                            },
                            {
                                number: "03",
                                title: "RESOLVE",
                                description: "Take action and move toward recovery.",
                                tag: "RECOVERY IN MOTION",
                                symbol: "↗",
                            },
                            {
                                number: "04",
                                title: "LEARN",
                                description: "Turn every incident into a better response.",
                                tag: "INSIGHTS CAPTURED",
                                symbol: "◎",
                            },
                        ].map((step, index) => (
                            <div
                                key={step.number}
                                className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden border border-[#4B1B27]/15 bg-[#E9E9DF] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B1A]/60"
                            >
                                <div className="flex items-start justify-between">
                                    <span className="font-mono text-[11px] font-bold text-[#FF6B1A]">
                                        / {step.number}
                                    </span>

                                    <span className="font-mono text-3xl text-[#4B1B27]/25 transition-all duration-300 group-hover:rotate-12 group-hover:text-[#FF6B1A]">
                                        {step.symbol}
                                    </span>
                                </div>

                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B1A]" />
                                        <span className="font-mono text-[9px] font-bold tracking-[0.16em] text-[#4B1B27]/45">
                                            {step.tag}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-black tracking-[-0.04em] text-[#4B1B27] transition-colors group-hover:text-[#FF6B1A]">
                                        {step.title}
                                    </h3>

                                    <p className="mt-2 max-w-[220px] text-xs leading-5 text-[#4B1B27]/60">
                                        {step.description}
                                    </p>
                                </div>

                                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-[#FF6B1A] transition-all duration-500 group-hover:w-full" />

                                {index !== 3 && (
                                    <span className="absolute right-5 top-1/2 hidden -translate-y-1/2 translate-x-1/2 font-mono text-sm text-[#4B1B27]/25 lg:block">
                                        →
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-[#4B1B27]/15 pt-4">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4B1B27]/45">
                            INCIDENTFLOW / RESPONSE PROTOCOL
                        </span>
                        <span className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#4B1B27]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF6B1A]" />
                            4 STAGES · 1 CONNECTED SYSTEM
                        </span>
                    </div>
                </div>
            </section>

            {/* LIFECYCLE */}
            <section id="lifecycle" className="relative overflow-hidden bg-[#4B1B27] py-24 text-[#D7DDD2] lg:py-32">
                <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-[#FF6B1A]/10 blur-[130px]" />

                <div className="relative mx-auto max-w-[1440px] px-6 lg:px-12">

                    <div className="grid gap-16 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">

                        <div>
                            <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF8A45]">
                                <span className="h-px w-8 bg-[#FF6B1A]" />
                                One incident. One flow.
                            </p>

                            <h2 className="mt-7 text-4xl font-bold leading-[1.05] tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                                Chaos has no
                                <span className="block text-[#FF6B1A]">
                                    place here.
                                </span>
                            </h2>

                            <p className="mt-7 max-w-md text-sm leading-7 text-[#D7DDD2]/60">
                                Every incident moves through a clear lifecycle,
                                so your team always knows what is happening
                                and what needs to happen next.
                            </p>

                            <div className="mt-10 flex items-center gap-3">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6B1A]" />
                                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#D7DDD2]/50">
                                    Interactive lifecycle preview
                                </span>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute left-[17px] top-8 h-[calc(100%-64px)] w-px bg-white/10 sm:left-[23px]" />

                            <div className="space-y-3">
                                {stages.map((item, index) => {
                                    const isActive = index === lifecycleStage;
                                    const isComplete = index < lifecycleStage;

                                    return (
                                        <div
                                            key={item.status}
                                            className={`group relative flex items-center gap-5 rounded-2xl border p-4 transition-all duration-500 sm:gap-7 sm:p-5 ${isActive ? "translate-x-2 border-[#FF6B1A]/40 bg-[#FF6B1A]/[0.09] shadow-[0_15px_40px_rgba(0,0,0,0.12)]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/20"}`}
                                        >
                                            <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[10px] font-bold transition-all duration-500 sm:h-12 sm:w-12 ${isActive ? "border-[#FF6B1A] bg-[#FF6B1A] text-white shadow-[0_0_25px_rgba(255,107,26,0.3)]" : isComplete ? "border-[#FF6B1A]/30 bg-[#FF6B1A]/10 text-[#FF8A45]" : "border-white/10 bg-[#4B1B27] text-[#D7DDD2]/40"}`}>
                                                {isComplete ? "✓" : `0${index + 1}`}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className={`text-xs font-bold tracking-wide sm:text-sm ${isActive ? "text-[#FF8A45]" : "text-[#D7DDD2]"}`}>
                                                        {item.status}
                                                    </h3>

                                                    {isActive && (
                                                        <span className="rounded-full bg-[#FF6B1A]/15 px-2 py-1 text-[8px] font-bold tracking-widest text-[#FF8A45]">
                                                            CURRENT STAGE
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-1 text-[10px] leading-5 text-[#D7DDD2]/45 sm:text-xs">
                                                    {lifecycleDescriptions[index]}
                                                </p>
                                            </div>

                                            <span className={`hidden text-lg transition-transform duration-300 group-hover:translate-x-1 sm:block ${isActive ? "text-[#FF6B1A]" : "text-[#D7DDD2]/20"}`}>
                                                →
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CAPABILITIES */}

            {/* CAPABILITIES — CHAOTIC COMMAND ENVIRONMENT */}
            <section
                id="capabilities"
                className="relative isolate overflow-hidden bg-[#D7DDD2] py-28 lg:py-36"
            >
                {/* BACKGROUND ATMOSPHERE */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.13]">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(75,27,39,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(75,27,39,0.15)_1px,transparent_1px)] bg-[size:55px_55px]" />
                </div>

                <div className="pointer-events-none absolute -left-48 top-40 h-[550px] w-[550px] rounded-full bg-[#FF6B1A]/15 blur-[140px]" />
                <div className="pointer-events-none absolute -right-48 bottom-0 h-[600px] w-[600px] rounded-full bg-[#4B1B27]/10 blur-[150px]" />

                <div className="relative mx-auto max-w-[1440px] px-6 lg:px-12">

                    {/* SECTION INTRO */}
                    <div className="relative mb-24 grid gap-10 lg:grid-cols-[1fr_0.65fr] lg:items-end">

                        <div>
                            <div className="mb-7 flex items-center gap-3">
                                <span className="h-px w-10 bg-[#FF6B1A]" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF6B1A]">
                                    Inside the operation
                                </span>
                                <span className="rounded-full border border-[#4B1B27]/15 px-3 py-1 font-mono text-[9px] text-[#4B1B27]/55">
                                    SYSTEM 01—03
                                </span>
                            </div>

                            <h2 className="max-w-4xl text-5xl font-bold leading-[0.92] tracking-[-0.075em] sm:text-6xl lg:text-[88px]">
                                Incidents are
                                <span className="relative mx-3 inline-block text-[#FF6B1A]">
                                    chaotic.
                                    <span className="absolute -bottom-2 left-0 h-[3px] w-full -rotate-2 bg-[#4B1B27]/25" />
                                </span>
                                <br />
                                Your response
                                <span className="block text-[#4B1B27]/35">
                                    shouldn't be.
                                </span>
                            </h2>
                        </div>

                        <div className="relative lg:pb-3">
                            <div className="absolute -left-5 top-0 hidden h-full w-px bg-[#4B1B27]/15 lg:block" />

                            <p className="max-w-md text-sm leading-8 text-[#4B1B27]/65">
                                An outage is never just an alert. It is people,
                                services, decisions, updates, and pressure happening
                                simultaneously. IncidentFlow brings the response together.
                            </p>

                            <div className="mt-7 flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {["#FF6B1A", "#4B1B27", "#8C5962"].map((color, i) => (
                                        <span
                                            key={i}
                                            className="h-7 w-7 rounded-full border-2 border-[#D7DDD2]"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#4B1B27]/55">
                                    People · Systems · Response
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ASYMMETRIC FEATURE CANVAS */}
                    <div className="relative">

                        {/* FLOATING BACKGROUND LABEL */}
                        <div className="pointer-events-none absolute -right-3 -top-12 z-20 hidden rotate-6 border border-[#4B1B27]/20 bg-[#D7DDD2] px-4 py-2 font-mono text-[9px] tracking-widest text-[#4B1B27]/50 lg:block">
                            RESPONSE_INFRASTRUCTURE / 2026
                        </div>

                        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">

                            {/* COORDINATION */}
                            <div className="group relative min-h-[510px] overflow-hidden rounded-[30px] border border-[#4B1B27]/10 bg-[#E9E9DF] p-7 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_35px_80px_rgba(75,27,39,0.14)] sm:p-10 lg:col-span-7">

                                {/* DECORATIVE BACKGROUND */}
                                <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-[#4B1B27]/10 transition-transform duration-1000 group-hover:scale-125" />
                                <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full border border-[#4B1B27]/10 transition-transform duration-1000 group-hover:scale-110" />

                                <div className="relative z-10 flex items-center justify-between">
                                    <span className="font-mono text-[10px] font-bold tracking-widest text-[#FF6B1A]">
                                        01 / COORDINATE
                                    </span>
                                    <span className="rounded-full border border-[#4B1B27]/15 px-3 py-1.5 text-[8px] font-bold tracking-widest text-[#4B1B27]/50">
                                        TEAM OPERATIONS
                                    </span>
                                </div>

                                <div className="relative z-10 mt-12 max-w-md">
                                    <h3 className="text-4xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-5xl">
                                        No one should
                                        <br />
                                        fight an outage
                                        <span className="block text-[#FF6B1A]">
                                            alone.
                                        </span>
                                    </h3>

                                    <p className="mt-5 max-w-sm text-sm leading-7 text-[#4B1B27]/60">
                                        Bring responders together. Define ownership,
                                        coordinate responsibilities, and keep everyone
                                        aligned as the incident unfolds.
                                    </p>
                                </div>

                                {/* FLOATING TEAM WORKSPACE */}
                                <div className="relative mt-12 sm:mt-14">

                                    <div className="absolute -left-5 top-7 h-32 w-32 rounded-full bg-[#FF6B1A]/10 blur-3xl" />

                                    <div className="relative ml-auto max-w-[390px] rotate-[-2deg] rounded-2xl border border-[#4B1B27]/15 bg-[#D7DDD2] p-5 shadow-[0_20px_45px_rgba(75,27,39,0.12)] transition-all duration-700 group-hover:rotate-0 group-hover:translate-y-[-5px]">

                                        <div className="mb-5 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-[#4B1B27]/45">
                                                    Active response
                                                </p>
                                                <p className="mt-1 text-xs font-bold">
                                                    Payment API incident
                                                </p>
                                            </div>

                                            <span className="flex items-center gap-2 rounded-full bg-[#FF6B1A]/10 px-3 py-1.5 text-[8px] font-bold text-[#FF6B1A]">
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF6B1A]" />
                                                ACTIVE
                                            </span>
                                        </div>

                                        {[
                                            ["H", "Incident lead", "Owning response"],
                                            ["R", "Responder", "Investigating"],
                                            ["A", "Team member", "Monitoring"],
                                        ].map(([letter, role, status], index) => (
                                            <div
                                                key={letter}
                                                className="flex items-center gap-3 border-t border-[#4B1B27]/10 py-3 transition-transform duration-300 hover:translate-x-1"
                                            >
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-[10px] font-bold ${index === 0 ? "bg-[#FF6B1A] text-white" : "bg-[#4B1B27] text-[#D7DDD2]"}`}>
                                                    {letter}
                                                </div>

                                                <div>
                                                    <p className="text-[10px] font-bold">{role}</p>
                                                    <p className="mt-1 text-[9px] text-[#4B1B27]/45">{status}</p>
                                                </div>

                                                <span className="ml-auto h-2 w-2 rounded-full bg-emerald-600" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* FLOATING NOTIFICATION */}
                                    <div className="absolute -left-2 -top-8 z-10 rotate-3 rounded-xl border border-[#4B1B27]/10 bg-[#4B1B27] px-4 py-3 text-[#D7DDD2] shadow-xl transition-transform duration-500 group-hover:-translate-y-2 sm:left-0">
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-[#FF8A45]">
                                            Assignment update
                                        </p>
                                        <p className="mt-1 text-[10px] font-semibold">
                                            Responder assigned ↗
                                        </p>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-8 flex flex-wrap gap-2">
                                    <FeatureTags tags={["RBAC", "Assignments", "Comments"]} />
                                </div>

                                <span className="pointer-events-none absolute bottom-[-50px] left-[-10px] select-none text-[170px] font-black leading-none tracking-[-0.1em] text-[#4B1B27]/[0.035]">
                                    01
                                </span>
                            </div>

                            {/* RESPONSE */}
                            <div className="group relative min-h-[510px] overflow-hidden rounded-[30px] bg-[#4B1B27] p-7 text-[#D7DDD2] transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_35px_80px_rgba(75,27,39,0.25)] sm:p-10 lg:col-span-5">

                                <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full border border-white/10 transition-transform duration-1000 group-hover:scale-125" />
                                <div className="pointer-events-none absolute -right-12 top-36 h-48 w-48 rounded-full border border-white/10 transition-transform duration-1000 group-hover:scale-110" />

                                <div className="relative z-10 flex items-center justify-between">
                                    <span className="font-mono text-[10px] font-bold tracking-widest text-[#FF8A45]">
                                        02 / RESPOND
                                    </span>
                                    <span className="rounded-full border border-white/15 px-3 py-1.5 text-[8px] font-bold tracking-widest text-white/50">
                                        INCIDENT FLOW
                                    </span>
                                </div>

                                <div className="relative z-10 mt-12">
                                    <h3 className="text-4xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-5xl">
                                        Every second
                                        <br />
                                        matters.
                                    </h3>

                                    <p className="mt-5 max-w-sm text-sm leading-7 text-[#D7DDD2]/55">
                                        Track severity, follow the incident lifecycle,
                                        and move from investigation to resolution
                                        with a structured response.
                                    </p>
                                </div>

                                {/* SEVERITY DISPLAY */}
                                <div className="relative z-10 mt-12">
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/40">
                                            Severity classification
                                        </span>
                                        <span className="font-mono text-[9px] text-[#FF8A45]">
                                            SEV / 01—04
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            ["SEV-1", "CRITICAL"],
                                            ["SEV-2", "HIGH"],
                                            ["SEV-3", "MEDIUM"],
                                            ["SEV-4", "LOW"],
                                        ].map(([severity, label], index) => (
                                            <div
                                                key={severity}
                                                className={`relative overflow-hidden rounded-xl border p-3 transition-all duration-500 hover:-translate-y-2 ${index === 0 ? "border-[#FF6B1A]/50 bg-[#FF6B1A]/15" : "border-white/10 bg-white/[0.035]"}`}
                                                style={{ transitionDelay: `${index * 50}ms` }}
                                            >
                                                <div className={`mb-5 h-1 rounded-full ${index === 0 ? "bg-[#FF6B1A]" : "bg-white/20"}`} />
                                                <p className={`text-[9px] font-bold ${index === 0 ? "text-[#FF8A45]" : "text-[#D7DDD2]/65"}`}>
                                                    {severity}
                                                </p>
                                                <p className="mt-1 text-[7px] tracking-wider text-[#D7DDD2]/35">
                                                    {label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* TIMELINE */}
                                <div className="relative z-10 mt-10 border-t border-white/10 pt-7">
                                    <p className="mb-5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/40">
                                        Incident progression
                                    </p>

                                    <div className="relative flex items-center justify-between">
                                        <div className="absolute left-0 right-0 top-3 h-px bg-white/15" />
                                        <div className="absolute left-0 top-3 h-px w-[68%] bg-[#FF6B1A]" />

                                        {["Detect", "Identify", "Mitigate", "Resolve"].map((item, index) => (
                                            <div key={item} className="relative flex flex-col items-center gap-3">
                                                <div className={`z-10 h-6 w-6 rounded-full border-4 border-[#4B1B27] transition-all duration-500 ${index < 3 ? "bg-[#FF6B1A]" : "bg-[#D7DDD2]/20"} group-hover:scale-110`} />
                                                <span className="text-[8px] font-semibold text-[#D7DDD2]/50">
                                                    {item}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative z-10 mt-8">
                                    <FeatureTags dark tags={["SEV-1 → SEV-4", "Timeline", "Real-time"]} />
                                </div>

                                <span className="pointer-events-none absolute bottom-[-50px] right-[-10px] select-none text-[170px] font-black leading-none tracking-[-0.1em] text-white/[0.035]">
                                    02
                                </span>
                            </div>

                            {/* UNDERSTAND / ANALYTICS */}
                            <div className="group relative min-h-[440px] overflow-hidden rounded-[30px] border border-[#4B1B27]/10 bg-[#FF6B1A] p-7 text-white transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_35px_80px_rgba(255,107,26,0.25)] sm:p-10 lg:col-span-12">

                                {/* ORBITAL DECORATION */}
                                <div className="pointer-events-none absolute -right-32 -top-52 h-[600px] w-[600px] rounded-full border border-white/20 transition-transform duration-1000 group-hover:rotate-12" />
                                <div className="pointer-events-none absolute -right-16 -top-36 h-[450px] w-[450px] rounded-full border border-white/20 transition-transform duration-1000 group-hover:-rotate-12" />

                                <div className="relative z-10 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">

                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-[10px] font-bold tracking-widest text-white/70">
                                                03 / UNDERSTAND
                                            </span>
                                            <span className="rounded-full border border-white/30 px-3 py-1 text-[8px] font-bold tracking-widest">
                                                INSIGHTS
                                            </span>
                                        </div>

                                        <h3 className="mt-12 text-5xl font-bold leading-[0.95] tracking-[-0.07em] sm:text-6xl">
                                            Don't let
                                            <br />
                                            the next outage
                                            <span className="block text-[#4B1B27]">
                                                repeat itself.
                                            </span>
                                        </h3>

                                        <p className="mt-6 max-w-md text-sm leading-7 text-white/80">
                                            Keep incident history, service information,
                                            and analytics connected. Understand what
                                            happened and make the next response better.
                                        </p>

                                        <FeatureTags tags={["Analytics", "Services", "History"]} />
                                    </div>

                                    {/* ANALYTICS COMMAND BOARD */}
                                    <div className="relative">

                                        {/* FLOATING DATA LABEL */}
                                        <div className="absolute -right-3 -top-7 z-20 rotate-3 rounded-lg border border-white/30 bg-[#4B1B27] px-4 py-3 shadow-xl transition-transform duration-500 group-hover:-translate-y-2 sm:right-5">
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-[#FF8A45]">
                                                System intelligence
                                            </p>
                                            <p className="mt-1 text-xs font-bold text-[#D7DDD2]">
                                                Incident history ↗
                                            </p>
                                        </div>

                                        <div className="relative rotate-1 overflow-hidden rounded-2xl border border-white/25 bg-[#4B1B27] p-5 shadow-[0_30px_70px_rgba(75,27,39,0.25)] transition-transform duration-700 group-hover:rotate-0 sm:p-7">

                                            <div className="flex items-center justify-between border-b border-white/10 pb-5">
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D7DDD2]/40">
                                                        Operations overview
                                                    </p>
                                                    <p className="mt-1 text-sm font-bold text-[#D7DDD2]">
                                                        Incident activity
                                                    </p>
                                                </div>

                                                <span className="rounded-lg border border-white/10 px-3 py-2 text-[8px] font-semibold text-[#D7DDD2]/55">
                                                    ANALYTICS
                                                </span>
                                            </div>

                                            <div className="mt-6 grid grid-cols-3 gap-3">
                                                {[
                                                    ["SEV-1", "Critical"],
                                                    ["ACTIVE", "Investigating"],
                                                    ["HISTORY", "Recorded"],
                                                ].map(([value, label], index) => (
                                                    <div key={value} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                                        <p className={`text-[10px] font-bold ${index === 0 ? "text-[#FF8A45]" : "text-[#D7DDD2]"}`}>
                                                            {value}
                                                        </p>
                                                        <p className="mt-1 text-[8px] text-[#D7DDD2]/40">
                                                            {label}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* CHART */}
                                            <div className="relative mt-7 h-36 border-b border-l border-white/15 px-2">
                                                <div className="absolute inset-0 flex flex-col justify-between">
                                                    {[1, 2, 3, 4].map((line) => (
                                                        <div key={line} className="border-t border-dashed border-white/[0.08]" />
                                                    ))}
                                                </div>

                                                <div className="relative flex h-full items-end gap-2">
                                                    {[38, 60, 48, 82, 55, 72, 94, 65, 82, 45, 70, 90].map((height, index) => (
                                                        <div key={index} className="group/bar relative flex h-full flex-1 items-end">
                                                            <div
                                                                className={`w-full origin-bottom rounded-t-sm transition-all duration-700 group-hover/bar:scale-y-110 ${index === 6 ? "bg-[#FF6B1A]" : "bg-[#D7DDD2]/55 group-hover/bar:bg-[#D7DDD2]"}`}
                                                                style={{
                                                                    height: `${height}%`,
                                                                    transitionDelay: `${index * 35}ms`,
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-4 flex justify-between text-[8px] font-medium text-[#D7DDD2]/40">
                                                <span>INCIDENT HISTORY</span>
                                                <span>RESPONSE ACTIVITY</span>
                                                <span>SERVICE TRENDS</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <span className="pointer-events-none absolute bottom-[-60px] left-[40%] select-none text-[180px] font-black leading-none tracking-[-0.1em] text-white/[0.07]">
                                    03
                                </span>
                            </div>
                        </div>

                        {/* CLOSING STATEMENT */}
                        {/* <div className="relative mt-20 flex flex-col justify-between gap-5 border-t border-[#4B1B27]/15 pt-7 sm:flex-row sm:items-center">
                            <p className="max-w-lg text-[11px] leading-6 text-[#4B1B27]/50">
                                One workspace. Connected responders. A complete view of every incident.
                            </p>

                            <div className="flex items-center gap-3">
                                <span className="h-px w-8 bg-[#FF6B1A]" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#4B1B27]/60">
                                    Built for production reality
                                </span>
                            </div>
                        </div> */}
                    </div>
                </div>


            </section>


            {/* FINAL CTA */}
            <section className="relative isolate overflow-hidden bg-[#D7DDD2] px-5 py-24 sm:px-8 lg:py-32">

                {/* BACKGROUND GRID */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.16]"
                    style={{
                        backgroundImage: `
                linear-gradient(#4B1B27 1px, transparent 1px),
                linear-gradient(90deg, #4B1B27 1px, transparent 1px)
            `,
                        backgroundSize: "65px 65px"
                    }}
                />

                <div className="pointer-events-none absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-[#FF6B1A]/15 blur-[120px]" />
                <div className="pointer-events-none absolute -right-40 bottom-0 h-[550px] w-[550px] rounded-full bg-[#4B1B27]/10 blur-[130px]" />

                <div className="relative mx-auto max-w-[1400px]">

                    {/* TOP SYSTEM HEADER */}
                    <div className="flex items-center justify-between border-y border-[#4B1B27]/25 py-4">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF6B1A] opacity-60" />
                                <span className="relative h-2.5 w-2.5 rounded-full bg-[#FF6B1A]" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#4B1B27]">
                                IncidentFlow / Mission Control
                            </span>
                        </div>

                        <span className="hidden text-[9px] font-bold uppercase tracking-[0.22em] text-[#4B1B27]/45 sm:block">
                            Operational readiness / 001
                        </span>
                    </div>

                    {/* MAIN HEADLINE */}
                    <div className="relative py-20 lg:py-28">

                        <div className="absolute right-[8%] top-16 hidden h-32 w-32 rotate-12 border border-[#4B1B27]/30 lg:block">
                            <div className="absolute inset-3 border border-[#FF6B1A]/60" />
                            <div className="absolute -right-3 -top-3 h-5 w-5 bg-[#FF6B1A]" />
                        </div>

                        <div className="mb-8 flex items-center gap-3">
                            <span className="bg-[#4B1B27] px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#D7DDD2]">
                                The next incident is inevitable
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#4B1B27]/45">
                                Your response doesn't have to be
                            </span>
                        </div>

                        <h2 className="max-w-[1150px] text-[clamp(3.8rem,10vw,10rem)] font-black leading-[0.78] tracking-[-0.09em] text-[#4B1B27]">
                            DON'T FEAR
                            <br />
                            THE <span className="text-[#FF6B1A]">OUTAGE.</span>
                            <br />
                            <span className="relative inline-block">
                                OWN THE
                                <span className="absolute -bottom-3 left-0 h-[5px] w-[85%] bg-[#4B1B27]" />
                            </span>
                            <br />
                            RESPONSE<span className="text-[#FF6B1A]">.</span>
                        </h2>

                        <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:items-end">

                            <p className="max-w-md text-sm font-medium leading-7 text-[#4B1B27]/65 sm:text-base lg:col-span-5">
                                Bring incidents, responders, services, and communication
                                into one connected workspace. Spend less time coordinating
                                chaos and more time restoring production.
                            </p>

                            <div className="flex items-center gap-5 lg:col-span-7 lg:justify-end">
                                <div className="text-right">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4B1B27]/40">
                                        One platform
                                    </p>
                                    <p className="mt-1 text-sm font-black uppercase tracking-tight text-[#4B1B27]">
                                        Total response clarity ↗
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CHAOTIC CTA COMPOSITION */}
                    <div className="relative">

                        {/* DECORATIVE SIDE MARKER */}
                        <div className="absolute -left-5 top-10 z-20 hidden -rotate-90 bg-[#4B1B27] px-5 py-2 text-[9px] font-black uppercase tracking-[0.25em] text-[#D7DDD2] lg:block">
                            Response starts here
                        </div>

                        <div className="relative grid overflow-hidden bg-[#4B1B27] lg:grid-cols-12">

                            {/* ORANGE SIDE */}
                            <div className="relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-[#FF6B1A] p-8 sm:p-12 lg:col-span-7 lg:p-16">

                                <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[35px] border-white/10" />
                                <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full border border-white/20" />

                                <div className="relative flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/65">
                                        Ready when you are
                                    </span>
                                    <span className="text-3xl font-black text-white/40">✳</span>
                                </div>

                                <div className="relative mt-16">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/65">
                                        Build a stronger response system
                                    </p>

                                    <h3 className="mt-4 max-w-xl text-4xl font-black leading-[0.9] tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
                                        MAKE
                                        <br />
                                        EVERY
                                        <br />
                                        SECOND
                                        <br />
                                        COUNT<span className="text-[#4B1B27]">.</span>
                                    </h3>
                                </div>

                                <div className="relative mt-14 flex items-center justify-between border-t border-white/25 pt-5">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">
                                        IncidentFlow / 2026
                                    </span>
                                    <span className="text-sm font-black text-white">01 — 01</span>
                                </div>
                            </div>

                            {/* DARK ACTION SIDE */}
                            <div className="relative flex min-h-[320px] flex-col justify-between overflow-hidden p-8 text-[#D7DDD2] sm:p-12 lg:col-span-5 lg:p-12">

                                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#D7DDD2]/10" />
                                <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border border-[#FF6B1A]/30" />

                                <div className="relative">
                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#FF6B1A]">
                                        Your next move
                                    </p>

                                    <div className="mt-10 flex items-center gap-4">
                                        <span className="text-5xl font-black tracking-[-0.08em] text-[#D7DDD2]/15">
                                            01
                                        </span>
                                        <div className="h-px flex-1 bg-[#D7DDD2]/20" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#D7DDD2]/40">
                                            Get started
                                        </span>
                                    </div>

                                    <h4 className="mt-8 text-3xl font-black leading-tight tracking-[-0.05em] sm:text-4xl">
                                        Stop reacting
                                        <br />
                                        in fragments.
                                        <br />
                                        <span className="text-[#FF6B1A]">Start responding</span>
                                        <br />
                                        together.
                                    </h4>
                                </div>

                                <div className="relative mt-14">
                                    <Link
                                        href="/register"
                                        className="group flex w-full items-center justify-between gap-4 bg-[#D7DDD2] px-6 py-5 text-xs font-black uppercase tracking-wider text-[#4B1B27] transition-all duration-300 hover:-translate-y-1 hover:bg-[#FF6B1A] hover:text-white hover:shadow-[0_15px_40px_rgba(255,107,26,0.2)]"
                                    >
                                        Get started with IncidentFlow
                                        <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">
                                            ↗
                                        </span>
                                    </Link>

                                    <p className="mt-4 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-[#D7DDD2]/35">
                                        Your team. One connected response.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER SIGNATURE */}
                    <div className="mt-8 flex flex-col justify-between gap-4 border-t border-[#4B1B27]/20 pt-6 sm:flex-row sm:items-center">

                        <div className="flex items-center gap-3">
                            <span className="h-2 w-2 bg-[#FF6B1A]" />
                            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-[#4B1B27]/55">
                                IncidentFlow / Operational clarity
                            </span>
                        </div>

                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#4B1B27]/40">
                            Detect. Coordinate. Resolve.
                        </span>
                    </div>

                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/10 bg-[#35151F] text-[#D7DDD2]">
                <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 px-6 py-9 sm:flex-row sm:items-center lg:px-12">

                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B1A] text-sm font-black text-white">
                            I
                        </div>
                        <span className="text-lg font-bold tracking-[-0.05em]">
                            Incident<span className="text-[#FF6B1A]">Flow</span>
                        </span>
                    </Link>

                    <p className="text-[10px] text-[#D7DDD2]/45">
                        © 2026 IncidentFlow. Built for better incident response.
                    </p>

                    <p className="text-[10px] font-semibold tracking-widest text-[#D7DDD2]/55">
                        DETECT · COORDINATE · RESOLVE · LEARN
                    </p>
                </div>
            </footer>

            {/* ANIMATIONS */}
            <style jsx global>{`
                html {
                    scroll-behavior: smooth;
                }

                .hero-grid {
                    background-image:
                        linear-gradient(rgba(75, 27, 39, 0.07) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(75, 27, 39, 0.07) 1px, transparent 1px);
                    background-size: 48px 48px;
                    mask-image: linear-gradient(to bottom, black, transparent 85%);
                }

                .hero-enter {
                    animation: heroEnter 0.9s cubic-bezier(.2,.7,.2,1) both;
                }

                .hero-dashboard {
                    animation: dashboardEnter 1.1s cubic-bezier(.2,.7,.2,1) both;
                    animation-delay: 0.12s;
                }

                .animate-event {
                    animation: eventEnter 0.45s ease-out both;
                }

                @keyframes heroEnter {
                    from {
                        opacity: 0;
                        transform: translateY(35px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes dashboardEnter {
                    from {
                        opacity: 0;
                        transform: translateY(35px) scale(0.97);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes eventEnter {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @media (prefers-reduced-motion: reduce) {
                    *,
                    *::before,
                    *::after {
                        scroll-behavior: auto !important;
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>

            {/* SECTION ANIMATIONS */}
            <style jsx>{`
        @keyframes featureFloat {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-8px);
            }
        }

        @media (prefers-reduced-motion: no-preference) {
            #capabilities .group:hover .animate-feature-float {
                animation: featureFloat 3s ease-in-out infinite;
            }
        }
    `}</style>
        </main>
    );
}

function FeatureTags({ tags, dark = false }) {
    return (
        <div className="mt-7 flex flex-wrap gap-2">
            {tags.map((tag) => (
                <span
                    key={tag}
                    className={`rounded-lg border px-3 py-2 text-[9px] font-semibold tracking-wide transition-colors duration-300 ${dark
                        ? "border-white/10 bg-white/[0.05] text-[#D7DDD2]/65"
                        : "border-[#4B1B27]/10 bg-white/20 text-[#4B1B27]/70"
                        }`}
                >
                    {tag}
                </span>
            ))}
        </div>
    );
}
