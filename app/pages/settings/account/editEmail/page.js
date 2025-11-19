'use client'

import { useAuth } from '@/app/lib/useAuth'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ChangeEmailPage() {
  const { user, loading } = useAuth()
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/users/changeEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to change email')
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

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
        
        <div className="relative z-10 max-w-md w-full mx-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Verification Email Sent!</h1>
          <p className="text-slate-400 mb-6">
            We've sent a verification link to <strong className="text-white">{newEmail}</strong>. 
            Please check your inbox and click the link to confirm your new email address.
          </p>
          <Link href="/pages/settings/account">
            <button className="w-full px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-lg transition">
              Back to Account Settings
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />

      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 py-6">
        <header className="w-full max-w-2xl mx-auto mb-6">
          <Link href="/pages/settings/account">
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
            <h1 className="text-2xl font-semibold mb-2">Change Email Address</h1>
            <p className="text-slate-400 mb-6">
              Enter your new email address and confirm with your password. We'll send a verification link to your new email.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Current Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="Enter new email"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your current password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Sending Verification...' : 'Send Verification Email'}
                </button>
                <Link href="/pages/settings/account" className="flex-1">
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