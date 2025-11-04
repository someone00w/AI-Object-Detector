"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import {
    CameraIcon,
    PlayCircleIcon,
    ChartBarIcon,
}
    from "@heroicons/react/24/outline";

export default function MenuPage() {
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

     return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-gray-900 via-slate-900 to-black text-white p-6">
      <h1 className="text-4xl font-bold mb-10 text-center">
        Choose an Option 🚀
      </h1>

      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
        {menuItems.map((item, i) => (
          <Link key={i} href={item.href}>
            <motion.div
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.97 }}
              className={`cursor-pointer group p-8 rounded-2xl bg-linear-to-br ${item.color} shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
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
  );
}


