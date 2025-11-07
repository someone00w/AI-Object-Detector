'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

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

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos/user')
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/pages/login')
          return
        }
        throw new Error('Failed to fetch videos')
      }

      const data = await response.json()
      setVideos(data.videos)
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
      
      // Update local state
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

      // Remove from local state
      setVideos(videos.filter(v => v.id !== videoToDelete))
      setShowPasswordModal(false)
      setPasswordInput('')
      setVideoToDelete(null)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <div className="text-white text-xl">Loading recordings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Recordings</h1>
          <Link 
            href="/pages/menu"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition"
          >
            Back to Menu
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {videos.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-xl">No recordings yet</p>
            <p className="mt-2">Start detecting to create recordings</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div 
                key={video.id}
                className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-cyan-500 transition"
              >
                <video 
                  controls
                  className="w-full aspect-video bg-black"
                  src={video.file_path}
                >
                  Your browser does not support video playback.
                </video>
                
                <div className="p-4">
                  {/* Editable title */}
                  {editingId === video.id ? (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(video.id)}
                        className="p-2 bg-green-500 hover:bg-green-600 rounded transition"
                        title="Save"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition"
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
                          className="p-2 bg-blue-500 hover:bg-blue-600 rounded transition"
                          title="Edit name"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
                          disabled={deleting === video.id}
                          className="p-2 bg-red-500 hover:bg-red-600 rounded transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          {deleting === video.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>📅 {new Date(video.capture_time).toLocaleString()}</p>
                    <p>💾 {video.file_size_mb} MB</p>
                    
                    {video.detection_result && (
                      <p>🎯 {video.detection_result.totalDetections} detections</p>
                    )}
                  </div>

                  <a
                    href={video.file_path}
                    download
                    className="mt-4 block w-full text-center py-2 bg-cyan-500 hover:bg-cyan-600 rounded transition"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Confirmation Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">Confirm Deletion</h2>
            <p className="text-gray-300 mb-4">
              Please enter your password to confirm deletion of this recording. This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter your password"
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
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}