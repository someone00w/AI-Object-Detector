'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, UserCircleIcon, VideoCameraIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export default function SettingsPanel() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false)
  
  const defaultSettings = {
    emailNotifications: true,
    noPersonStopTime: 5
  }
  
  const [settings, setSettings] = useState(defaultSettings)
  const [tempSettings, setTempSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)

  // Load settings from database when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchSettings()
    }
  }, [isOpen])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setSettings(data.settings)
          setTempSettings(data.settings)
        }
      } else {
        console.error('Failed to fetch settings')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save settings to database
    // Save settings to database
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempSettings)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSettings(tempSettings)  // Updates saved settings
          
          // Broadcast settings change to other components
          window.dispatchEvent(new CustomEvent('settingsChanged', {
            detail: tempSettings
          }));
          
          // Show confirmation toast
          setShowSaveConfirmation(true)
          setTimeout(() => {
            setShowSaveConfirmation(false)
          }, 2000)
        } else {
          alert('Failed to save settings')
        }
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Error saving settings')
    }
  }

  // Cancel changes and revert to saved settings
  const cancelChanges = () => {
    setTempSettings(settings)
  }

  // Reset to defaults
  const resetToDefaults = () => {
    const defaults = {
      emailNotifications: true,
      noPersonStopTime: 5
    }
    setTempSettings(defaults)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      {/* Cogwheel Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-700 bg-slate-900/70 text-slate-200 hover:border-emerald-400/60 hover:text-emerald-300 transition-all"
        title="Settings"
      >
        <Cog6ToothIcon className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-96 bg-slate-950 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-xl font-semibold text-slate-100">Settings</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Save Confirmation Toast */}
              <AnimatePresence>
                {showSaveConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Settings saved!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-400" />
                  </div>
                ) : (
                  <>
                    {/* Account Option */}
                    <button
                      onClick={() => {
                        setIsOpen(false)
                        router.push('/pages/settings/account')
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-emerald-400/40 transition-all text-left"
                    >
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <UserCircleIcon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200">Account</p>
                        <p className="text-xs text-slate-500">Manage your profile</p>
                      </div>
                      <span className="text-slate-500">→</span>
                    </button>

                    {/* Video Settings Option */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/30">
                          <VideoCameraIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-200">Video Settings</p>
                          <p className="text-xs text-slate-500">Configure detection behavior</p>
                        </div>
                      </div>

                      {/* Settings Controls */}
                      <div className="space-y-4">
                        {/* Email Notifications Toggle */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <p className="text-sm text-slate-300">Email Notifications</p>
                            <p className="text-xs text-slate-500">Alert on person detection</p>
                          </div>
                          <button
                            onClick={() => setTempSettings({
                              ...tempSettings,
                              emailNotifications: !tempSettings.emailNotifications
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              tempSettings.emailNotifications ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                tempSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Stop Recording Delay Slider */}
                        <div className="py-2 pt-6 border-t border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-slate-300">Stop Recording Delay</p>
                            <span className="text-xs font-medium text-purple-400">{tempSettings.noPersonStopTime}s</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={tempSettings.noPersonStopTime}
                            onChange={(e) => setTempSettings({
                              ...tempSettings,
                              noPersonStopTime: parseInt(e.target.value)
                            })}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                            <span>1s</span>
                            <span>20s</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            How long to keep recording after person leaves the frame
                          </p>
                        </div>

                        {/* Save and Cancel Buttons */}
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={saveSettings}
                            className="flex-1 py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={cancelChanges}
                            className="flex-1 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>

                        {/* Reset to Defaults Button */}
                        <button
                          onClick={resetToDefaults}
                          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-emerald-400/40 text-slate-300 text-sm font-medium transition-all"
                        >
                          <ArrowPathIcon className="w-4 h-4 text-emerald-400" />
                          Reset to Defaults
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer - Logout Button (Fixed at bottom) */}
              <div className="p-6 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/60 transition-all text-left"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/20 border border-red-500/40">
                    <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-300">Logout</p>
                    <p className="text-xs text-red-400/70">Sign out of your account</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}