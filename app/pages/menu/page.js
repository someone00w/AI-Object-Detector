"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import {
  CameraIcon,
  PlayCircleIcon,
  ChartBarIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

export default function MenuPage() {
  const menuItems = [
    {
      title: "AI Object Detection",
      desc: "Start detecting objects using our live camera!.",
      href: "/detection",
      color: "from-indigo-500 to-cyan-500",
      icon: <CameraIcon className="w-8 h-8" />,
    },
    {
      title: "View Recordings",
      desc: "Browse saved detections and recorded footage.",
      href: "/recordings",
      color: "from-pink-500 to-orange-500",
      icon: <PlayCircleIcon className="w-8 h-8" />,
    },
    {
      title: "View Statistics",
      desc: "Analyze detection patterns and performance data.",
      href: "/statistics",
      color: "from-green-500 to-teal-400",
      icon: <ChartBarIcon className="w-8 h-8" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      {/* HEADER */}
      <header className="w-full py-5 px-8 flex items-center justify-between bg-black/40 backdrop-blur-md border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-wide">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Shafiriz PedoWatch
          </span>{" "}
          Menu
        </h1>

        <nav className="flex gap-6 text-gray-300">
          <Link
            href="/"
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <HomeIcon className="w-5 h-5" /> Home
          </Link>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="grow flex flex-col items-center justify-center p-6">
        <h2 className="text-4xl font-bold mb-10 text-center">
          Choose an Option 🚀
        </h2>

<<<<<<< HEAD
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
                  <h3 className="text-2xl font-semibold">{item.title}</h3>
=======
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
            href  : "/pages/recordings",
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
>>>>>>> a9303d5 (saved videos)
                </div>
                <p className="text-sm text-gray-100/90">{item.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-4 text-center text-gray-500 text-sm border-t border-white/10">
        © {new Date().getFullYear()} VisionAI — Built with Next.js ⚡
      </footer>
    </div>
  );
}