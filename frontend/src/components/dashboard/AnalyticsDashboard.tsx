'use client';

// =============================================================================
// ANALYTICS DASHBOARD — MAIN COMPONENT
// Faithfully implements the "Obsidian Emerald" Stitch design system.
// =============================================================================

import React from 'react';
import { Sparkles, RefreshCw, Download } from 'lucide-react';
import { KpiCardsRow } from '@/components/dashboard/KpiCardsRow';
import { EmissionsLineChart } from '@/components/charts/EmissionsLineChart';
import { ScopeDonutChart } from '@/components/charts/ScopeDonutChart';
import { RecentRecordsTable } from '@/components/dashboard/RecentRecordsTable';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Lock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Skeleton Loader ────────────────────────────────────────────
function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-[#171f33] ${className}`} />
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-36" />
      </div>
      <SkeletonCard className="h-96" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-72" />
      </div>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-800/30 bg-rose-900/10 py-20 text-center">
      <p className="mb-2 text-lg font-semibold text-rose-400">Failed to load analytics data</p>
      <p className="mb-6 text-sm text-slate-500">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg bg-rose-500/20 px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/30 transition-colors"
      >
        <RefreshCw className="h-4 w-4" /> Retry
      </button>
    </div>
  );
}

// ─── Main Dashboard Component ────────────────────────────────────
export default function AnalyticsDashboard() {
  const {
    data,
    chartData,
    scopeBreakdown,
    totalYTD,
    highestScope,
    forecastTotal,
    currentPlan,
    isLoading,
    error,
  } = useDashboardData();

  // The forecast starts after historical data ends
  const forecastStartIndex = data?.historicalData.length ?? 0;

  const generatePDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY?: number } };

    // Brand Header
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129); // Emerald Green
    doc.text('CarbonTrack AI Intelligence', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`IEEE/ESG Report - Generated: ${new Date().toLocaleString()}`, 14, 30);

    // KPI Summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total YTD Emission: ${totalYTD} tCO2e`, 14, 45);
    doc.text(`3-Month ML Forecast: ${forecastTotal} tCO2e`, 14, 52);
    doc.text(`Primary Scope Dominance: ${highestScope.name} (${highestScope.percentage}%)`, 14, 59);

    // Prepare table data from historical records
    const tableData = data.historicalData.map(d => [
      d.month,
      d.total,
      d.details.SCOPE_1 || 0,
      d.details.SCOPE_2 || 0,
      d.details.SCOPE_3 || 0
    ]);

    // Inject AutoTable
    autoTable(doc, {
      startY: 70,
      head: [['Month', 'Total (tCO2e)', 'Scope 1', 'Scope 2', 'Scope 3']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 10 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Forecast table if predictions exist
    if (data.predictedData.length > 0) {
      const finalY = (doc as JsPdfWithAutoTable).lastAutoTable?.finalY || 70;
      
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text('AI Predicted Forecast (3-Months)', 14, finalY + 15);

      const forecastData = data.predictedData.map(p => [
        p.month,
        Math.round(p.co2e)
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Month', 'Predicted Total (tCO2e)']],
        body: forecastData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246], textColor: 255 }, // Violet color for AI
        styles: { fontSize: 10 },
      });
    }

    doc.save('ESG_Compliance_Report.pdf');
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* ── Header Area ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time enterprise metrics & predictions.</p>
        </div>
        
        <button
          onClick={() => {
            if (currentPlan === 'STARTER') {
              window.location.href = '/subscription';
            } else {
              generatePDF();
            }
          }}
          className={`mt-4 sm:mt-0 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            currentPlan === 'STARTER' 
              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' 
              : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25'
          }`}
        >
          {currentPlan === 'STARTER' ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          Export IEEE/ESG Report (PDF)
        </button>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <KpiCardsRow
        totalYTD={totalYTD}
        highestScope={highestScope}
        forecastTotal={forecastTotal}
      />

      {/* ── Main Line Chart ───────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-700/30 bg-[#171f33] p-6 relative overflow-hidden">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Emissions Trend &amp; AI Forecast</h2>
            <p className="mt-1 text-xs text-slate-500">
              12 months historical · 3 months AI projected — linear regression via scikit-learn
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
            <Sparkles className="h-3 w-3" />
            ML Active
          </span>
        </div>
        
        {/* Chart Content (Blurred if STARTER) */}
        <div className={`${currentPlan === 'STARTER' ? 'blur-[8px] pointer-events-none opacity-50 select-none' : ''} transition-all duration-300`}>
          <EmissionsLineChart data={chartData} forecastStartIndex={forecastStartIndex} />
        </div>

        {/* Lock Overlay for STARTER Plan */}
        {currentPlan === 'STARTER' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#171f33]/40 backdrop-blur-[2px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 mb-4 border border-slate-700/50 shadow-xl">
              <Lock className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 tracking-tight drop-shadow-md">AI Forecasting Locked</h3>
            <p className="text-sm text-slate-300 mb-6 max-w-sm text-center drop-shadow-md">
              Upgrade to a Pro or Enterprise plan to unlock machine learning predictions and advanced analytics.
            </p>
            <button
              onClick={() => window.location.href = '/subscription'}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Donut Chart */}
        <div className="rounded-2xl border border-slate-700/30 bg-[#171f33] p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">Scope Distribution</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Based on most recent month: {data.historicalData[data.historicalData.length - 1]?.month}
            </p>
          </div>
          <ScopeDonutChart data={scopeBreakdown} />
        </div>

        {/* Recent Records Table */}
        <div className="rounded-2xl border border-slate-700/30 bg-[#171f33] p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">Recent Records</h3>
            <p className="mt-0.5 text-xs text-slate-500">Last 5 months — tCO₂e per scope</p>
          </div>
          <RecentRecordsTable data={data.historicalData} />
        </div>
      </div>
    </div>
  );
}
