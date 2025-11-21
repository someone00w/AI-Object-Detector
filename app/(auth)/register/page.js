"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { csrfFetch, invalidateCsrfToken } from "@/app/lib/csrfHelper";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await csrfFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.error?.includes('CSRF')) {
          invalidateCsrfToken();
          setError("Security token expired. Please try again.");
        } else {
          setError(data.error || "Registration failed");
        }
        return;
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />
      <div className="absolute top-[12%] left-[8%] w-[260px] h-[260px] bg-emerald-400/12 rounded-full blur-[150px]" />
      <div className="absolute bottom-[12%] right-[10%] w-[300px] h-[300px] bg-sky-400/12 rounded-full blur-[160px]" />

      {/* Top bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 pt-6 pb-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.7)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="uppercase tracking-[0.18em] text-slate-400 text-[11px]">
            DiddyWatch
          </span>
        </div>
        <Link
          href="/login"
          className="text-[11px] sm:text-xs text-slate-400 hover:text-emerald-300 transition-colors"
        >
          Already registered? <span className="underline underline-offset-4">Sign in</span>
        </Link>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 sm:px-6 pb-8">
        <div className="max-w-5xl w-full flex flex-col lg:flex-row items-stretch gap-10 lg:gap-12">
          {/* Left panel */}
          <div className="flex-1 hidden lg:flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">
                Create your access
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
              Join{" "}
              <span className="bg-linear-to-r from-emerald-400 via-cyan-300 to-sky-500 bg-clip-text text-transparent">
                DiddyWatch
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-md mb-4">
              Set up your account to start capturing live video, running AI detections, 
              and reviewing your detection history — all in a unified portal.
            </p>
            <ul className="space-y-2 text-[12px] text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Personal login tied to your videos and detections
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Secure authentication handled by the DiddyWatch API
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Access statistics and live monitoring once inside
              </li>
            </ul>
          </div>

          {/* Right form card */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md bg-slate-950/85 border border-slate-800 rounded-3xl px-6 py-8 sm:px-8 sm:py-9 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
              <div className="mb-6 text-center">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  Create Account
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-400">
                  Fill in your details to start using DiddyWatch.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs sm:text-sm px-3 py-2 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <InputField
                    id="username"
                    label="Username *"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="Choose a unique username"
                    required
                  />
                  <InputField
                    id="email"
                    type="email"
                    label="Email *"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    required
                  />
                  <InputField
                    id="full_name"
                    label="Full Name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="Optional"
                  />
                  <InputField
                    id="password"
                    type="password"
                    label="Password *"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Must be at least 8 characters with uppercase, lowercase, and
                    number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-2xl text-sm font-medium text-slate-950 bg-linear-to-r from-emerald-400 via-cyan-400 to-sky-500 shadow-[0_0_25px_rgba(45,212,191,0.6)] hover:shadow-[0_0_35px_rgba(56,189,248,0.9)] hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <>
                      <span className="h-3 w-3 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </form>

              <p className="mt-6 text-[11px] text-slate-500 text-center">
                By creating an account, you agree to use DiddyWatch responsibly
                and in accordance with your organization&apos;s policies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  id,
  type = "text",
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs sm:text-sm font-medium text-slate-200 mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
      />
    </div>
  );
}
