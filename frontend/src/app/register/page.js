"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                // "http://localhost:5000/api/auth/register",
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
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed.");
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

    return (
        <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
            <div className="w-full max-w-md">

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold">
                        IncidentFlow
                    </h1>

                    <p className="mt-3 text-slate-400">
                        Create your account
                    </p>
                </div>

                <form
                    onSubmit={handleRegister}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-5"
                >

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-slate-300 mb-2">
                            Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            required
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-300 mb-2">
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-300 mb-2">
                            Password
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                placeholder="Create a password"
                                required
                                className="w-full px-4 py-3 pr-20 bg-slate-800 border border-slate-700 rounded-lg text-white outline-none focus:border-blue-500"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition font-medium"
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Account"}
                    </button>

                    <p className="text-center text-sm text-slate-400">
                        Already have an account?{" "}

                        <Link
                            href="/login"
                            className="text-blue-400 hover:text-blue-300"
                        >
                            Login
                        </Link>
                    </p>

                </form>
            </div>
        </main>
    );
}