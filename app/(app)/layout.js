'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/useAuth';
import Navbar from '@/app/components/Navbar';

export default function AppLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
        <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />

        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-emerald-400 border-opacity-80" />
          <p className="text-lg text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Fixed background - stays in place */}
      <div className="fixed inset-0 bg-slate-950" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,#020617,#020617_60%,#000000)]" />
      <div className="fixed inset-0 bg-[linear-gradient(to_bottom_right,rgba(56,189,248,0.18),rgba(249,115,22,0.12),rgba(16,185,129,0.16))]" />
      <div className="fixed inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />
      
      {/* Glow effects */}
      <div className="pointer-events-none fixed -top-24 -left-10 h-72 w-72 rounded-full bg-emerald-400/15 blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-24 -right-10 h-80 w-80 rounded-full bg-sky-500/20 blur-[150px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen text-slate-100">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </>
  );
}