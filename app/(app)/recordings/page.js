"use client";
 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import SettingsPanel from "@/app/components/SettingsPanel";
import { csrfFetch } from "@/app/lib/csrfHelper";
 
export default function RecordingsPage() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
 
  /* ------------------ FETCH USER + VIDEOS ------------------ */
  useEffect(() => {
    fetchUserAndVideos();
  }, []);
 
  const fetchUserAndVideos = async () => {
    try {
      const sessionResponse = await fetch("/api/auth/session");
      if (!sessionResponse.ok) {
        if (sessionResponse.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch session");
      }
      const sessionData = await sessionResponse.json();
      setCurrentUser(sessionData.user);
 
      const videosResponse = await fetch("/api/videos/user");
      if (!videosResponse.ok) {
        if (videosResponse.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch videos");
      }
 
      const videosData = await videosResponse.json();
      setVideos(videosData.videos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
 
  /* ------------------ EDIT NAME ------------------ */
  const handleEditClick = (video) => {
    setEditingId(video.id);
    setEditName(video.video_name);
  };
 
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };
 
  const handleSaveEdit = async (videoId) => {
    if (!editName.trim()) return alert("Video name cannot be empty");

    try {
      const response = await csrfFetch("/api/videos/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoId, video_name: editName }),
      });      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update video");
      }
 
      const data = await response.json();
 
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId ? { ...v, video_name: data.video.video_name } : v
        )
      );
 
      setEditingId(null);
      setEditName("");
    } catch (err) {
      alert(err.message);
    }
  };
 
  /* ------------------ DELETE VIDEO (ADMIN ONLY) ------------------ */
  const handleDelete = async (videoId) => {
    if (currentUser?.role !== 1) {
      alert("Only administrators can delete videos");
      return;
    }
 
    setVideoToDelete(videoId);
    setShowPasswordModal(true);
    setPasswordInput("");
  };
 
  const handleConfirmDelete = async () => {
    if (!passwordInput) {
      setPasswordError("Please enter your password");
      return;
    }
 
    setDeleting(videoToDelete);

    try {
      const response = await csrfFetch("/api/videos/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoToDelete, password: passwordInput }),
      });      const data = await response.json();
 
      if (!response.ok) {
        if (response.status === 401) {
          setPasswordError("Invalid password");
          setDeleting(null);
          return;
        }
        throw new Error(data.error || "Failed to delete video");
      }
 
      setVideos((prev) => prev.filter((v) => v.id !== videoToDelete));
      setShowPasswordModal(false);
      setPasswordInput("");
      setVideoToDelete(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleting(null);
    }
  };
 
  const handleCancelDelete = () => {
    setShowPasswordModal(false);
    setPasswordInput("");
    setPasswordError("");
  };
 
  const formatCaptureTime = (dateString) =>
    new Date(dateString).toLocaleString("en-SG");
 
  const formatFileSize = (mb) => {
    const val = Number(mb);
    return !val ? "-" : `${val.toFixed(1)} MB`;
  };
 
  const isAdmin = currentUser?.role === 1;
 
  /* ------------------ LOADING ------------------ */
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-emerald-400 border-opacity-80 mb-4" />
          <div className="text-white text-xl">Loading recordings...</div>
        </div>
      </div>
    );
  }
 
  /* ------------------ UI ------------------ */
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e293b,#020617_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(16,185,129,0.12),rgba(56,189,248,0.12))]" />
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[60px_60px]" />
 
      {/* Content */}
      <div className="relative z-10 px-4 sm:px-6 py-6 flex flex-col max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold">Recordings</h1>
            <p className="text-sm text-slate-400 mt-1">View and manage your videos.</p>
          </div>
 
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Link href="/menu">
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
 
        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/40 text-red-300 p-3 rounded-lg">
            {error}
          </div>
        )}
 
        {/* EMPTY STATE */}
        {videos.length === 0 ? (
          <div className="text-center py-16 border border-white/10 bg-slate-900/40 rounded-3xl backdrop-blur-xl">
            <p className="text-2xl mb-2">🎥</p>
            <p className="text-lg font-medium">No recordings found</p>
            <p className="text-sm text-slate-400 mt-2">
              Start detecting to create recordings.
            </p>
          </div>
        ) : (
          /* GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const detections = video?.detection_result?.totalDetections ?? 0;
 
              return (
                <motion.div
                  key={video.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl bg-slate-900/70 border border-white/10 shadow-lg overflow-hidden backdrop-blur"
                >
                  {/* VIDEO - Use file_url with fallback to file_path */}
                  <video
                    controls
                    className="w-full bg-black aspect-video"
                    src={video.file_url || video.file_path}
                  />
 
                  {/* BODY */}
                  <div className="p-4 space-y-3">
                    {/* Title / Edit */}
                    {editingId === video.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(video.id)}
                          className="p-2 bg-slate-700 rounded hover:bg-slate-600 transition"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 bg-slate-800 rounded hover:bg-slate-700 transition"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-base truncate">
                            {video.video_name}
                          </h3>
 
                          {isAdmin && video.username && (
                            <p className="text-xs text-slate-400 mt-1">
                              {video.username} (
                              {video.user_role === 1 ? "Admin" : "User"})
                            </p>
                          )}
                        </div>
 
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleEditClick(video)}
                            className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition"
                          >
                            <PencilIcon className="w-4 h-4 text-slate-300" />
                          </button>
 
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(video.id)}
                              disabled={deleting === video.id}
                              className="p-2 bg-red-500/20 border border-red-400/40 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deleting === video.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <TrashIcon className="w-4 h-4 text-red-300" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
 
                    {/* Meta */}
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>📅 {formatCaptureTime(video.capture_time)}</p>
                      <p>💾 {formatFileSize(video.file_size_mb)}</p>
                      {detections > 0 && <p>⚡ {detections} detection{detections !== 1 ? 's' : ''}</p>}
                    </div>
 
                    {/* Download */}
                    <a
                      href={video.file_url || video.file_path}
                      download={`${video.video_name}.webm`}
                      className="block text-center mt-3 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition text-sm"
                    >
                      Download
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
 
      {/* PASSWORD MODAL */}
      {showPasswordModal && isAdmin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-950 border border-white/10 p-6 rounded-2xl max-w-md w-full shadow-xl"
          >
            <h2 className="text-xl font-semibold">Confirm Deletion</h2>
            <p className="text-sm text-slate-400 mt-2">
              Please enter your admin password to delete this recording.
            </p>
 
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError("");
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmDelete();
                }
              }}
              className="w-full mt-4 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter password"
              autoFocus
            />
 
            {passwordError && (
              <p className="text-red-400 text-sm mt-2">{passwordError}</p>
            )}
 
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleConfirmDelete}
                disabled={deleting === videoToDelete}
                className="flex-1 py-2 bg-red-500/20 border border-red-400/40 rounded-lg text-red-300 hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === videoToDelete ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
 
              <button
                onClick={handleCancelDelete}
                disabled={deleting === videoToDelete}
                className="flex-1 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}