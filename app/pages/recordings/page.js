'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RecordingsPage() {
  const router = useRouter()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
                  <h3 className="font-semibold text-lg mb-2 truncate">
                    {video.video_name}
                  </h3>
                  
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
    </div>
  )
}