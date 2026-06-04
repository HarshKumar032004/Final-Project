'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from 'recharts';
import type { ScopeBreakdownDatum } from '@/types/analytics';

interface ScopeDonutChartProps {
  data: ScopeBreakdownDatum[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border border-slate-700/50 bg-[#171f33]/95 px-3 py-2 text-sm shadow-xl">
      <span className="font-semibold text-white">{entry.name}: </span>
      <span style={{ color: entry.payload.color }}>{entry.value}%</span>
    </div>
  );
}

export function ScopeDonutChart({ data }: ScopeDonutChartProps) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-2 flex flex-col gap-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-bold" style={{ color: entry.color }}>
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
