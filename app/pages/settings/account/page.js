'use client'

import { useAuth } from '@/app/lib/useAuth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from "next/navigation";
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import SettingsPanel from '@/app/components/SettingsPanel'

export default function AccountPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-emerald-400 border-opacity-80 mb-4" />
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="w-full max-w-6xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-blue-500/10 border border-blue-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(59,130,246,0.7)]">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Account Settings
              </span>
              <span className="text-xs text-slate-500">
                Profile & Preferences
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/pages/menu">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97, y: 0 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] sm:text-xs text-slate-200 hover:border-green-400/60 hover:text-green-300 transition-all"
              >
                <span className="text-lg leading-none">←</span>
                <span>Back to menu</span>
              </motion.button>
            </Link>
            <SettingsPanel />
          </div>

        </header>

        {/* Main Content */}
        <main className="w-full max-w-4xl mx-auto">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
            <h1 className="text-2xl font-semibold mb-6">Account Information</h1>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Username</label>
                <p className="text-lg text-slate-100 mt-1">{user.username}</p>
              </div>
              
              <div>
                <label className="text-sm text-slate-400">Email</label>
                <p className="text-lg text-slate-100 mt-1">{user.email}</p>
              </div>
              
              <div>
                <label className="text-sm text-slate-400">Role</label>
                <p className="text-lg text-slate-100 mt-1">
                  {user.role === 1 ? 'Administrator' : 'User'}
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-sm text-blue-300">
                🚧 Account management features coming soon! You'll be able to update your profile, change password, and manage preferences.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
