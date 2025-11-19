'use client'

import { useAuth } from '@/app/lib/useAuth'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from "next/navigation"
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon, PlusIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import SettingsPanel from '@/app/components/SettingsPanel'
import { useState, useEffect } from 'react'

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // State for email recipients
  const [emailRecipients, setEmailRecipients] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  // Load email recipients when component mounts
  useEffect(() => {
    if (user) {
      ensureUserEmailExists()
      loadEmailRecipients()
    }
  }, [user])

  // Ensure user's email is in the recipients list
  const ensureUserEmailExists = async () => {
    try {
      const response = await fetch('/api/settings/email-recipients/emails')
      if (response.ok) {
        const data = await response.json()
        const hasUserEmail = data.recipients?.some(r => r.email.toLowerCase() === user.email.toLowerCase())
        
        if (!hasUserEmail) {
          // Add user's email as default recipient
          await fetch('/api/settings/email-recipients/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, enabled: true })
          })
        }
      }
    } catch (error) {
      console.error('Failed to ensure user email exists:', error)
    }
  }

  const loadEmailRecipients = async () => {
    try {
      const response = await fetch('/api/settings/email-recipients/emails')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Sort recipients: user's email first, then others by creation date
          const sorted = (data.recipients || []).sort((a, b) => {
            const aIsUser = a.email.toLowerCase() === user.email.toLowerCase()
            const bIsUser = b.email.toLowerCase() === user.email.toLowerCase()
            
            if (aIsUser && !bIsUser) return -1
            if (!aIsUser && bIsUser) return 1
            
            return new Date(a.createdAt) - new Date(b.createdAt)
          })
          setEmailRecipients(sorted)
        }
      }
    } catch (error) {
      console.error('Failed to load email recipients:', error)
    }
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleAddEmail = async () => {
    setEmailError('')
    
    if (!newEmail.trim()) {
      setEmailError('Email cannot be empty')
      return
    }

    if (!validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address')
      return
    }

    // Check for duplicates
    if (emailRecipients.some(r => r.email.toLowerCase() === newEmail.toLowerCase())) {
      setEmailError('This email is already in the list')
      return
    }

    try {
      const response = await fetch('/api/settings/email-recipients/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newEmail.trim(),
          enabled: true 
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEmailRecipients([...emailRecipients, data.recipient])
          setNewEmail('')
          setIsAdding(false)
          showSaveMessage('Email recipient added successfully!')
        } else {
          setEmailError(data.error || 'Failed to add email')
        }
      } else {
        setEmailError('Failed to add email recipient')
      }
    } catch (error) {
      console.error('Failed to add email:', error)
      setEmailError('Error adding email recipient')
    }
  }

  const handleUpdateEmail = async (id) => {
    setEmailError('')
    
    if (!editEmail.trim()) {
      setEmailError('Email cannot be empty')
      return
    }

    if (!validateEmail(editEmail)) {
      setEmailError('Please enter a valid email address')
      return
    }

    // Check for duplicates (excluding current email)
    if (emailRecipients.some(r => r.id !== id && r.email.toLowerCase() === editEmail.toLowerCase())) {
      setEmailError('This email is already in the list')
      return
    }

    try {
      const response = await fetch('/api/settings/email-recipients/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id,
          email: editEmail.trim()
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEmailRecipients(emailRecipients.map(r => 
            r.id === id ? { ...r, email: editEmail.trim() } : r
          ))
          setEditingId(null)
          setEditEmail('')
          showSaveMessage('Email updated successfully!')
        } else {
          setEmailError(data.error || 'Failed to update email')
        }
      } else {
        setEmailError('Failed to update email')
      }
    } catch (error) {
      console.error('Failed to update email:', error)
      setEmailError('Error updating email')
    }
  }

  const handleToggleEmail = async (id, currentStatus) => {
    try {
      const response = await fetch('/api/settings/email-recipients/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id,
          enabled: !currentStatus
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEmailRecipients(emailRecipients.map(r => 
            r.id === id ? { ...r, enabled: !currentStatus } : r
          ))
          showSaveMessage(`Notifications ${!currentStatus ? 'enabled' : 'disabled'}`)
        }
      }
    } catch (error) {
      console.error('Failed to toggle email:', error)
    }
  }

  const handleDeleteEmail = async (id, email) => {
    // Prevent deletion of user's own email
    if (email.toLowerCase() === user.email.toLowerCase()) {
      setEmailError('Cannot remove your account email')
      setTimeout(() => setEmailError(''), 3000)
      return
    }

    if (!confirm('Are you sure you want to remove this email recipient?')) {
      return
    }

    try {
      const response = await fetch('/api/settings/email-recipients/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEmailRecipients(emailRecipients.filter(r => r.id !== id))
          showSaveMessage('Email recipient removed')
        }
      }
    } catch (error) {
      console.error('Failed to delete email:', error)
    }
  }

  const startEditing = (recipient) => {
    // Prevent editing of user's own email
    if (recipient.email.toLowerCase() === user.email.toLowerCase()) {
      setEmailError('Cannot edit your account email')
      setTimeout(() => setEmailError(''), 3000)
      return
    }
    setEditingId(recipient.id)
    setEditEmail(recipient.email)
    setEmailError('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditEmail('')
    setEmailError('')
  }

  const cancelAdding = () => {
    setIsAdding(false)
    setNewEmail('')
    setEmailError('')
  }

  const showSaveMessage = (message) => {
    setSaveMessage(message)
    setTimeout(() => setSaveMessage(''), 3000)
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
            <div className="h-7 w-7 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.7)]">
              <EnvelopeIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Email Notifications
              </span>
              <span className="text-xs text-slate-500">
                Manage Recipients
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

        {/* Save Confirmation Message */}
        <AnimatePresence>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg"
            >
              <CheckIcon className="w-5 h-5" />
              <span className="text-sm font-medium">{saveMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="w-full max-w-4xl mx-auto">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold">Email Notification Recipients</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Add, edit, or remove email addresses to receive detection notifications
                </p>
              </div>
              
              {!isAdding && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Email
                </motion.button>
              )}
            </div>

            {/* Error Message */}
            {emailError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {emailError}
              </div>
            )}

            {/* Add New Email Form */}
            <AnimatePresence>
              {isAdding && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                      placeholder="Enter email address"
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                      autoFocus
                    />
                    <button
                      onClick={handleAddEmail}
                      className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      title="Save"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={cancelAdding}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                      title="Cancel"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Recipients List */}
            <div className="space-y-3">
              {emailRecipients.length === 0 ? (
                <div className="text-center py-12">
                  <EnvelopeIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">No email recipients added yet</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Click "Add Email" to start receiving notifications
                  </p>
                </div>
              ) : (
                emailRecipients.map((recipient) => {
                  const isUserEmail = recipient.email.toLowerCase() === user.email.toLowerCase()
                  
                  return (
                  <motion.div
                    key={recipient.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${
                      isUserEmail 
                        ? 'bg-blue-500/10 border-2 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                        : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {editingId === recipient.id ? (
                      // Edit Mode
                      <>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleUpdateEmail(recipient.id)}
                          className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateEmail(recipient.id)}
                          className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                          title="Save"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                          title="Cancel"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${
                              isUserEmail ? 'text-blue-100' : 'text-slate-100'
                            }`}>
                              {recipient.email}
                            </p>
                            {isUserEmail && (
                              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-500/30 text-blue-200 border border-blue-400/50 rounded-full font-semibold shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                </svg>
                                Your Account
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${
                            isUserEmail ? 'text-blue-300/70' : 'text-slate-500'
                          }`}>
                            {recipient.enabled ? 'Notifications enabled' : 'Notifications disabled'}
                          </p>
                        </div>
                        
                        {/* Toggle Switch */}
                        <button
                          onClick={() => handleToggleEmail(recipient.id, recipient.enabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            recipient.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                          title={recipient.enabled ? 'Disable notifications' : 'Enable notifications'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              recipient.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>

                        {/* Edit Button - Hidden for user's email */}
                        {!isUserEmail && (
                          <button
                            onClick={() => startEditing(recipient)}
                            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button - Hidden for user's email */}
                        {!isUserEmail ? (
                          <button
                            onClick={() => handleDeleteEmail(recipient.id, recipient.email)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-9" />
                        )}
                      </>
                    )}
                  </motion.div>
                )})
              )}
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <p className="text-sm text-blue-300">
                💡 <strong>Tips:</strong> Your account email is always included and cannot be removed or edited. You can toggle notifications on/off for each email individually. Disabled recipients will remain in your list but won't receive notifications.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}