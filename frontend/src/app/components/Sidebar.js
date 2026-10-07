"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
        } catch (error) {
            console.error("Invalid user data in localStorage:", error);

            localStorage.removeItem("user");
            localStorage.removeItem("token");
        }
    }, []);

    const isAdmin = user?.role?.toLowerCase() === "admin";
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";
    };

    return (
        <aside className="fixed left-0 top-0 w-64 h-screen bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
            <h1 className="text-2xl font-bold text-white mb-8">
                IncidentFlow
            </h1>

            <nav className="space-y-2">
                <Link
                    href="/dashboard"
                    className={`block px-4 py-3 rounded-lg transition ${pathname === "/dashboard"
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                >
                    Dashboard
                </Link>

                <Link
                    href="/incidents"
                    className={`block px-4 py-3 rounded-lg transition ${pathname === "/"
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                >
                    Incidents
                </Link>

                <Link
                    href="/analytics"
                    className={`block px-4 py-3 rounded-lg transition ${pathname === "/analytics"
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }`}
                >
                    Analytics
                </Link>


                {isAdmin && (
                    <div className="pt-6">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                            Admin
                        </p>

                        <Link
                            href="/admin/organizations"
                            className="block px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                        >
                            Organizations
                        </Link>
                    </div>
                )}
            </nav>
            <div className="mt-auto pt-8 border-t border-slate-800">
                <div className="mb-4">
                    <p className="text-white font-medium">
                        {user?.name || "User"}
                    </p>

                    <p className="text-sm text-slate-500 capitalize">
                        {user?.role || "member"}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-left"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}