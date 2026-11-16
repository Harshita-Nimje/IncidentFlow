"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    LayoutDashboard,
    Siren,
    ChartNoAxesCombined,
    Server,
    Building2,
    Users,
    ChevronDown,
    ChevronRight,
    LogOut,
    ShieldCheck,
    Menu,
    X,
    Command,
    Radio,
    Settings2,
    CircleHelp,
} from "lucide-react";

export default function Sidebar({ organizations, activeOrganization, setActiveOrganization }) {
    const pathname = usePathname();

    const [user, setUser] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) return;

        try {
            setUser(JSON.parse(storedUser));
        } catch (error) {
            console.error("Invalid user data in localStorage:", error);
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        }
    }, []);

    // Close mobile drawer after navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Prevent background scrolling while drawer is open
    useEffect(() => {
        if (!mobileOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileOpen]);

    // Close drawer with Escape
    useEffect(() => {
        if (!mobileOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setMobileOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [mobileOpen]);

    const isPlatformAdmin = user?.role === "platform_admin";

    const isOrganizationAdmin =
        activeOrganization?.role?.toLowerCase() === "admin";

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const isRouteActive = (href) =>
        pathname === href || pathname.startsWith(`${href}/`);

    const initials = user?.name
        ? user.name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase()
        : "U";

    const navigation = [
        {
            label: "WORKSPACE",
            items: [
                {
                    name: "Dashboard",
                    href: isPlatformAdmin
                        ? "/platform-admin/dashboard"
                        : "/dashboard",
                    icon: LayoutDashboard,
                    description: "Overview",
                },
                {
                    name: "Incidents",
                    href: "/incidents",
                    icon: Siren,
                    description: "Incident tracking",
                },
                {
                    name: "Analytics",
                    href: "/analytics",
                    icon: ChartNoAxesCombined,
                    description: "Performance insights",
                },
                {
                    name: "Services",
                    href: "/services",
                    icon: Server,
                    description: "Manage services",
                },
                ...((isOrganizationAdmin || isPlatformAdmin)
                    ? [
                        {
                            name: "Members & Access",
                            href: "/organization-members",
                            icon: Users,
                            description: "Manage organization members",
                        },
                    ]
                    : []),
            ],
        },
    ];

    const sidebarContent = (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#21151A] text-[#E9E9DF]">

            {/* BRAND */}
            <div className="relative flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#2B1B21] px-5">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#FF6B1A]/30 bg-[#4B1B27] shadow-[0_4px_14px_rgba(0,0,0,0.2)]">
                        <div className="absolute inset-0 bg-[#FF6B1A]/10 blur-xl" />
                        <Activity
                            size={21}
                            strokeWidth={2.2}
                            className="relative text-[#FF8A48]"
                        />
                    </div>

                    <div>
                        <h1 className="text-[17px] font-bold tracking-[-0.7px] text-[#FFFEFA]">
                            IncidentFlow
                        </h1>

                        <div className="mt-0.5 flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-[#FF6B1A]" />
                            <p className="text-[9px] font-semibold uppercase tracking-[1.8px] text-[#B8AAA5]">
                                Command center
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#B8AAA5] transition hover:bg-white/[0.07] hover:text-[#FFFEFA] md:hidden"
                >
                    <X size={20} />
                </button>
            </div>

            {/* WORKSPACE SWITCHER */}
            <div className="shrink-0 px-4 pt-6">
                <button
                    type="button"
                    className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-[#2B1B21] p-3 text-left transition-all duration-200 hover:border-[#FF6B1A]/35 hover:bg-[#351D25]"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FF6B1A]/20 bg-[#4B1B27]">
                        <ShieldCheck
                            size={17}
                            className="text-[#FF8A48]"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold uppercase tracking-[1.4px] text-[#B8AAA5]">
                            {isPlatformAdmin ? "Platform access" : "Current workspace"}
                        </p>

                        <p className="mt-1 truncate text-xs font-semibold text-[#FFFEFA]">
                            {isPlatformAdmin
                                ? "Platform Administration"
                                : activeOrganization?.name || "Select workspace"}
                        </p>
                    </div>
                </button>
            </div>

            {/* NAVIGATION */}
            <nav className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-4 pb-6 pt-8 [scrollbar-width:thin] [scrollbar-color:#60434A_transparent]">
                {navigation.map((group) => (
                    <div key={group.label}>
                        <div className="mb-3 flex items-center justify-between px-3">
                            <p className="text-[9px] font-bold tracking-[1.8px] text-[#938785]">
                                {group.label}
                            </p>
                        </div>

                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const active = isRouteActive(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        aria-current={
                                            active ? "page" : undefined
                                        }
                                        className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 transition-all duration-200 ${active
                                            ? "border border-[#FF6B1A]/25 bg-[#4B1B27] text-[#FFFEFA] shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
                                            : "border border-transparent text-[#B8AAA5] hover:border-white/[0.06] hover:bg-[#2B1B21] hover:text-[#FFFEFA]"
                                            }`}
                                    >
                                        {active && (
                                            <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#FF6B1A] shadow-[0_0_10px_rgba(255,107,26,0.5)]" />
                                        )}

                                        <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${active
                                                ? "bg-[#FF6B1A]/15 text-[#FF8A48]"
                                                : "bg-transparent text-[#938785] group-hover:bg-[#4B1B27]/50 group-hover:text-[#FF8A48]"
                                                }`}
                                        >
                                            <Icon
                                                size={17}
                                                strokeWidth={
                                                    active ? 2.2 : 1.8
                                                }
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12px] font-semibold">
                                                {item.name}
                                            </p>
                                            <p
                                                className={`mt-0.5 text-[9px] ${active
                                                    ? "text-[#E9E9DF]/65"
                                                    : "text-[#938785] group-hover:text-[#B8AAA5]"
                                                    }`}
                                            >
                                                {item.description}
                                            </p>
                                        </div>

                                        {active ? (
                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6B1A] shadow-[0_0_8px_rgba(255,107,26,0.6)]" />
                                        ) : (
                                            <ChevronRight
                                                size={14}
                                                className="shrink-0 text-[#75646A] opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* ADMIN */}
                {isPlatformAdmin && (
                    <div>
                        <div className="mb-3 px-3">
                            <p className="text-[9px] font-bold tracking-[1.8px] text-[#938785]">
                                ADMINISTRATION
                            </p>
                        </div>

                        <Link
                            href="/admin/organizations"
                            onClick={() => setMobileOpen(false)}
                            aria-current={
                                isRouteActive("/admin/organizations")
                                    ? "page"
                                    : undefined
                            }
                            className={`group relative flex items-center gap-3 rounded-xl border px-3 py-3 transition-all duration-200 ${isRouteActive("/admin/organizations")
                                ? "border-[#FF6B1A]/25 bg-[#4B1B27] text-[#FFFEFA]"
                                : "border-transparent text-[#B8AAA5] hover:border-white/[0.06] hover:bg-[#2B1B21] hover:text-[#FFFEFA]"
                                }`}
                        >
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${isRouteActive("/admin/organizations")
                                    ? "bg-[#FF6B1A]/15 text-[#FF8A48]"
                                    : "bg-white/[0.035] text-[#938785] group-hover:text-[#FF8A48]"
                                    }`}
                            >
                                <Building2 size={17} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold">
                                    Organizations
                                </p>
                                <p
                                    className={`mt-0.5 text-[9px] ${isRouteActive("/admin/organizations")
                                        ? "text-[#E9E9DF]/65"
                                        : "text-[#938785]"
                                        }`}
                                >
                                    Manage workspaces
                                </p>
                            </div>

                            <ChevronRight
                                size={14}
                                className={
                                    isRouteActive("/admin/organizations")
                                        ? "text-[#FF8A48]"
                                        : "text-[#75646A]"
                                }
                            />
                        </Link>
                    </div>
                )}
            </nav>

            {/* BOTTOM AREA */}
            <div className="shrink-0">

                {/* SYSTEM STATUS */}
                <div className="mx-4 border-t border-white/[0.07] px-2 py-5">
                    <div className="flex items-center justify-between rounded-lg border border-[#39734E]/15 bg-[#39734E]/[0.09] px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                            </span>

                            <span className="text-[10px] font-medium text-[#B8AAA5]">
                                Workspace active
                            </span>
                        </div>

                        <Radio
                            size={14}
                            className="text-emerald-400/80"
                        />
                    </div>
                </div>

                {/* USER PROFILE */}
                <div className="border-t border-white/[0.07] p-4">
                    <div className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[#2B1B21]">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FF6B1A]/30 bg-[#4B1B27] text-xs font-bold text-[#FF8A48]">
                            {initials}
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#21151A] bg-emerald-400" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-[#FFFEFA]">
                                {user?.name || "User"}
                            </p>
                            <p className="mt-1 text-[10px] capitalize text-[#938785]">
                                {isPlatformAdmin
                                    ? "Platform Admin"
                                    : isOrganizationAdmin
                                        ? "Organization Admin"
                                        : "Member"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Logout"
                            aria-label="Logout"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#938785] transition hover:bg-red-500/10 hover:text-red-400"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#2B1B21]/60 px-6 py-3">
                    <span className="text-[9px] font-bold tracking-wide text-[#938785]">
                        INCIDENTFLOW
                    </span>
                    <span className="text-[9px] text-[#75646A]">
                        v1.0.0
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* MOBILE TOP BAR */}
            <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#21151A]/95 px-5 backdrop-blur-xl md:hidden">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF6B1A]/25 bg-[#4B1B27]">
                        <Activity size={19} className="text-[#FF8A48]" />
                    </div>

                    <div>
                        <span className="block text-[15px] font-bold tracking-tight text-[#FFFEFA]">
                            IncidentFlow
                        </span>
                        <span className="block text-[8px] font-semibold uppercase tracking-[1.5px] text-[#938785]">
                            Command center
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={mobileOpen}
                    aria-controls="mobile-navigation"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.035] text-[#E9E9DF] transition hover:border-[#FF6B1A]/35 hover:bg-[#4B1B27] hover:text-[#FF8A48]">
                    <Menu size={21} />
                </button>
            </header >

            {/* MOBILE OVERLAY */}
            {
                mobileOpen && (
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 z-40 bg-[#120B0E]/75 backdrop-blur-[3px] md:hidden"
                    />
                )
            }

            {/* DESKTOP SIDEBAR */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden h-screen w-64 flex-col border-r border-white/[0.07] bg-[#21151A] md:flex">
                {sidebarContent}
            </aside>

            {/* MOBILE DRAWER */}
            <aside
                id="mobile-navigation"
                aria-hidden={!mobileOpen}
                className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(300px,88vw)] flex-col overflow-hidden border-r border-white/[0.08] bg-[#21151A] shadow-2xl shadow-black/50 transition-transform duration-300 ease-out md:hidden ${mobileOpen
                    ? "translate-x-0"
                    : "-translate-x-full"
                    }`}
            >
                {sidebarContent}
            </aside>
        </>
    );
}