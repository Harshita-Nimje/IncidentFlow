"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";

export default function AuthenticatedLayout({ children }) {
    const router = useRouter();
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.replace("/");
            return;
        }

        setCheckingAuth(false);
    }, [router]);

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <p className="text-slate-400">Loading...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex">
            <Sidebar />

            <main className="flex-1 ml-64">
                {children}
            </main>
        </div>
    );
}