'use client'

import { useAuth } from '@/app/lib/useAuth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import SettingsPanel from '@/app/components/SettingsPanel'

export default function AccountPage() {
  const { user, loading } = useAuth()
  const [editingUsername, setEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameError, setUsernameError] = useState('')

  const handleEditUsername = () => {
    setEditingUsername(true)
    setNewUsername(user.username)
    setUsernameError('')
  }

  const handleCancelUsername = () => {
    setEditingUsername(false)
    setNewUsername('')
    setUsernameError('')
  }

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      setUsernameError('Username cannot be empty')
      return
    }

    if (newUsername === user.username) {
      setEditingUsername(false)
      return
    }

    setUsernameLoading(true)
    setUsernameError('')

    try {
      const response = await fetch('/api/users/changeUsername', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Username updated successfully! Please log in again.')
        window.location.href = '/pages/login'
      } else {
        setUsernameError(data.error || 'Failed to update username')
      }
    } catch (error) {
      setUsernameError('An error occurred')
    } finally {
      setUsernameLoading(false)
    }
  }

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
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] sm:text-xs text-slate-200 hover:border-blue-400/60 hover:text-blue-300 transition-all"
              >
                <span className="text-lg leading-none">←</span>
                <span>Back to menu</span>
              </motion.button>
            </Link>
            <SettingsPanel />
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-4xl mx-auto space-y-6">
          {/* Profile Information */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            
            <div className="space-y-6">
              {/* Username */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Username</label>
                {editingUsername ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={usernameLoading}
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={usernameLoading}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg transition disabled:opacity-50"
                      >
                        <CheckIcon className="w-5 h-5 text-green-400" />
                      </button>
                      <button
                        onClick={handleCancelUsername}
                        disabled={usernameLoading}
                        className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    {usernameError && (
                      <p className="text-sm text-red-400">{usernameError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-lg text-slate-100">{user.username}</p>
                    <button
                      onClick={handleEditUsername}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Email</label>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg text-slate-100">{user.email}</p>
                    {user.email_verified && (
                      <span className="text-xs text-green-400 mt-1 inline-block">✓ Verified</span>
                    )}
                  </div>
                  <Link href="/pages/settings/account/editEmail">
                    <button className="px-4 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-lg transition">
                      Change Email
                    </button>
                  </Link>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Role</label>
                <p className="text-lg text-slate-100">
                  {user.role === 1 ? (
                    <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg border border-purple-500/30">
                      Administrator
                    </span>
                  ) : (
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg border border-blue-500/30">
                      User
                    </span>
                  )}
                </p>
              </div>

              {/* Member Since */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Member Since</label>
                <p className="text-lg text-slate-100">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
            <h2 className="text-xl font-semibold mb-6">Security</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-slate-100">Password</p>
                  <p className="text-sm text-slate-400">••••••••••••</p>
                </div>
                <Link href="/pages/settings/account/editPassword">
                  <button className="px-4 py-2 text-sm bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-lg transition">
                    Change Password
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}