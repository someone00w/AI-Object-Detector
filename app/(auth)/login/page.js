"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Account created successfully! Please log in.");
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Redirect to menu on success
      router.push("/menu");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background layers to match DiddyWatch theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]ize:60px_60px]" />
      <div className="absolute top-[12%] left-[10%] w-[260px] h-[260px] bg-emerald-400/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[10%] right-[8%] w-[300px] h-[300px] bg-cyan-400/10 rounded-full blur-[150px]" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 sm:px-6">
        <div className="max-w-5xl w-full flex flex-col lg:flex-row items-stretch gap-10">
          {/* Left side: brand + tagline (hidden on very small screens) */}
          <div className="hidden lg:flex flex-1 flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">
                DiddyWatch
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">
              Secure access to{" "}
              <span className="bg-linear-to-r from-emerald-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent">
                real-time detection
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-md">
              Log in to manage your detections, review past footage, and access
              analytics — all in a single unified interface.
            </p>
          </div>

          {/* Right side: login card */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-3xl px-6 py-8 sm:px-8 sm:py-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
              <div className="mb-6 text-center">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Sign in to DiddyWatch
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-400">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-emerald-400 hover:text-emerald-300 underline-offset-4 hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs sm:text-sm px-3 py-2 rounded-xl">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm px-3 py-2 rounded-xl">
                    {success}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-xs sm:text-sm font-medium text-slate-200 mb-1"
                    >
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="mt-1 block w-full rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      placeholder="Enter your username"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs sm:text-sm font-medium text-slate-200 mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="mt-1 block w-full rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-2xl text-sm font-medium text-slate-950 bg-linear-to-r from-emerald-400 via-cyan-400 to-sky-500 shadow-[0_0_25px_rgba(45,212,191,0.6)] hover:shadow-[0_0_35px_rgba(56,189,248,0.9)] hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <span className="h-3 w-3 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <p className="mt-6 text-[11px] text-slate-500 text-center">
                This portal is for authorized DiddyWatch users only. Activity
                may be monitored for security purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
