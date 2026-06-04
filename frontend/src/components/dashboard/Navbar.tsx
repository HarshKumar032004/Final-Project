'use client';

import React from 'react';
import { Leaf, Bell, Settings, Download } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/60 bg-[#0b1326]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
            <Leaf className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">CarbonTrack</span>
        </div>

        {/* Nav Links */}
        <div className="hidden items-center gap-1 md:flex">
          {['Dashboard', 'Analytics', 'Offsets', 'Reporting', 'Compliance'].map((link) => (
            <a
              key={link}
              href="#"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                link === 'Dashboard'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-900 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20">
            <Download className="h-3.5 w-3.5" />
            Download Report
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-bold text-white">
            CT
          </div>
        </div>
      </div>
    </nav>
  );
}
