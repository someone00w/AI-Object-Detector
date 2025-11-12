'use client'

import { useAuth } from '@/app/lib/useAuth'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline'
import SettingsPanel from '@/app/components/SettingsPanel'

export default function AdminPage() {
  const { user, loading } = useAuth({ requireAdmin: true })
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [newRole, setNewRole] = useState(2)

  useEffect(() => {
    if (user) {
      fetchUsers()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('User deleted successfully')
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete user')
    }
  }

  const handleUpdateRole = async (userId) => {
    try {
      const response = await fetch('/api/admin/users/update-role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Role updated successfully')
        setEditingUser(null)
        fetchUsers()
      } else {
        alert(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Update role error:', error)
      alert('Failed to update role')
    }
  }

  if (loading || loadingUsers) {
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
        <header className="w-full max-w-7xl mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-xl bg-purple-500/10 border border-purple-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(168,85,247,0.7)]">
              <span className="h-2 w-2 rounded-full bg-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Admin Panel
              </span>
              <span className="text-xs text-slate-500">
                User Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Logged in as: <span className="font-semibold text-white">{user.username}</span>
            </span>
            <Link href="/pages/menu">
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.97, y: 0 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-[11px] sm:text-xs text-slate-200 hover:border-purple-400/60 hover:text-purple-300 transition-all"
              >
                <span className="text-lg leading-none">←</span>
                <span>Back to menu</span>
              </motion.button>
            </Link>
            <SettingsPanel />
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
              <h3 className="text-slate-400 text-sm mb-2">Total Users</h3>
              <p className="text-3xl font-bold">{users.length}</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
              <h3 className="text-slate-400 text-sm mb-2">Admins</h3>
              <p className="text-3xl font-bold">{users.filter(u => u.role === 1).length}</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-slate-900/40 backdrop-blur-xl">
              <h3 className="text-slate-400 text-sm mb-2">Regular Users</h3>
              <p className="text-3xl font-bold">{users.filter(u => u.role === 2).length}</p>
            </div>
          </section>

          {/* Users Table */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-slate-900/40 backdrop-blur-xl">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-xl font-semibold">User Management</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-950/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{u.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-300">{u.full_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-300">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === u.id ? (
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(parseInt(e.target.value))}
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value={1}>Admin</option>
                            <option value={2}>User</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded ${
                            u.role === 1 
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {u.role === 1 ? 'Admin' : 'User'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(u.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {u.id === user.id ? (
                          <span className="text-slate-500 text-xs">You</span>
                        ) : editingUser === u.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdateRole(u.id)}
                              className="px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(null)
                                setNewRole(2)
                              }}
                              className="px-3 py-1 bg-slate-700/50 text-slate-300 border border-slate-700 rounded hover:bg-slate-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(u.id)
                                setNewRole(u.role)
                              }}
                              className="p-2 text-blue-400 hover:bg-blue-500/20 border border-transparent hover:border-blue-500/40 rounded transition-colors"
                              title="Edit role"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="p-2 text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/40 rounded transition-colors"
                              title="Delete user"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}