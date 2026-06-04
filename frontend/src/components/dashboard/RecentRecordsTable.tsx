'use client';

import React from 'react';
import type { HistoricalDataPoint } from '@/types/analytics';

interface RecentRecordsTableProps {
  data: HistoricalDataPoint[];
}

export function RecentRecordsTable({ data }: RecentRecordsTableProps) {
  // Show last 5 months in reverse chronological order
  const rows = [...data].reverse().slice(0, 5);

  function formatMonthLabel(yyyyMM: string) {
    const [year, month] = yyyyMM.split('-');
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            {['Month', 'Scope 1', 'Scope 2', 'Scope 3', 'Total'].map((h) => (
              <th
                key={h}
                className="pb-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.month}
              className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/20 ${
                i === 0 ? 'bg-emerald-500/5' : ''
              }`}
            >
              <td className="py-3 font-medium text-slate-300">{formatMonthLabel(row.month)}</td>
              <td className="py-3 text-emerald-400">
                {(row.details.SCOPE_1 ?? 0).toLocaleString()}
              </td>
              <td className="py-3 text-blue-400">
                {(row.details.SCOPE_2 ?? 0).toLocaleString()}
              </td>
              <td className="py-3 text-violet-400">
                {(row.details.SCOPE_3 ?? 0).toLocaleString()}
              </td>
              <td className="py-3 font-semibold text-white">{row.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
