import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-emerald-500/10 p-4 mb-6">
        <div className="h-12 w-12 rounded-full bg-emerald-500 blur-xl opacity-50 absolute"></div>
        <span className="relative z-10 text-4xl">🌍</span>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        CarbonTrack
      </h1>
      <p className="mt-4 max-w-lg text-lg text-slate-400">
        Enterprise sustainability logic mapped in real-time. Navigate directly to your command center.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
