import type { Metadata } from 'next';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Dashboard — CarbonTrack',
  description:
    'Monitor real-time carbon emissions, view organisational scope breakdowns, and review AI-powered 3-month forecasts.',
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
// This is a Server Component wrapper (metadata export requires it to be).
// AnalyticsDashboard is a Client Component ('use client') and handles all
// data fetching, charts, and interactive state internally.
export default function DashboardPage() {
  return (
    <div className="min-h-full bg-[#0b1326]">
      <main className="mx-auto max-w-screen-xl px-6 py-8">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}

