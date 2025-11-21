'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred during verification')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-emerald-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verifying Email...</h1>
              <p className="text-slate-400">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-emerald-400">Email Verified!</h1>
              <p className="text-slate-400 mb-4">{message}</p>
              <p className="text-sm text-slate-500">Redirecting to login...</p>
              <Link 
                href="/login"
                className="mt-6 inline-block px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg transition"
              >
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-red-400">Verification Failed</h1>
              <p className="text-slate-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Link 
                  href="/register"
                  className="block px-6 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg transition"
                >
                  Register Again
                </Link>
                <Link 
                  href="/login"
                  className="block px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg transition"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}