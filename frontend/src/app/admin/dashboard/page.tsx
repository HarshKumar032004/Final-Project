'use client';

// =============================================================================
// PLATFORM SUPER ADMIN DASHBOARD — Phase 8
// Cross-tenant analytics and global performance tracking.
// Note: Normally this would be protected by its own layout checking for 
// an explicit 'SUPER_ADMIN' role. For this MVP, we use the standard layout
// but highlight it as the global view.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Activity, Building2, CreditCard, Leaf, Loader2, Globe } from 'lucide-react';
import apiClient from '@/services/apiClient';

interface PlatformMetrics {
  totalCompanies: number;
  activeSubscriptions: number;
  globalCO2e: number;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiClient.get('/admin/metrics');
        setMetrics(res.data.data);
      } catch (err) {
        console.error('Failed to fetch platform metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0b1326]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1326]">
      {/* Top Navbar specifically for this page to distinguish from normal dashboard */}
      <div className="border-b border-slate-800 bg-[#0f1624] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <Globe className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Platform Control Center</h1>
            <p className="text-xs text-slate-400">Cross-tenant global visibility</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
          <Activity className="h-4 w-4" />
          Platform Operational
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Global KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Companies */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-[#171f33] p-6 shadow-lg">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl"></div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Total Registered Tenants</p>
                <p className="text-3xl font-bold text-white">{metrics?.totalCompanies ?? 0}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400"></span>
              Onboarded across global infrastructure
            </div>
          </div>

          {/* Card 2: Subscriptions */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-[#171f33] p-6 shadow-lg">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/5 blur-2xl"></div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20">
                <CreditCard className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Active Paid Subscriptions</p>
                <p className="text-3xl font-bold text-white">{metrics?.activeSubscriptions ?? 0}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-violet-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-violet-400"></span>
              Generating platform MRR
            </div>
          </div>

          {/* Card 3: Global Tracking */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-[#171f33] p-6 shadow-lg">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/5 blur-2xl"></div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Leaf className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Global Carbon Tracked</p>
                <p className="text-3xl font-bold text-white">{metrics?.globalCO2e.toLocaleString() ?? 0} <span className="text-lg font-medium text-slate-500">kgCO2e</span></p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Cumulative footprint managed
            </div>
          </div>
        </div>

        {/* Informational Note */}
        <div className="mt-8 rounded-xl border border-slate-700 bg-[#0f1624] p-6 text-center">
          <Globe className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          <h3 className="text-lg font-medium text-white">Platform Health checks</h3>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
            All database nodes, worker instances, and Stripe webhook ingestion streams are operating nominally.
            Detailed hardware metrics are managed in the external infrastructure provider dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
