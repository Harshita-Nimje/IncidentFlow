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
            setLifecycleStage((prev) => {
                return (prev + 1) % stages.length;
            });
        }, 1800);

        return () => clearInterval(timer);
    }, []);
    const startSimulation = () => {
        setStage(0);
        setRunning(true);
    };

    return (
        <main className="min-h-screen bg-[#070b12] text-white overflow-x-hidden">

            {/* NAVBAR */}
            <nav className="border-b border-white/[0.06]">

                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">

                    <Link
                        href="/"
                        className="group text-xl font-semibold tracking-tight"
                    >
                        Incident
                        <span className="text-blue-500 transition-colors duration-300 group-hover:text-blue-400">
                            Flow
                        </span>
                    </Link>

                    <div className="flex items-center gap-5">

                        <Link
                            href="/login"
                            className="relative text-sm text-slate-400 hover:text-white transition-colors duration-300"
                        >
                            Login

                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-500 transition-all duration-300 hover:w-full" />
                        </Link>

                        <Link
                            href="/register"
                            className={`
                                group
                                flex items-center gap-2
                                px-4 py-2
                                rounded-lg
                                bg-white
                                text-slate-950
                                text-sm
                                font-medium
                                transition-all duration-300
                                hover:-translate-y-0.5
                                hover:bg-slate-200
                                hover:shadow-[0_8px_25px_rgba(255,255,255,0.08)]
                                active:translate-y-0
                            `}
                        >
                            Get Started

                            <span className="transition-transform duration-300 group-hover:translate-x-1">
                                →
                            </span>
                        </Link>

                    </div>
                </div>

            </nav>


            {/* HERO */}
            <section className="relative max-w-7xl mx-auto px-6 pt-20 lg:pt-28 pb-24">

                <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-14 lg:gap-20 items-center">

                    {/* LEFT */}
                    <div className="animate-[fadeUp_0.8s_ease-out]">

                        <div className="inline-flex items-center gap-2 text-xs font-medium text-red-400 mb-7">

                            <span className="relative flex w-2 h-2">
                                <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-50 animate-ping" />
                                <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
                            </span>

                            Production is not waiting

                        </div>


                        <h1 className="text-5xl sm:text-6xl lg:text-[68px] leading-[0.98] font-bold tracking-[-0.04em]">

                            What happens
                            <br />
                            when
                            <span className="text-red-500">
                                {" "}production
                            </span>
                            <br />
                            goes down?

                        </h1>


                        <p className="mt-7 max-w-lg text-base sm:text-lg text-slate-400 leading-relaxed">
                            IncidentFlow gives engineering teams a structured
                            way to detect, coordinate, resolve, and learn from
                            production incidents.
                        </p>


                        {/* BUTTONS */}
                        <div className="mt-9 flex flex-wrap items-center gap-4">

                            <button
                                type="button"
                                onClick={startSimulation}
                                className={`
                                    group
                                    relative
                                    px-6 py-3.5
                                    rounded-lg
                                    font-medium
                                    transition-all duration-300
                                    hover:-translate-y-1
                                    active:translate-y-0
                                    ${running
                                        ? "bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.25)]"
                                        : "bg-blue-600 hover:bg-blue-500 hover:shadow-[0_12px_35px_rgba(37,99,235,0.25)]"
                                    }
                                `}
                            >
                                <span className="flex items-center gap-2">

                                    {running
                                        ? "Incident in progress..."
                                        : isResolved
                                            ? "Run it again"
                                            : "Start incident simulation"}

                                    {!running && (
                                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                                            →
                                        </span>
                                    )}

                                </span>

                            </button>


                            <Link
                                href="/register"
                                className={`
                                    group
                                    flex items-center gap-2
                                    px-6 py-3.5
                                    rounded-lg
                                    border border-slate-700
                                    text-slate-200
                                    transition-all duration-300
                                    hover:-translate-y-1
                                    hover:border-slate-500
                                    hover:bg-white/[0.03]
                                    hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]
                                    active:translate-y-0
                                `}
                            >
                                Explore IncidentFlow

                                <span className="transition-transform duration-300 group-hover:translate-x-1">
                                    ↗
                                </span>

                            </Link>

                        </div>


                        <div className="mt-8 flex flex-wrap gap-5 text-xs text-slate-500">

                            <span className="transition-colors hover:text-slate-300">
                                Real-time response
                            </span>

                            <span>•</span>

                            <span className="transition-colors hover:text-slate-300">
                                Role-based access
                            </span>

                            <span>•</span>

                            <span className="transition-colors hover:text-slate-300">
                                Incident analytics
                            </span>

                        </div>

                    </div>


                    {/* INCIDENT SIMULATION */}
                    <div className="relative animate-[fadeUp_1s_ease-out]">

                        <div className="absolute -inset-8 bg-blue-500/[0.035] blur-3xl rounded-full" />

                        <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c111a] shadow-2xl overflow-hidden transition-all duration-500 hover:border-white/[0.12] hover:shadow-[0_30px_80px_rgba(0,0,0,0.4)]">

                            {/* TOP BAR */}
                            <div className="h-12 px-5 border-b border-white/[0.06] flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="flex gap-1.5">

                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-700 transition-transform hover:scale-125" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-700 transition-transform hover:scale-125" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-slate-700 transition-transform hover:scale-125" />

                                    </div>

                                    <span className="text-xs text-slate-600">
                                        incidentflow / production
                                    </span>

                                </div>


                                <div className="flex items-center gap-2 text-[11px]">

                                    <span
                                        className={`
                                            w-1.5 h-1.5 rounded-full
                                            ${isResolved
                                                ? "bg-emerald-500"
                                                : "bg-red-500 animate-pulse"
                                            }
                                        `}
                                    />

                                    <span
                                        className={
                                            isResolved
                                                ? "text-emerald-400"
                                                : "text-red-400"
                                        }
                                    >
                                        {isResolved ? "RESOLVED" : "LIVE"}
                                    </span>

                                </div>

                            </div>


                            <div className="p-6 sm:p-7">

                                {/* INCIDENT HEADER */}
                                <div className="flex items-start justify-between gap-4">

                                    <div>
                                        <div className="flex items-center gap-2 mb-2">

                                            <span className="text-[10px] font-bold tracking-[0.18em] text-red-400">
                                                SEV-1
                                            </span>

                                            <span className="text-[10px] text-slate-600">
                                                •
                                            </span>

                                            <span className="text-[10px] text-slate-500">
                                                PRODUCTION
                                            </span>

                                        </div>

                                        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
                                            Payment Service Down
                                        </h2>

                                    </div>

                                    <div
                                        className={`
                shrink-0
                px-2.5 py-1
                rounded-md
                text-[10px]
                font-semibold
                tracking-wide
                transition-all duration-500
                ${isResolved
                                                ? "text-emerald-400 bg-emerald-500/[0.08] border border-emerald-500/20"
                                                : "text-red-400 bg-red-500/[0.08] border border-red-500/20"
                                            }
            `}
                                    >
                                        {isResolved ? "RESOLVED" : "ACTIVE"}
                                    </div>

                                </div>


                                {/* CURRENT STATUS */}
                                <div className="mt-7">

                                    <div className="flex items-center justify-between mb-3">

                                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-600">
                                            Current status
                                        </span>

                                        <span className="text-[10px] text-slate-600">
                                            {current.time}
                                        </span>

                                    </div>


                                    <div
                                        key={current.status}
                                        className={`
    rounded-xl
    border border-white/[0.06]
    bg-white/[0.02]
    p-5
    transition-all duration-500
    animate-[eventIn_0.45s_ease-out]
`}
                                    >

                                        <div className="flex items-start gap-4">

                                            <div
                                                className={`
                        mt-1
                        w-2.5 h-2.5
                        shrink-0
                        rounded-full
                        ${isResolved
                                                        ? "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)]"
                                                        : "bg-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.7)]"
                                                    }
                    `}
                                            />

                                            <div>

                                                <p className="text-sm font-semibold text-slate-200">
                                                    {current.title}
                                                </p>

                                                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                                                    {current.description}
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                </div>


                                {/* PROGRESS */}
                                <div className="mt-7">

                                    <div className="flex items-center justify-between mb-3">

                                        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-600">
                                            Response flow
                                        </span>

                                        <span className="text-[10px] text-slate-600">
                                            {stage + 1} / {stages.length}
                                        </span>

                                    </div>


                                    <div className="flex items-center gap-1.5">

                                        {stages.map((item, index) => {

                                            const active = index === stage;
                                            const completed = index < stage;

                                            return (
                                                <div
                                                    key={item.status}
                                                    className="flex items-center flex-1"
                                                >

                                                    <div
                                                        className={`
                                h-1.5
                                w-full
                                rounded-full
                                transition-all duration-500
                                ${completed || active
                                                                ? "bg-blue-500"
                                                                : "bg-slate-800"
                                                            }
                            `}
                                                    />

                                                </div>
                                            );

                                        })}

                                    </div>


                                    <div className="mt-2 flex justify-between">

                                        {stages.map((item, index) => (
                                            <span
                                                key={item.status}
                                                className={`
                        text-[8px]
                        transition-colors duration-500
                        ${index === stage
                                                        ? "text-blue-400"
                                                        : index < stage
                                                            ? "text-slate-500"
                                                            : "text-slate-700"
                                                    }
                    `}
                                            >
                                                {item.status.slice(0, 3)}
                                            </span>
                                        ))}

                                    </div>

                                </div>


                                {/* RESPONSE TEAM */}
                                <div className="mt-7 pt-5 border-t border-white/[0.06]">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-600">
                                                Response team
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
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
                                                    className={`
    w-8 h-8
    rounded-full
    border-2 border-[#0c111a]
    bg-slate-800
    flex items-center justify-center
    text-[10px]
    font-semibold
    text-slate-300
    transition-transform duration-300
    hover:-translate-y-1
    hover:z-10
`}
                                                >
                                                    {letter}

                                                </div>

                                            ))}

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </section>


            {/* LIFECYCLE */}
            <section className="border-y border-white/[0.06] bg-white/[0.008]">

                <div className="max-w-7xl mx-auto px-6 py-20">

                    <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-12 items-center">

                        <div>

                            <p className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                                One incident. One flow.
                            </p>

                            <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
                                From first alert
                                <br />
                                to final resolution.
                            </h2>

                            <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-md">
                                Every incident moves through a clear lifecycle,
                                so your team always knows what is happening
                                and what needs to happen next.
                            </p>

                        </div>


                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">

                            {stages.map((item, index) => {

                                const isActive = index === lifecycleStage;

                                return (
                                    <div
                                        key={item.status}
                                        className={`
                    group
                    p-4
                    rounded-xl
                    border
                    transition-all duration-500
                    hover:-translate-y-1

                    ${isActive
                                                ? "border-blue-500/40 bg-blue-500/[0.08] shadow-[0_0_25px_rgba(59,130,246,0.08)]"
                                                : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12]"
                                            }
                `}
                                    >

                                        <span
                                            className={`
                        text-[10px]
                        transition-colors duration-500
                        ${isActive ? "text-blue-400" : "text-slate-600"}
                    `}
                                        >
                                            0{index + 1}
                                        </span>

                                        <div
                                            className={`
                        mt-5
                        w-2 h-2
                        rounded-full
                        transition-all duration-500

                        ${isActive
                                                    ? "bg-blue-400 scale-125 shadow-[0_0_14px_rgba(59,130,246,0.8)]"
                                                    : "bg-slate-700 group-hover:bg-slate-500"
                                                }
                    `}
                                        />

                                        <p
                                            className={`
                        mt-3
                        text-[11px]
                        font-semibold
                        transition-colors duration-500

                        ${isActive
                                                    ? "text-white"
                                                    : "text-slate-500"
                                                }
                    `}
                                        >
                                            {item.status}
                                        </p>

                                    </div>
                                );

                            })}

                        </div>

                    </div>

                </div>

            </section>


            {/* FEATURES */}
            <section className="max-w-7xl mx-auto px-6 py-24">

                <div className="mb-14">

                    <p className="text-xs uppercase tracking-widest text-slate-600">
                        Under the hood
                    </p>

                    <h2 className="mt-4 text-3xl sm:text-4xl font-bold">
                        Built for the moments
                        <br />
                        that actually matter.
                    </h2>

                </div>


                <div className="grid md:grid-cols-3 gap-5">

                    <Feature
                        number="01"
                        title="Coordinate"
                        text="Assign responders, define responsibilities, and keep every participant aligned."
                        tags={[
                            "RBAC",
                            "Assignments",
                            "Comments",
                        ]}
                    />

                    <Feature
                        number="02"
                        title="Respond"
                        text="Move incidents through a structured lifecycle while your team works on mitigation."
                        tags={[
                            "SEV-1 → SEV-4",
                            "Timeline",
                            "Real-time",
                        ]}
                    />

                    <Feature
                        number="03"
                        title="Understand"
                        text="Use incident history and analytics to understand where your systems and processes need improvement."
                        tags={[
                            "Analytics",
                            "Services",
                            "History",
                        ]}
                    />

                </div>

            </section>


            {/* CTA */}
            <section className="max-w-5xl mx-auto px-6 pb-24">

                <div className="group relative border border-white/[0.07] rounded-3xl bg-[#0c111a] px-8 py-16 sm:px-16 text-center overflow-hidden transition-all duration-500 hover:border-white/[0.12]">

                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent transition-all duration-500 group-hover:via-blue-400" />

                    <p className="text-xs uppercase tracking-widest text-blue-400">
                        Ready when things go wrong
                    </p>

                    <h2 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight">
                        Don't just detect the incident.
                        <br />
                        <span className="text-slate-500 transition-colors duration-500 group-hover:text-slate-400">
                            Control the response.
                        </span>
                    </h2>

                    <p className="mt-5 text-sm sm:text-base text-slate-500 max-w-lg mx-auto">
                        Give your engineering team one place to respond,
                        collaborate, and resolve production incidents.
                    </p>

                    <Link
                        href="/register"
                        className={`
                            group/button
                            inline-flex
                            items-center
                            gap-2
                            mt-8
                            px-7 py-3.5
                            rounded-lg
                            bg-white
                            text-slate-950
                            font-medium
                            transition-all duration-300
                            hover:-translate-y-1
                            hover:bg-slate-200
                            hover:shadow-[0_15px_35px_rgba(255,255,255,0.08)]
                            active:translate-y-0
                        `}
                    >
                        Get started

                        <span className="transition-transform duration-300 group-hover/button:translate-x-1">
                            →
                        </span>

                    </Link>

                </div>

            </section>


            {/* FOOTER */}
            <footer className="border-t border-white/[0.06]">

                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">

                    <p className="text-xs text-slate-700">
                        © 2026 IncidentFlow
                    </p>

                    <p className="text-xs text-slate-700">
                        Detect · Coordinate · Resolve · Learn
                    </p>

                </div>

            </footer>


            {/* ANIMATION KEYFRAMES */}
            <style>{`

                @keyframes fadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(24px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes eventIn {
    from {
        opacity: 0;
        transform: translateY(8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

                @keyframes timelineIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }

                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

            `}</style>

        </main>
    );
}


/* ---------------- COMPONENTS ---------------- */

function Avatar({ letter }) {
    return (
        <div
            className={`
                w-7 h-7
                rounded-full
                bg-slate-800
                border-2 border-[#0c111a]
                flex items-center justify-center
                text-[10px]
                font-semibold
                text-slate-300
                transition-all duration-300
                hover:-translate-y-1
                hover:bg-slate-700
                hover:border-blue-500/30
            `}
        >
            {letter}
        </div>
    );
}


function Feature({
    number,
    title,
    text,
    tags,
}) {
    return (
        <div
            className={`
    group
    rounded-2xl
    border border-white/[0.06]
    bg-white/[0.015]
    p-7
    transition-all duration-300
    hover:-translate-y-2
    hover:border-blue-500/20
    hover:bg-white/[0.025]
    hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)]
`}
        >

            <div className="flex items-center justify-between">

                <span className="text-[10px] font-mono text-slate-700">
                    {number}
                </span>

                <span className="text-slate-700 transition-all duration-300 group-hover:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1">
                    ↗
                </span>

            </div>


            <h3 className="mt-10 text-xl font-semibold transition-colors duration-300 group-hover:text-blue-400">
                {title}
            </h3>

            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                {text}
            </p>


            <div className="mt-7 flex flex-wrap gap-2">

                {tags.map((tag) => (

                    <span
                        key={tag}
                        className={`
    px-2.5 py-1
    rounded-md
    bg-slate-900
    border border-white/[0.05]
    text-[10px]
    text-slate-600
    transition-all duration-300
    group-hover:border-blue-500/10
    group-hover:text-slate-500
`}
                    >
                        {tag}
                    </span>

                ))}

            </div>

        </div>
    );
}