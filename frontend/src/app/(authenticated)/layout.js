"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { OrganizationProvider } from "../context/OrganizationContext";
import { Clock } from "lucide-react";

export default function AuthenticatedLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const [checkingAuth, setCheckingAuth] = useState(true);
    const [organizations, setOrganizations] = useState([]);
    const [activeOrganization, setActiveOrganization] = useState(null);
    const [pendingJoinRequest, setPendingJoinRequest] = useState(null);

    useEffect(() => {
        const loadOrganizations = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                router.replace("/");
                return;
            }

            const storedUser = localStorage.getItem("user");
            let currentUser = null;

            try {
                currentUser = JSON.parse(storedUser);
            } catch {
                router.replace("/login");
                return;
            }

            if (
                pathname.startsWith("/platform-admin") &&
                currentUser?.role !== "platform_admin"
            ) {
                router.replace("/dashboard");
                return;
            }

            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to load organizations");
                }

                const data = await response.json();
                const organizationList = data.organizations || [];
                const pendingRequests = data.pendingJoinRequests || [];

                setOrganizations(organizationList);

                if (organizationList.length > 0) {
                    setActiveOrganization(organizationList[0]);
                } else if (
                    currentUser?.role !== "platform_admin" &&
                    pendingRequests.length > 0
                ) {
                    setPendingJoinRequest(pendingRequests[0]);
                }
            } catch (error) {
                console.error("Organization loading error:", error);
            } finally {
                setCheckingAuth(false);
            }
        };

        loadOrganizations();
    }, [router, pathname]);

    if (pendingJoinRequest) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B1220] p-8 text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
                        <Clock size={26} className="text-amber-400" />
                    </div>

                    <h1 className="text-xl font-semibold text-white">
                        Approval Pending
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                        Your request to join{" "}
                        <span className="font-medium text-white">
                            {pendingJoinRequest.organization_name}
                        </span>{" "}
                        has been submitted. You will get access once an organization admin approves it.
                    </p>

                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            localStorage.removeItem("user");
                            router.replace("/login");
                        }}
                        className="mt-7 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <OrganizationProvider activeOrganization={activeOrganization}>
            <div className="min-h-screen w-full bg-slate-950">
                <Sidebar
                    organizations={organizations}
                    activeOrganization={activeOrganization}
                    setActiveOrganization={setActiveOrganization}
                />

                <main className="ml-0 min-h-screen w-full pt-16 md:ml-64 md:w-[calc(100%-16rem)] md:pt-0">
                    {children}
                </main>
            </div>
        </OrganizationProvider>
    );
}
