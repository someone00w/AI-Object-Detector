'use client'

import { useAuth } from '@/app/lib/useAuth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { csrfFetch } from '@/app/lib/csrfHelper'

export default function ChangePasswordPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password')
      return
    }

    setSubmitting(true)

    try {
      const response = await csrfFetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Password changed successfully! Please log in with your new password.')
        router.push('/login')
      } else {
        setError(data.error || 'Failed to change password')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-blue-400" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />

      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 py-6">
        <header className="w-full max-w-2xl mx-auto mb-6">
          <Link href="/settings/account">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-300 transition"
            >
              <span className="text-lg">←</span>
              Back to Account Settings
            </motion.button>
          </Link>
        </header>

        <main className="w-full max-w-2xl mx-auto">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
            <h1 className="text-2xl font-semibold mb-2">Change Password</h1>
            <p className="text-slate-400 mb-6">
              Enter your current password and choose a new secure password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                <p className="text-sm text-yellow-300">
                  ⚠️ After changing your password, you'll be logged out and need to sign in again with your new password.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Changing Password...' : 'Change Password'}
                </button>
                <Link href="/settings/account" className="flex-1">
                  <button
                    type="button"
                    className="w-full px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}