'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
} from 'recharts';
import type { ChartDatum } from '@/types/analytics';

interface EmissionsLineChartProps {
  data: ChartDatum[];
  forecastStartIndex: number;
}

// ─── Custom Tooltip ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700/50 bg-[#171f33]/95 backdrop-blur-md px-4 py-3 shadow-2xl shadow-black/50">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.name === 'historical' ? 'Historical' : 'AI Forecast'}:</span>
          <span className="font-bold text-white">{entry.value?.toLocaleString()} tCO₂e</span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Legend ───────────────────────────────────────────────
function CustomLegend() {
  return (
    <div className="flex items-center justify-end gap-6 pr-2 pt-2 text-xs text-slate-400">
      <span className="flex items-center gap-2">
        <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#10b981" strokeWidth="2.5" /></svg>
        Historical
      </span>
      <span className="flex items-center gap-2">
        <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#8b5cf6" strokeWidth="2.5" strokeDasharray="4 3" /></svg>
        AI Prediction
      </span>
    </div>
  );
}

export function EmissionsLineChart({ data, forecastStartIndex }: EmissionsLineChartProps) {
  const dividerLabel = forecastStartIndex < data.length ? data[forecastStartIndex - 1]?.month : undefined;

  return (
    <div>
      <CustomLegend />
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          {dividerLabel && (
            <ReferenceLine
              x={dividerLabel}
              stroke="#334155"
              strokeDasharray="4 4"
              label={{ value: 'FORECAST →', fill: '#64748b', fontSize: 10, position: 'insideTopRight' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="historical"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: '#10b981', stroke: '#0b1326', strokeWidth: 2 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: '#8b5cf6', stroke: '#0b1326', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#0b1326', strokeWidth: 2 }}
            connectNulls={false}
          />
          {/* Hidden Lines for recharts Legend ordering */}
          <Legend content={() => null} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
