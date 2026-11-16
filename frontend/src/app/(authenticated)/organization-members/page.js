
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrganization } from "../../context/OrganizationContext";
// import { useSearchParams } from "next/navigation";
import {
    Users,
    UserPlus,
    KeyRound,
    Search,
    RefreshCw,
    ShieldCheck,
    Crown,
    CalendarDays,
    Building2,
    ArrowUpRight,
    Sparkles,
    UserRound,
    Filter,
    ChevronDown,
    Mail,
} from "lucide-react";

export default function OrganizationMembers() {
    const { activeOrganization } = useOrganization();
    // const searchParams = useSearchParams();

    const [userRole, setUserRole] = useState("");
    const [adminOrganizations, setAdminOrganizations] = useState([]);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
    const [activeTab, setActiveTab] = useState("members");
    const [joinTokens, setJoinTokens] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
    const [joinRequestsError, setJoinRequestsError] = useState("");
    const [tokensLoading, setTokensLoading] = useState(false);
    const [tokensError, setTokensError] = useState("");
    const [generatedToken, setGeneratedToken] = useState("");
    const [creatingToken, setCreatingToken] = useState(false);
    const [tokenExpiryHours, setTokenExpiryHours] = useState("48");
    const [tokenMaxUses, setTokenMaxUses] = useState("");
    const [members, setMembers] = useState([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [membersError, setMembersError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [tokenToRevoke, setTokenToRevoke] = useState(null);
    const [currentTime, setCurrentTime] = useState(Date.now());

    const filteredJoinRequests =
        userRole === "platform_admin"
            ? joinRequests.filter(
                (request) =>
                    String(request.organization_id) === String(selectedOrganizationId)
            )
            : joinRequests;

    const fetchMembers = useCallback(async () => {
        const organizationId =
            userRole === "platform_admin"
                ? selectedOrganizationId
                : activeOrganization?.id;

        if (!organizationId) {
            setMembers([]);
            return;
        }

        try {
            setMembersLoading(true);
            setMembersError("");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${organizationId}/members`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch members");
            }

            setMembers(data.members || []);
        } catch (error) {
            setMembersError(error.message);
        } finally {
            setMembersLoading(false);
        }
    }, [activeOrganization?.id, userRole, selectedOrganizationId]);

    const fetchJoinTokens = useCallback(async () => {
        const organizationId =
            userRole === "platform_admin"
                ? selectedOrganizationId
                : activeOrganization?.id;

        if (!organizationId) {
            setJoinTokens([]);
            return;
        }

        setTokensLoading(true);
        setTokensError("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/invitations/join-tokens/${organizationId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch join tokens");
            }

            setJoinTokens(data.tokens || []);
        } catch (error) {
            setTokensError(error.message);
            setJoinTokens([]);
        } finally {
            setTokensLoading(false);
        }
    }, [activeOrganization?.id, userRole, selectedOrganizationId]);

    const fetchJoinRequests = async () => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const isPlatformAdmin = storedUser?.role === "platform_admin";

        if (!isPlatformAdmin && !activeOrganization?.id) return;

        setJoinRequestsLoading(true);
        setJoinRequestsError("");

        try {
            const token = localStorage.getItem("token");

            const url = isPlatformAdmin
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${activeOrganization.id}/join-requests`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load join requests");
            }

            if (isPlatformAdmin) {
                setJoinRequests(
                    (data.pendingJoinRequests || []).map((request) => ({
                        ...request,
                        name: request.user_name,
                        email: request.user_email,
                    }))
                );
            } else {
                setJoinRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Fetch join requests error:", error);
            setJoinRequestsError(error.message);
        } finally {
            setJoinRequestsLoading(false);
        }
    };

    const handleReviewJoinRequest = async (requestId, status, organizationId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${organizationId}/join-requests/${requestId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to review join request");
            }

            await fetchJoinRequests();
        } catch (error) {
            console.error("Review join request error:", error);
            setJoinRequestsError(error.message);
        }
    };

    const handleCreateJoinToken = async () => {
        const organizationId =
            userRole === "platform_admin"
                ? selectedOrganizationId
                : activeOrganization?.id;

        if (!organizationId) return;

        setCreatingToken(true);
        setTokensError("");
        setGeneratedToken("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/invitations/join-token/${organizationId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        expires_in_hours: Number(tokenExpiryHours),
                        max_uses: tokenMaxUses === "" ? null : Number(tokenMaxUses),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create join token");
            }

            setGeneratedToken(data.token);
            await fetchJoinTokens();
        } catch (error) {
            setTokensError(error.message);
        } finally {
            setCreatingToken(false);
        }
    };

    const handleRevokeJoinToken = async (tokenId) => {
        const organizationId =
            userRole === "platform_admin"
                ? selectedOrganizationId
                : activeOrganization?.id;

        if (!organizationId) return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/invitations/${tokenId}/revoke`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to revoke join token");
            }

            await fetchJoinTokens();
        } catch (error) {
            setTokensError(error.message);
        }
    };

    useEffect(() => {
        if (userRole !== "platform_admin") return;

        const fetchAdminOrganizations = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch organizations");
                }

                setAdminOrganizations(data.organizations || []);
            } catch (error) {
                console.error("Fetch organizations error:", error);
            }
        };

        fetchAdminOrganizations();
    }, [userRole]);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        setUserRole(storedUser?.role || "");
    }, []);

    useEffect(() => {
        if (activeTab === "members") {
            fetchMembers();
        }

        if (activeTab === "tokens") {
            fetchJoinTokens();
        }

        if (activeTab === "requests") {
            fetchJoinRequests();
        }
    }, [
        activeTab,
        activeOrganization?.id,
        fetchMembers,
        fetchJoinTokens,
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const filteredMembers = useMemo(() => {
        return members.filter((member) => {
            const query = searchQuery.toLowerCase();

            const matchesSearch =
                member.name?.toLowerCase().includes(query) ||
                member.email?.toLowerCase().includes(query);

            const matchesRole =
                roleFilter === "all" ||
                member.role?.toLowerCase() === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [members, searchQuery, roleFilter]);

    const adminCount = members.filter(
        (member) => member.role?.toLowerCase() === "admin"
    ).length;

    const memberCount = members.length - adminCount;

    const tabs = [
        {
            id: "members",
            label: "Members",
            description: "Manage your team",
            icon: Users,
        },
        {
            id: "requests",
            label: "Join Requests",
            description: "Review applications",
            icon: UserPlus,
        },
        {
            id: "tokens",
            label: "Invite Tokens",
            description: "Control organization access",
            icon: KeyRound,
        },
    ];

    const getInitials = (name) => {
        if (!name) return "U";

        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();
    };

    const formatDate = (date) => {
        if (!date) return "Not available";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "Not available";

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    useEffect(() => {
        if (
            userRole === "platform_admin" &&
            !selectedOrganizationId &&
            adminOrganizations.length > 0
        ) {
            setSelectedOrganizationId(
                String(activeOrganization?.id || adminOrganizations[0].id)
            );
        }
    }, [
        userRole,
        adminOrganizations,
        selectedOrganizationId,
        activeOrganization?.id,
    ]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const requestedTab = params.get("tab");
        const requestedOrganizationId = params.get("organization_id");

        if (["members", "requests", "tokens"].includes(requestedTab)) {
            setActiveTab(requestedTab);
        }

        if (
            userRole === "platform_admin" &&
            requestedOrganizationId &&
            adminOrganizations.some(
                (organization) =>
                    String(organization.id) === requestedOrganizationId
            )
        ) {
            setSelectedOrganizationId(requestedOrganizationId);
        }
    }, [userRole, adminOrganizations]);

    return (
        <div className="organization-access-theme min-h-screen bg-[#E9E9DF] px-4 py-6 text-[#35151F] sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1500px]">

                {/* HEADER */}
                <div className="access-hero mb-8 flex flex-col justify-between gap-5 rounded-[28px] p-6 sm:p-8 lg:flex-row lg:items-end">
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                                <Building2 size={16} className="text-blue-400" />
                            </div>

                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">
                                Organization Management
                            </span>

                            <span className="rounded-full border border-[#263449] bg-[#111c2e] px-2.5 py-1 text-[10px] font-semibold text-gray-400">
                                ACCESS CONTROL
                            </span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Members & Access
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                            Manage your organization, control team access, and
                            oversee membership activity from one place.
                        </p>

                        {activeOrganization?.name && (
                            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#293950] bg-[#111c2e] px-3 py-2">
                                <Building2 size={14} className="text-blue-400" />
                                <span className="text-sm font-medium text-gray-200">
                                    {activeOrganization.name}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden items-center gap-2 rounded-lg border border-[#263449] bg-[#111c2e] px-3 py-2.5 sm:flex">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-xs text-gray-400">
                                Organization workspace
                            </span>
                        </div>

                        <button
                            onClick={fetchMembers}
                            disabled={
                                membersLoading ||
                                (userRole === "platform_admin"
                                    ? !selectedOrganizationId
                                    : !activeOrganization?.id)
                            }
                            className="flex items-center justify-center gap-2 rounded-lg border border-[#30415b] bg-[#172337] px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:border-blue-500/50 hover:bg-[#1c2c44] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                size={15}
                                className={membersLoading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* STATISTICS */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-[#263449] bg-[#111c2e] p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-400">
                                    Total Members
                                </p>
                                <h2 className="mt-3 text-3xl font-bold tabular-nums">
                                    {membersLoading ? "—" : members.length}
                                </h2>
                            </div>
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                                <Users size={19} className="text-blue-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 border-t border-[#263449] pt-3">
                            <span className="text-xs text-gray-500">
                                Registered organization members
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#263449] bg-[#111c2e] p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-400">
                                    Administrators
                                </p>
                                <h2 className="mt-3 text-3xl font-bold tabular-nums">
                                    {membersLoading ? "—" : adminCount}
                                </h2>
                            </div>
                            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
                                <ShieldCheck size={19} className="text-purple-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 border-t border-[#263449] pt-3">
                            <span className="text-xs text-gray-500">
                                Members with admin privileges
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#263449] bg-[#111c2e] p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-400">
                                    Regular Members
                                </p>
                                <h2 className="mt-3 text-3xl font-bold tabular-nums">
                                    {membersLoading ? "—" : memberCount}
                                </h2>
                            </div>
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                                <UserRound size={19} className="text-emerald-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 border-t border-[#263449] pt-3">
                            <span className="text-xs text-gray-500">
                                Standard organization access
                            </span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-[#263449] bg-[#111c2e] p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-400">
                                    Access Management
                                </p>
                                <h2 className="mt-3 text-xl font-bold">
                                    Centralized
                                </h2>
                            </div>
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                                <KeyRound size={19} className="text-amber-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 border-t border-[#263449] pt-3">
                            <span className="text-xs text-gray-500">
                                Members, requests and invitations
                            </span>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="access-main-panel overflow-hidden rounded-2xl border border-[#263449] bg-[#111c2e]">

                    {/* TAB NAVIGATION */}
                    <div className="access-tab-bar border-b border-[#263449] px-4 pt-4 sm:px-6">
                        <div className="flex flex-wrap gap-2 sm:gap-6">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-3 text-left transition sm:px-2 ${isActive
                                            ? "bg-blue-500/10 text-blue-400 sm:bg-transparent"
                                            : "text-gray-400 hover:bg-[#172337] hover:text-gray-200 sm:hover:bg-transparent"
                                            }`}
                                    >
                                        <div
                                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive
                                                ? "bg-blue-500/15"
                                                : "bg-[#1a293e] group-hover:bg-[#22344e]"
                                                }`}
                                        >
                                            <Icon size={17} />
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold">
                                                {tab.label}
                                            </p>
                                            <p className="mt-0.5 hidden text-[10px] text-gray-500 sm:block">
                                                {tab.description}
                                            </p>
                                        </div>

                                        {isActive && (
                                            <span className="absolute bottom-[-1px] left-0 right-0 hidden h-[2px] rounded-full bg-blue-400 sm:block" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* MEMBERS TAB */}
                    {activeTab === "members" && (
                        <div className="p-4 sm:p-6">
                            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                                <div>
                                    <h2 className="text-lg font-bold">
                                        Organization Members
                                    </h2>
                                    <p className="mt-1 text-xs text-gray-400">
                                        View the people who have access to this workspace.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {userRole === "platform_admin" && (
                                        <div className="relative min-w-[210px]">
                                            <Building2
                                                size={15}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                                            />
                                            <div className="relative">
                                                <Building2 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#4B1B27]" />

                                                <div className="relative">
                                                    <Building2 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#4B1B27]" />

                                                    <select
                                                        value={selectedOrganizationId}
                                                        onChange={(e) => setSelectedOrganizationId(e.target.value)}
                                                        className="w-full cursor-pointer appearance-none rounded-xl border border-[#4B1B27]/15 bg-[#FFFEFA] py-3 pl-10 pr-11 text-xs font-semibold tracking-wide text-[#4B1B27] shadow-[0_4px_14px_rgba(75,27,39,0.06)] outline-none transition-all duration-200 hover:border-[#4B1B27]/40 hover:shadow-[0_6px_18px_rgba(75,27,39,0.1)] focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10"
                                                    >
                                                        <option value="">Select Organization</option>
                                                        {adminOrganizations.map((organization) => (
                                                            <option
                                                                key={organization.id}
                                                                value={String(organization.id)}
                                                            >
                                                                {organization.name}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B1B27]" />
                                                </div>

                                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B1B27]" />
                                            </div>
                                            <ChevronDown
                                                size={13}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                        </div>
                                    )}

                                    <div className="relative min-w-[190px] flex-1 sm:flex-none">
                                        <Search
                                            size={15}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                                        />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search members..."
                                            className="w-full rounded-lg border border-[#30415b] bg-[#0b1627] py-2.5 pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500/60 sm:w-56"
                                        />
                                    </div>

                                    <div className="relative">
                                        <Filter className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#4B1B27]" />

                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="cursor-pointer appearance-none rounded-xl border border-[#4B1B27]/15 bg-[#FFFEFA] py-3 pl-9 pr-10 text-xs font-semibold tracking-wide text-[#4B1B27] shadow-[0_4px_14px_rgba(75,27,39,0.06)] outline-none transition-all duration-200 hover:border-[#4B1B27]/40 hover:shadow-[0_6px_18px_rgba(75,27,39,0.1)] focus:border-[#FF6B1A] focus:ring-4 focus:ring-[#FF6B1A]/10"
                                        >
                                            <option value="all">All Roles</option>
                                            <option value="admin">Admin</option>
                                            <option value="member">Member</option>
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B1B27]" />
                                    </div>
                                </div>
                            </div>

                            {/* MEMBER DIRECTORY */}
                            <div className="overflow-hidden rounded-xl border border-[#263449]">
                                <div className="flex items-center justify-between border-b border-[#263449] bg-[#152238] px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Users size={15} className="text-blue-400" />
                                        <span className="text-xs font-semibold text-gray-200">
                                            Member Directory
                                        </span>
                                    </div>
                                    <span className="rounded-md border border-[#30415b] bg-[#111c2e] px-2.5 py-1 text-[10px] font-semibold text-gray-400">
                                        {filteredMembers.length} RESULTS
                                    </span>
                                </div>

                                {membersLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <RefreshCw size={25} className="animate-spin text-blue-400" />
                                        <p className="mt-4 text-sm text-gray-400">
                                            Loading organization members...
                                        </p>
                                    </div>
                                ) : membersError ? (
                                    <div className="px-5 py-12 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                                            <ShieldCheck size={21} className="text-red-400" />
                                        </div>
                                        <p className="mt-4 text-sm font-semibold text-gray-200">
                                            Unable to load members
                                        </p>
                                        <p className="mt-2 text-xs text-red-400">
                                            {membersError}
                                        </p>
                                        <button
                                            onClick={fetchMembers}
                                            className="mt-5 rounded-lg border border-[#30415b] bg-[#172337] px-4 py-2 text-xs font-semibold text-gray-200 transition hover:border-blue-500/50"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                ) : (
                                    userRole === "platform_admin"
                                        ? !selectedOrganizationId
                                        : !activeOrganization?.id
                                ) ? (
                                    <div className="px-5 py-14 text-center">
                                        <Building2 size={28} className="mx-auto text-gray-500" />
                                        <p className="mt-4 text-sm font-semibold text-gray-200">
                                            No organization selected
                                        </p>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Select an organization to view its members.
                                        </p>
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div className="px-5 py-14 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#30415b] bg-[#172337]">
                                            <Search size={20} className="text-gray-400" />
                                        </div>
                                        <p className="mt-4 text-sm font-semibold text-gray-200">
                                            No members found
                                        </p>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Try changing your search or role filter.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setRoleFilter("all");
                                            }}
                                            className="mt-4 text-xs font-semibold text-blue-400 transition hover:text-blue-300"
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="hidden overflow-x-auto md:block">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b border-[#263449] bg-[#101b2d] text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                        <th className="px-5 py-4">Member</th>
                                                        <th className="px-5 py-4">Role & Access</th>
                                                        <th className="px-5 py-4">Date Joined</th>
                                                        <th className="px-5 py-4 text-right">Account</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredMembers.map((member) => {
                                                        const isAdmin =
                                                            member.role?.toLowerCase() === "admin";

                                                        return (
                                                            <tr
                                                                key={member.id}
                                                                className="border-b border-[#263449] last:border-0 transition hover:bg-[#172337]/70"
                                                            >
                                                                <td className="px-5 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${isAdmin
                                                                            ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                                                                            : "border-blue-500/20 bg-blue-500/10 text-blue-300"
                                                                            }`}>
                                                                            {getInitials(member.name)}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-sm font-semibold text-gray-100">
                                                                                {member.name || "Unnamed User"}
                                                                            </p>
                                                                            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                                                                <Mail size={11} />
                                                                                {member.email}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-semibold ${isAdmin
                                                                        ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                                                                        : "border-blue-500/20 bg-blue-500/10 text-blue-300"
                                                                        }`}>
                                                                        {isAdmin ? <Crown size={11} /> : <UserRound size={11} />}
                                                                        {member.role || "Member"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                                        <CalendarDays size={13} className="text-gray-500" />
                                                                        {formatDate(member.joined_at)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4 text-right">
                                                                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-400">
                                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                                        Registered
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* MOBILE MEMBER CARDS */}
                                        <div className="divide-y divide-[#263449] md:hidden">
                                            {filteredMembers.map((member) => {
                                                const isAdmin =
                                                    member.role?.toLowerCase() === "admin";

                                                return (
                                                    <div
                                                        key={member.id}
                                                        className="flex flex-col gap-4 p-4"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${isAdmin
                                                                ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                                                                : "border-blue-500/20 bg-blue-500/10 text-blue-300"
                                                                }`}>
                                                                {getInitials(member.name)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-gray-100">
                                                                    {member.name || "Unnamed User"}
                                                                </p>
                                                                <p className="mt-1 truncate text-xs text-gray-500">
                                                                    {member.email}
                                                                </p>
                                                            </div>
                                                            <ArrowUpRight size={15} className="text-gray-600" />
                                                        </div>
                                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                                            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-semibold ${isAdmin
                                                                ? "border-purple-500/20 bg-purple-500/10 text-purple-300"
                                                                : "border-blue-500/20 bg-blue-500/10 text-blue-300"
                                                                }`}>
                                                                {isAdmin ? <Crown size={11} /> : <UserRound size={11} />}
                                                                {member.role || "Member"}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                                <CalendarDays size={12} />
                                                                Joined {formatDate(member.joined_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-4 flex flex-col justify-between gap-2 text-[11px] text-gray-500 sm:flex-row sm:items-center">
                                <p>
                                    Showing {filteredMembers.length} of {members.length} organization members
                                </p>
                                <p className="flex items-center gap-1.5">
                                    <ShieldCheck size={12} className="text-emerald-400" />
                                    Organization access overview
                                </p>
                            </div>
                        </div>
                    )}

                    {/* JOIN REQUESTS TAB */}
                    {activeTab === "requests" && (
                        <div className="p-6 sm:p-10">
                            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <h3 className="text-sm font-bold text-white">
                                        Organization Requests
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Select an organization to view its pending requests.
                                    </p>
                                </div>

                                {userRole === "platform_admin" && (
                                    <div className="relative min-w-[210px]">
                                        <Building2
                                            size={15}
                                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                                        />
                                        <select
                                            value={selectedOrganizationId}
                                            onChange={(e) => setSelectedOrganizationId(e.target.value)}
                                            className="w-full appearance-none rounded-lg border border-blue-500/20 bg-[#111c2e] py-2.5 pl-10 pr-9 text-xs font-medium text-gray-200 outline-none transition hover:border-blue-400/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                        >
                                            <option value="">Select Organization</option>
                                            {adminOrganizations.map((organization) => (
                                                <option
                                                    key={organization.id}
                                                    value={String(organization.id)}
                                                >
                                                    {organization.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown
                                            size={13}
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="overflow-hidden rounded-2xl border border-[#30415b] bg-[#111c2e]">
                                <div className="flex flex-col justify-between gap-3 border-b border-[#26364d] px-5 py-5 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">
                                            Pending Join Requests
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Review users requesting access to this organization.
                                        </p>
                                    </div>
                                    <button
                                        onClick={fetchJoinRequests}
                                        disabled={joinRequestsLoading}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#30415b] bg-[#172337] px-4 py-2.5 text-xs font-semibold text-gray-300 transition hover:border-blue-500/40 hover:text-white disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            size={14}
                                            className={joinRequestsLoading ? "animate-spin" : ""}
                                        />
                                        Refresh requests
                                    </button>
                                </div>

                                {joinRequestsError && (
                                    <div className="m-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                        {joinRequestsError}
                                    </div>
                                )}

                                {joinRequestsLoading ? (
                                    <div className="flex items-center justify-center gap-3 py-12 text-sm text-gray-400">
                                        <RefreshCw size={16} className="animate-spin" />
                                        Loading join requests...
                                    </div>
                                ) : filteredJoinRequests.length === 0 ? (
                                    <div className="px-5 py-12 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#30415b] bg-[#172337]">
                                            <Users size={21} className="text-gray-500" />
                                        </div>
                                        <h4 className="mt-4 text-sm font-bold text-white">
                                            No pending requests
                                        </h4>
                                        <p className="mt-2 text-xs text-gray-500">
                                            New organization access requests will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#26364d]">
                                        {filteredJoinRequests.map((request) => (
                                            <div
                                                key={request.id}
                                                className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                                                        <UserRound size={18} className="text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white">
                                                            {request.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-400">
                                                            {request.email}
                                                        </p>
                                                        <p className="mt-1 text-[10px] text-gray-500">
                                                            Requested {new Date(request.requested_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleReviewJoinRequest(
                                                                request.id,
                                                                "rejected",
                                                                request.organization_id
                                                            )
                                                        }
                                                        className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleReviewJoinRequest(
                                                                request.id,
                                                                "approved",
                                                                request.organization_id
                                                            )
                                                        }
                                                        className="rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-[#07130d] transition hover:bg-emerald-400"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* INVITE TOKENS TAB */}
                    {activeTab === "tokens" && (
                        <div className="space-y-6 p-5 sm:p-7 lg:p-8">
                            {/* HEADER */}
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                                        <KeyRound size={13} />
                                        Organization access
                                    </div>
                                    <h2 className="mt-2 text-xl font-bold text-white">
                                        Invitation Tokens
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-400">
                                        Create and manage secure tokens for joining this organization.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {userRole === "platform_admin" && (
                                        <div className="relative min-w-[210px]">
                                            <Building2
                                                size={15}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                                            />
                                            <select
                                                value={selectedOrganizationId}
                                                onChange={(e) => setSelectedOrganizationId(e.target.value)}
                                                className="w-full appearance-none rounded-xl border border-blue-500/20 bg-[#111c2e] py-2.5 pl-10 pr-9 text-xs font-medium text-gray-200 outline-none transition hover:border-blue-400/40 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                            >
                                                <option value="">Select Organization</option>
                                                {adminOrganizations.map((organization) => (
                                                    <option
                                                        key={organization.id}
                                                        value={String(organization.id)}
                                                    >
                                                        {organization.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown
                                                size={13}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={fetchJoinTokens}
                                        disabled={tokensLoading}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#30415b] bg-[#172337] px-4 py-2.5 text-xs font-semibold text-gray-300 transition hover:border-amber-500/40 hover:text-white disabled:opacity-50"
                                    >
                                        <RefreshCw
                                            size={14}
                                            className={tokensLoading ? "animate-spin" : ""}
                                        />
                                        Refresh tokens
                                    </button>
                                </div>
                            </div>

                            {/* SUMMARY CARDS */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="rounded-2xl border border-[#26364d] bg-[#111c2e] p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        Total tokens
                                    </p>
                                    <p className="mt-3 text-3xl font-bold text-white">
                                        {joinTokens.length}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Tokens generated for this organization
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-[#26364d] bg-[#111c2e] p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        Active tokens
                                    </p>
                                    <p className="mt-3 text-3xl font-bold text-emerald-400">
                                        {joinTokens.filter(
                                            (token) =>
                                                token.status === "pending" &&
                                                new Date(token.expires_at) > new Date() &&
                                                (token.max_uses === null ||
                                                    token.used_count < token.max_uses)
                                        ).length}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Available for new members
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-[#26364d] bg-[#111c2e] p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        Successful joins
                                    </p>
                                    <p className="mt-3 text-3xl font-bold text-blue-400">
                                        {joinTokens.reduce(
                                            (total, token) => total + Number(token.used_count || 0),
                                            0
                                        )}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Total members added through tokens
                                    </p>
                                </div>
                            </div>

                            {/* CREATE TOKEN */}
                            <div className="overflow-hidden rounded-2xl border border-[#30415b] bg-[#111c2e]">
                                <div className="border-b border-[#26364d] px-5 py-5 sm:px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                                            <KeyRound size={19} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">
                                                Generate new join token
                                            </h3>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Configure how long the token remains valid and how many times it can be used.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5 p-5 sm:p-6">
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-gray-300">
                                                Token expiration
                                            </label>
                                            <select
                                                value={tokenExpiryHours}
                                                onChange={(e) => setTokenExpiryHours(e.target.value)}
                                                className="w-full rounded-xl border border-[#30415b] bg-[#0b1423] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-500/60"
                                            >
                                                <option value="1">1 hour</option>
                                                <option value="6">6 hours</option>
                                                <option value="12">12 hours</option>
                                                <option value="24">24 hours</option>
                                                <option value="48">48 hours</option>
                                                <option value="72">3 days</option>
                                                <option value="168">7 days</option>
                                                <option value="720">30 days</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-xs font-semibold text-gray-300">
                                                Maximum usage
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={tokenMaxUses}
                                                onChange={(e) => setTokenMaxUses(e.target.value)}
                                                placeholder="Unlimited usage"
                                                className="w-full rounded-xl border border-[#30415b] bg-[#0b1423] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-amber-500/60"
                                            />
                                            <p className="mt-2 text-[11px] text-gray-500">
                                                Leave empty to allow unlimited uses.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#30415b] bg-[#0b1423] p-4 sm:flex-row sm:items-center">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-200">
                                                Member access
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Anyone with this token can join as an organization member.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleCreateJoinToken}
                                            disabled={
                                                creatingToken ||
                                                (userRole === "platform_admin"
                                                    ? !selectedOrganizationId
                                                    : !activeOrganization?.id)
                                            }
                                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-[#111827] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <KeyRound size={15} />
                                            {creatingToken ? "Generating..." : "Generate token"}
                                        </button>
                                    </div>

                                    {/* GENERATED TOKEN */}
                                    {generatedToken && (
                                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-400">
                                                        Token generated successfully
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-gray-400">
                                                        Copy and share this token. It will not be shown again after leaving this page.
                                                    </p>
                                                </div>
                                                <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                                                    NEW
                                                </span>
                                            </div>

                                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                                <div className="min-w-0 flex-1 break-all rounded-lg border border-[#30415b] bg-[#0b1423] px-4 py-3 font-mono text-xs text-gray-200">
                                                    {generatedToken}
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(generatedToken);
                                                    }}
                                                    className="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20"
                                                >
                                                    Copy token
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ERROR */}
                            {tokensError && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                    {tokensError}
                                </div>
                            )}

                            {/* TOKEN LIST */}
                            <div className="overflow-hidden rounded-2xl border border-[#26364d] bg-[#111c2e]">
                                <div className="flex flex-col justify-between gap-3 border-b border-[#26364d] px-5 py-5 sm:flex-row sm:items-center">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">
                                            Generated tokens
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-500">
                                            Monitor usage, expiration, and access status.
                                        </p>
                                    </div>
                                    <span className="w-fit rounded-lg border border-[#30415b] bg-[#172337] px-3 py-1.5 text-[11px] font-semibold text-gray-400">
                                        {joinTokens.length} total
                                    </span>
                                </div>

                                {tokensLoading ? (
                                    <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-400">
                                        <RefreshCw size={16} className="animate-spin" />
                                        Loading invitation tokens...
                                    </div>
                                ) : joinTokens.length === 0 ? (
                                    <div className="px-5 py-16 text-center">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#30415b] bg-[#172337]">
                                            <KeyRound size={23} className="text-gray-500" />
                                        </div>
                                        <h4 className="mt-4 text-sm font-bold text-white">
                                            No join tokens yet
                                        </h4>
                                        <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-gray-500">
                                            Generate your first organization token to allow new members to join.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#26364d]">
                                        {joinTokens.map((token) => {
                                            const expired =
                                                new Date(token.expires_at).getTime() <= currentTime;

                                            const limitReached =
                                                token.max_uses !== null &&
                                                token.used_count >= token.max_uses;

                                            const isActive =
                                                token.status === "pending" &&
                                                !expired &&
                                                !limitReached;

                                            return (
                                                <div
                                                    key={token.id}
                                                    className="flex flex-col gap-4 p-5 transition hover:bg-[#172337]/50 sm:p-6"
                                                >
                                                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#30415b] bg-[#172337]">
                                                                <KeyRound size={17} className="text-amber-400" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white">
                                                                    Join Token #{token.id}
                                                                </p>
                                                                <p className="mt-1 text-[11px] text-gray-500">
                                                                    Created {new Date(token.created_at).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span
                                                            className={`w-fit rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isActive
                                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                                                : expired
                                                                    ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                                                    : "border-gray-500/20 bg-gray-500/10 text-gray-400"
                                                                }`}
                                                        >
                                                            {isActive
                                                                ? "Active"
                                                                : expired
                                                                    ? "Expired"
                                                                    : limitReached
                                                                        ? "Limit reached"
                                                                        : token.status}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                        <div className="rounded-xl border border-[#26364d] bg-[#0b1423] p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                                Usage
                                                            </p>
                                                            <p className="mt-2 text-sm font-bold text-white">
                                                                {token.used_count || 0}
                                                                <span className="ml-1 text-xs font-medium text-gray-500">
                                                                    / {token.max_uses ?? "Unlimited"}
                                                                </span>
                                                            </p>
                                                        </div>

                                                        <div className="rounded-xl border border-[#26364d] bg-[#0b1423] p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                                Expires
                                                            </p>
                                                            <p className="mt-2 text-xs font-semibold text-gray-200">
                                                                {new Date(token.expires_at).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        <div className="rounded-xl border border-[#26364d] bg-[#0b1423] p-3">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                                Token ID
                                                            </p>
                                                            <p className="mt-2 text-sm font-bold text-gray-200">
                                                                #{token.id}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {isActive && (
                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() => setTokenToRevoke(token)}
                                                                className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2 text-xs font-semibold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10"
                                                            >
                                                                Revoke token
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* SECURITY NOTE */}
                            <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-400" />
                                <div>
                                    <p className="text-xs font-bold text-gray-200">
                                        Security information
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-gray-500">
                                        Join tokens grant organization membership. Share them only with trusted people.
                                        Revoking a token prevents future use but does not remove existing members.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="mt-5 flex flex-col justify-between gap-2 text-[10px] text-gray-600 sm:flex-row sm:items-center">
                    <p>IncidentFlow / Organization Access Management</p>
                    <p>Manage your workspace membership and access controls.</p>
                </div>
            </div>

            {/* REVOKE TOKEN MODAL */}
            {tokenToRevoke && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-[#263449] bg-[#101827] p-6 shadow-2xl">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                            <ShieldCheck size={23} className="text-red-400" />
                        </div>

                        <h2 className="text-lg font-bold text-white">
                            Revoke join token?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Are you sure you want to revoke this token? Anyone who has
                            this token will no longer be able to use it to join this
                            organization.
                        </p>

                        <div className="mt-7 flex justify-end gap-3">
                            <button
                                onClick={() => setTokenToRevoke(null)}
                                className="rounded-lg border border-[#334155] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={async () => {
                                    await handleRevokeJoinToken(tokenToRevoke.id);
                                    setTokenToRevoke(null);
                                }}
                                className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                            >
                                Revoke token
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 60 / 30 / 10 LIGHT THEME */}
            <style jsx global>{`
                .organization-access-theme {
                    background: #e9e9df;
                    color: #35151f;
                }

                

                /* -----------------------------------------
                   30% — BURGUNDY HERO
                ----------------------------------------- */

                .organization-access-theme .access-hero {
                    position: relative;
                    isolation: isolate;
                    overflow: hidden;
                    color: #fffefa;
                    background:
                        radial-gradient(
                            circle at 88% 12%,
                            rgba(255, 107, 26, 0.2),
                            transparent 28%
                        ),
                        linear-gradient(
                            125deg,
                            #35151f 0%,
                            #4b1b27 58%,
                            #602b37 100%
                        );
                    border: 1px solid rgba(75, 27, 39, 0.22);
                    box-shadow: 0 18px 45px rgba(53, 21, 31, 0.12);
                }

                .organization-access-theme .access-hero::before,
                .organization-access-theme .access-hero::after {
                    content: "";
                    position: absolute;
                    z-index: -1;
                    pointer-events: none;
                    border: 1px solid rgba(255, 254, 250, 0.09);
                    border-radius: 9999px;
                }

                .organization-access-theme .access-hero::before {
                    width: 340px;
                    height: 340px;
                    right: -100px;
                    top: -190px;
                }

                .organization-access-theme .access-hero::after {
                    width: 240px;
                    height: 240px;
                    right: -50px;
                    top: -140px;
                }

                .organization-access-theme .access-hero h1 {
                    color: #fffefa !important;
                    letter-spacing: -0.045em;
                }

                .organization-access-theme .access-hero p {
                    color: rgba(255, 254, 250, 0.68) !important;
                }

                .organization-access-theme .access-hero .text-gray-200,
                .organization-access-theme .access-hero .text-gray-400 {
                    color: #fffefa !important;
                }

                .organization-access-theme .access-hero [class*="text-blue-"] {
                    color: #ff9a62 !important;
                }

                .organization-access-theme .access-hero [class*="bg-[#111c2e]"] {
                    background: rgba(255, 254, 250, 0.09) !important;
                    border-color: rgba(255, 254, 250, 0.15) !important;
                }

                .organization-access-theme .access-hero button {
                    border-color: rgba(255, 254, 250, 0.2) !important;
                    background: #ff6b1a !important;
                    color: #35151f !important;
                    box-shadow: 0 8px 22px rgba(255, 107, 26, 0.16);
                }

                .organization-access-theme .access-hero button:hover {
                    background: #ff8542 !important;
                }

                /* -----------------------------------------
                   30% — BURGUNDY MAIN STRUCTURE
                ----------------------------------------- */

                .organization-access-theme .access-main-panel {
                    background: #4b1b27 !important;
                    border-color: rgba(75, 27, 39, 0.25) !important;
                    box-shadow: 0 18px 45px rgba(53, 21, 31, 0.1);
                }

                .organization-access-theme .access-tab-bar {
                    background: #4b1b27;
                    border-color: rgba(255, 254, 250, 0.13) !important;
                }

                .organization-access-theme .access-tab-bar button {
                    color: rgba(255, 254, 250, 0.66);
                }

                .organization-access-theme .access-tab-bar button:hover {
                    color: #fffefa;
                }

                .organization-access-theme .access-tab-bar button[class*="bg-blue-500/10"] {
    color: #4b1b27 !important;
    background: #e9e9df !important;
    border-color: rgba(255, 254, 250, 0.2) !important;
}

.organization-access-theme .access-tab-bar button[class*="bg-blue-500/10"] svg {
    color: #4b1b27 !important;
}

.organization-access-theme .access-tab-bar button[class*="bg-blue-500/10"] [class*="bg-blue-500/15"] {
    background: rgba(75, 27, 39, 0.1) !important;
    color: #4b1b27 !important;
}

                .organization-access-theme .access-tab-bar button span {
                    background: #ff6b1a !important;
                }

                /* -----------------------------------------
                   60% — CREAM SURFACES
                ----------------------------------------- */

                .organization-access-theme [class~="bg-[#111c2e]"],
                .organization-access-theme [class~="bg-[#101827]"] {
                    background-color: #fffefa !important;
                }

                .organization-access-theme [class~="bg-[#152238]"],
                .organization-access-theme [class~="bg-[#101b2d]"],
                .organization-access-theme [class~="bg-[#172337]"],
                .organization-access-theme [class~="bg-[#1a293e]"],
                .organization-access-theme [class~="bg-[#22344e]"] {
                    background-color: #f3f0e8 !important;
                }

                .organization-access-theme [class~="bg-[#0b1627]"],
                .organization-access-theme [class~="bg-[#0b1423]"] {
                    background-color: #f8f6f0 !important;
                }

                /* Borders */
                .organization-access-theme [class*="border-[#263449]"],
                .organization-access-theme [class*="border-[#26364d]"],
                .organization-access-theme [class*="border-[#30415b]"],
                .organization-access-theme [class*="border-[#293950]"],
                .organization-access-theme [class*="border-[#334155]"] {
                    border-color: rgba(75, 27, 39, 0.12) !important;
                }

                .organization-access-theme [class*="divide-[#263449]"],
                .organization-access-theme [class*="divide-[#26364d]"] {
                    border-color: rgba(75, 27, 39, 0.1) !important;
                }

                /* -----------------------------------------
                   TYPOGRAPHY
                ----------------------------------------- */

                .organization-access-theme .text-white,
                .organization-access-theme .text-gray-100,
                .organization-access-theme .text-gray-200,
                .organization-access-theme .text-gray-300,
                .organization-access-theme .text-slate-300 {
                    color: #35151f !important;
                }

                .organization-access-theme .text-gray-400,
                .organization-access-theme .text-slate-400 {
                    color: #766b64 !important;
                }

                .organization-access-theme .text-gray-500,
                .organization-access-theme .text-gray-600,
                .organization-access-theme .text-gray-700,
                .organization-access-theme .text-slate-500,
                .organization-access-theme .text-slate-600 {
                    color: #94877e !important;
                }

                .organization-access-theme h2,
                .organization-access-theme h3,
                .organization-access-theme h4 {
                    color: #35151f;
                }

                /* -----------------------------------------
                   BURGUNDY ACCENTS
                ----------------------------------------- */

                .organization-access-theme .text-blue-300,
                .organization-access-theme .text-blue-400 {
                    color: #4b1b27 !important;
                }

                .organization-access-theme .bg-blue-500,
                .organization-access-theme .bg-blue-600 {
                    background-color: #4b1b27 !important;
                    color: #fffefa !important;
                }

                .organization-access-theme [class*="bg-blue-500/"],
                .organization-access-theme [class*="bg-blue-400/"] {
                    background-color: rgba(75, 27, 39, 0.08) !important;
                }

                .organization-access-theme [class*="border-blue-"] {
                    border-color: rgba(75, 27, 39, 0.2) !important;
                }

                .organization-access-theme [class*="hover\\:border-blue-"]:hover {
                    border-color: #4b1b27 !important;
                }

                .organization-access-theme [class*="hover\\:bg-blue-"]:hover {
                    background-color: #35151f !important;
                    color: #fffefa !important;
                }

                /* Purple becomes a secondary burgundy tint */
                .organization-access-theme .text-purple-300,
                .organization-access-theme .text-purple-400 {
                    color: #75445b !important;
                }

                .organization-access-theme [class*="bg-purple-500/"] {
                    background-color: rgba(117, 68, 91, 0.09) !important;
                }

                .organization-access-theme [class*="border-purple-"] {
                    border-color: rgba(117, 68, 91, 0.2) !important;
                }

                /* -----------------------------------------
                   10% — ORANGE HIGHLIGHTS
                ----------------------------------------- */

                .organization-access-theme .text-amber-400,
                .organization-access-theme .text-amber-500 {
                    color: #e85b18 !important;
                }

                .organization-access-theme .bg-amber-500 {
                    background-color: #ff6b1a !important;
                    color: #35151f !important;
                }

                .organization-access-theme [class*="bg-amber-500/"] {
                    background-color: rgba(255, 107, 26, 0.09) !important;
                }

                .organization-access-theme [class*="border-amber-"] {
                    border-color: rgba(255, 107, 26, 0.25) !important;
                }

                .organization-access-theme [class*="hover\\:bg-amber-"]:hover {
                    background-color: #f45e12 !important;
                    color: #35151f !important;
                }

                /* -----------------------------------------
                   SEMANTIC SUCCESS COLORS
                ----------------------------------------- */

                .organization-access-theme .text-emerald-400,
                .organization-access-theme .text-emerald-300 {
                    color: #426b50 !important;
                }

                .organization-access-theme .bg-emerald-500 {
                    background-color: #426b50 !important;
                    color: #fffefa !important;
                }

                .organization-access-theme [class*="bg-emerald-500/"] {
                    background-color: rgba(66, 107, 80, 0.09) !important;
                }

                .organization-access-theme [class*="border-emerald-"] {
                    border-color: rgba(66, 107, 80, 0.22) !important;
                }

                /* -----------------------------------------
                   SEMANTIC DESTRUCTIVE COLORS
                ----------------------------------------- */

                .organization-access-theme .text-red-400 {
                    color: #b33d36 !important;
                }

                .organization-access-theme .bg-red-500 {
                    background-color: #b33d36 !important;
                    color: #fffefa !important;
                }

                .organization-access-theme [class*="bg-red-500/"] {
                    background-color: rgba(179, 61, 54, 0.08) !important;
                }

                .organization-access-theme [class*="border-red-"] {
                    border-color: rgba(179, 61, 54, 0.22) !important;
                }

                /* -----------------------------------------
                   INPUTS AND SELECTS
                ----------------------------------------- */

                .organization-access-theme input,
                .organization-access-theme select {
                    color: #35151f !important;
                    background-color: #f8f6f0 !important;
                    border-color: rgba(75, 27, 39, 0.16) !important;
                }

                .organization-access-theme input::placeholder {
                    color: #a1968d !important;
                }

                .organization-access-theme input:focus,
                .organization-access-theme select:focus {
                    border-color: #ff6b1a !important;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(255, 107, 26, 0.12);
                }

                .organization-access-theme option {
                    color: #35151f;
                    background: #fffefa;
                }

                /* -----------------------------------------
                   TABLES AND INTERACTIONS
                ----------------------------------------- */

                .organization-access-theme tr:hover,
                .organization-access-theme [class*="hover\\:bg-[#172337]"]:hover {
                    background-color: #f7f4ed !important;
                }

                .organization-access-theme button {
                    transition:
                        background-color 180ms ease,
                        border-color 180ms ease,
                        color 180ms ease,
                        box-shadow 180ms ease;
                }

                .organization-access-theme button:focus-visible {
                    outline: 2px solid rgba(255, 107, 26, 0.7);
                    outline-offset: 3px;
                }

                /* Modal shadow */
                .organization-access-theme [class*="shadow-2xl"] {
                    box-shadow: 0 24px 70px rgba(53, 21, 31, 0.16) !important;
                }

                @media (max-width: 640px) {
                    .organization-access-theme {
                        padding-left: 1rem;
                        padding-right: 1rem;
                    }

                    .organization-access-theme .access-hero {
                        border-radius: 22px;
                    }
                }
            `}</style>
        </div>
    );
}