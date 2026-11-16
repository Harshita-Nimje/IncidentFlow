"use client";

import { useState } from "react";
import { KeyRound, Building2, ArrowRight } from "lucide-react";

export default function JoinOrganizationPage() {
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleValidateToken = async () => {
        if (!token.trim()) {
            setError("Please enter an invitation token");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/invitations/validate-join-token`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        token: token.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Token validation failed");
            }

            console.log("Validated organization:", data.organization);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#080D17] text-white">
            <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
                <div className="mb-10">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                        <Building2 size={24} className="text-blue-400" />
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight">
                        Join an Organization
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Enter the invitation token shared by your organization admin
                        to become a member.
                    </p>
                </div>

                <div className="rounded-2xl border border-[#263449] bg-[#101827] p-6 shadow-xl sm:p-8">
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-white">
                            Enter invitation token
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Make sure you enter the complete token.
                        </p>
                    </div>

                    <label className="mb-2 block text-xs font-semibold text-slate-300">
                        Organization token
                    </label>

                    <div className="flex items-center gap-3 rounded-xl border border-[#334155] bg-[#0b1423] px-4 py-3 focus-within:border-blue-500/60">
                        <KeyRound size={18} className="shrink-0 text-slate-500" />

                        <input
                            type="text"
                            value={token}
                            onChange={(e) => {
                                setToken(e.target.value);
                                setError("");
                            }}
                            placeholder="Paste your invitation token"
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                        />
                    </div>

                    {error && (
                        <p className="mt-3 text-xs text-red-400">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleValidateToken}
                        disabled={!token.trim() || loading}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Validating..." : "Continue"}
                        {!loading && <ArrowRight size={17} />}
                    </button>
                </div>
            </div>
        </main>
    );
}