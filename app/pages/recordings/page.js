'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import SettingsPanel from '@/app/components/SettingsPanel'

export default function RecordingsPage() {
  const router = useRouter()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [videoToDelete, setVideoToDelete] = useState(null)
  const [passwordError, setPasswordError] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    fetchUserAndVideos()
  }, [])

  const fetchUserAndVideos = async () => {
    try {
      // First get current user session
      const sessionResponse = await fetch('/api/auth/session')
      if (!sessionResponse.ok) {
        if (sessionResponse.status === 401) {
          router.push('/pages/login')
          return
        }
        throw new Error('Failed to fetch session')
      }
      const sessionData = await sessionResponse.json()
      setCurrentUser(sessionData.user)

      // Then fetch videos (admin gets all, regular user gets their own)
      const videosResponse = await fetch('/api/videos/user')
      if (!videosResponse.ok) {
        if (videosResponse.status === 401) {
          router.push('/pages/login')
          return
        }
        throw new Error('Failed to fetch videos')
      }

      const videosData = await videosResponse.json()
      setVideos(videosData.videos)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (video) => {
    setEditingId(video.id)
    setEditName(video.video_name)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleSaveEdit = async (videoId) => {
    if (!editName.trim()) {
      alert('Video name cannot be empty')
      return
    }

    try {
      const response = await fetch('/api/videos/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: videoId,
          video_name: editName
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update video')
      }

      const data = await response.json()
      
      setVideos(videos.map(v => 
        v.id === videoId ? { ...v, video_name: data.video.video_name } : v
      ))
      
      setEditingId(null)
      setEditName('')
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDelete = async (videoId) => {
    // Only admins can delete
    if (currentUser?.role !== 1) {
      alert('Only administrators can delete videos')
      return
    }

    setVideoToDelete(videoId)
    setShowPasswordModal(true)
    setPasswordInput('')
    setPasswordError('')
  }

  const handleConfirmDelete = async () => {
    if (!passwordInput) {
      setPasswordError('Please enter your password')
      return
    }

    setDeleting(videoToDelete)
    setPasswordError('')
    
    try {
      const response = await fetch('/api/videos/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: videoToDelete,
          password: passwordInput 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setPasswordError('Invalid password')
          setDeleting(null)
          return
        }
        throw new Error(data.error || 'Failed to delete video')
      }

      setVideos(videos.filter(v => v.id !== videoToDelete))
      setShowPasswordModal(false)
      setPasswordInput('')
      setVideoToDelete(null)
      alert('Video deleted successfully')
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleCancelDelete = () => {
    setShowPasswordModal(false)
    setPasswordInput('')
    setVideoToDelete(null)
    setPasswordError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-emerald-400 border-opacity-80 mb-4" />
          <div className="text-white text-xl">Loading recordings...</div>
        </div>
      </div>
    )
  }

  const isAdmin = currentUser?.role === 1

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
            <div className="h-7 w-7 rounded-xl bg-pink-500/10 border border-pink-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(236,72,153,0.7)]">
              <span className="h-2 w-2 rounded-full bg-pink-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                {isAdmin ? 'All Recordings (Admin View)' : 'My Recordings'}
              </span>
              <span className="text-xs text-slate-500">
                {isAdmin ? 'System-wide Detection Videos' : 'Saved Detection Videos'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/pages/menu">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97, y: 0 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] sm:text-xs text-slate-200 hover:border-emerald-400/60 hover:text-emerald-300 transition-all"
              >
                <span className="text-lg leading-none">←</span>
                <span>Back to menu</span>
              </motion.button>
            </Link>

            <SettingsPanel />
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-6xl mx-auto">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {videos.length === 0 ? (
            <div className="text-center text-slate-400 py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
              <p className="text-xl">No recordings yet</p>
              <p className="mt-2">Start detecting to create recordings</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div 
                  key={video.id}
                  className="bg-slate-900/70 rounded-2xl overflow-hidden border border-slate-800 hover:border-emerald-400/40 transition shadow-lg shadow-slate-900/40 backdrop-blur-xl"
                >
                  <video 
                    controls
                    className="w-full aspect-video bg-black"
                    src={video.file_path}
                  >
                    Your browser does not support video playback.
                  </video>
                  
                  <div className="p-4">
                    {editingId === video.id ? (
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 bg-slate-800 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(video.id)}
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded transition"
                          title="Save"
                        >
                          <CheckIcon className="w-4 h-4 text-green-400" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded transition"
                          title="Cancel"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg truncate flex-1">
                          {video.video_name}
                        </h3>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => handleEditClick(video)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded transition"
                            title="Edit name"
                          >
                            <PencilIcon className="w-4 h-4 text-blue-400" />
                          </button>
                          {/* Only show delete button for admins */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(video.id)}
                              disabled={deleting === video.id}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded transition disabled:bg-slate-600 disabled:cursor-not-allowed"
                              title="Delete (Admin only)"
                            >
                              {deleting === video.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <TrashIcon className="w-4 h-4 text-red-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-slate-400 space-y-1">
                      {isAdmin && video.username && (
                        <p className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${video.user_role === 1 ? 'bg-purple-400' : 'bg-blue-400'}`} />
                          Owner: <span className="text-slate-200">{video.username}</span>
                          {video.user_role === 1 && <span className="text-xs text-purple-400">(Admin)</span>}
                        </p>
                      )}
                      <p>📅 {new Date(video.capture_time).toLocaleString()}</p>
                      <p>💾 {video.file_size_mb} MB</p>
                      
                      {video.detection_result && (
                        <p>🎯 {video.detection_result.totalDetections} detections</p>
                      )}
                    </div>

                    <a
                      href={video.file_path}
                      download={video.video_name.endsWith('.webm') ? video.video_name : `${video.video_name}.webm`}
                      className="mt-4 block w-full text-center py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded transition"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Password Modal - Only shown for admins */}
      {showPasswordModal && isAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-800 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Admin: Confirm Deletion</h2>
            <p className="text-slate-300 mb-4">
              As an administrator, please enter your password to confirm deletion of this recording. This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value)
                  setPasswordError('')
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !deleting) {
                    handleConfirmDelete()
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your admin password"
                autoFocus
                disabled={deleting}
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-400">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded transition disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete Video'
                )}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded transition disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}