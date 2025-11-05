"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
    CameraIcon,
    PlayCircleIcon,
    ChartBarIcon,
    ArrowRightOnRectangleIcon,
}
    from "@heroicons/react/24/outline";

export default function MenuPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkSession()
    }, [])

    const checkSession = async () => {
    try {
        const response = await fetch('/api/auth/session')
        
        console.log('Session response status:', response.status) // DEBUG
        
        if (!response.ok) {
            console.log('Not authenticated, redirecting...') // DEBUG
            router.push('/pages/login')
            return
        }

        const data = await response.json()
        console.log('User data:', data.user) // DEBUG
        setUser(data.user)
    } catch (error) {
        console.error('Session check failed:', error)
        router.push('/pages/login')
    } finally {
        setLoading(false)
    }
}

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/pages/login')
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    const menuItems = [
        {
            title : "AI Object Detection",
            desc : "Start detecting objects using live camera.",
            href : "/detection",
            color : "from-indigo-500 to-cyan-500",
            icon : <CameraIcon className= "w-8 h-8" />
        },
        {
            title : "View Recordings",
            desc : "Browse saved detections and recorded footage.",
            href  : "/recordings",
            color : "from-pink-500 to-orange-500",
            icon : <PlayCircleIcon className="w-8 h-8"/>,

        },

        {
            title:"View Statistics",
            desc : "Analyze detection patterns and performance data",
            href : "/statistics",
            color : "from-green-500 to-teal-400",
            icon : <ChartBarIcon className="w-8 h-8"/>,
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    if (!user) {
        return null // Will redirect to login
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
            {/* Header with user info and logout */}
            <div className="w-full px-6 py-4 flex justify-between items-center bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="text-sm">
                        <span className="text-gray-400">Welcome back,</span>
                        <span className="font-semibold text-white ml-2">{user.username}</span>
                        {user.role === 1 && (
                            <span className="ml-2 bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/30">
                                Admin
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-all"
                >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Logout
                </button>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                <h1 className="text-4xl font-bold mb-10 text-center">
                    Choose an Option 🚀
                </h1>

                <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
                    {menuItems.map((item, i) => (
                        <Link key={i} href={item.href}>
                            <motion.div
                                whileHover={{ scale: 1.07 }}
                                whileTap={{ scale: 0.97 }}
                                className={`cursor-pointer group p-8 rounded-2xl bg-gradient-to-br ${item.color} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                                        {item.icon}
                                    </div>
                                    <h2 className="text-2xl font-semibold">{item.title}</h2>
                                </div>
                                <p className="text-sm text-gray-100/90">{item.desc}</p>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}