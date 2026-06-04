'use client';

import React from 'react';
import { BarChart3, AlertTriangle, Brain, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  badge?: string;
  trend?: 'up' | 'down';
}

function KpiCard({ title, value, subtitle, icon, accentColor, badge, trend }: KpiCardProps) {
  return (
    <div
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-700/30 bg-[#171f33] p-6 transition-all duration-300 hover:border-slate-600/50 hover:shadow-2xl"
      style={{ boxShadow: `0 0 0 0 ${accentColor}00` }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 40px -12px ${accentColor}33`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${accentColor}00`;
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
      </div>

      {/* KPI Value */}
      <div>
        <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
        <div className="mt-2 flex items-center gap-2">
          {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-rose-400" />}
          {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />}
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        {badge && (
          <span
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

interface KpiCardsRowProps {
  totalYTD: number;
  highestScope: { name: string; percentage: number };
  forecastTotal: number;
}

export function KpiCardsRow({ totalYTD, highestScope, forecastTotal }: KpiCardsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <KpiCard
        title="Total Emissions YTD"
        value={`${totalYTD.toLocaleString()} tCO₂e`}
        subtitle="+2.4% vs last year"
        icon={<BarChart3 className="h-4.5 w-4.5" />}
        accentColor="#10b981"
        trend="up"
      />
      <KpiCard
        title="Highest Emission Scope"
        value={highestScope.name}
        subtitle={`${highestScope.percentage}% of total monthly emissions`}
        icon={<AlertTriangle className="h-4.5 w-4.5" />}
        accentColor="#f59e0b"
      />
      <KpiCard
        title="AI 3-Month Forecast"
        value={`${forecastTotal.toLocaleString()} tCO₂e`}
        subtitle="Linear regression prediction"
        icon={<Brain className="h-4.5 w-4.5" />}
        accentColor="#8b5cf6"
        badge="Powered by ML"
      />
    </div>
  );
}
