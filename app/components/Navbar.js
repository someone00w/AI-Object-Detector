'use client';

import { useAuth } from '@/app/lib/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import SettingsPanel from './SettingsPanel';

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => pathname === path;

  const navLinks = [
    { href: '/detection', label: 'Detection' },
    { href: '/recordings', label: 'Recordings' },
    { href: '/statistics', label: 'Statistics' },
  ];

  // Add admin link if user is admin (role === 1)
  if (user?.role === 1) {
    navLinks.push({ href: '/admin', label: 'Admin' });
  }

  return (
    <nav className="w-full bg-slate-950/90 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title - Click to go to menu */}
          <Link 
            href="/menu"
            className="flex items-center gap-3 group"
          >
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.7)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.9)] transition-all">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400 group-hover:text-emerald-300 transition-colors">
                DiddyWatch
              </span>
              <span className="text-xs text-slate-500">
                AI Detection System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.href)
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent'
                  }`}
                >
                  {link.label}
                </motion.div>
              </Link>
            ))}

            {/* Settings Panel */}
            <SettingsPanel />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <SettingsPanel />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-800/50 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 space-y-2 border-t border-slate-800"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive(link.href)
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  }`}
                >
                  {link.label}
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </nav>
  );
}