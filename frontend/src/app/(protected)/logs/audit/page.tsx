'use client';

// =============================================================================
// AUDIT LOGS PAGE — Phase 8
// Immutable history of all user actions.
// =============================================================================

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ShieldAlert, Loader2, Search, Filter } from 'lucide-react';
import apiClient from '@/services/apiClient';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async (currentPage: number, action: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '15',
      });
      if (action) params.append('action', action);

      const res = await apiClient.get(`/admin/audit-logs?${params.toString()}`);
      setLogs(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, actionFilter);
  }, [page, actionFilter]);

  const getActionBadge = (action: string) => {
    const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-md border ";
    if (action.includes('CREATE') || action.includes('INVITE')) {
      return baseClasses + "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (action.includes('UPDATE')) {
      return baseClasses + "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    if (action.includes('DELETE') || action.includes('DEACTIVATE')) {
      return baseClasses + "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    if (action.includes('LOGIN') || action.includes('AUTH')) {
      return baseClasses + "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
    return baseClasses + "bg-slate-500/10 text-slate-400 border-slate-500/20";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <ShieldAlert className="h-6 w-6 text-emerald-400" />
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Immutable security and compliance history for your workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by Action (e.g., CREATE_EMISSION)"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value.toUpperCase());
                setPage(1);
              }}
              className="w-64 rounded-xl border border-slate-700 bg-[#171f33] pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-[#171f33] shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/60">
            <thead className="bg-[#0f1624]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Target</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 bg-[#171f33]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-800/30">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-white">{log.user?.name ?? 'System'}</div>
                      <div className="text-xs text-slate-500">{log.user?.email ?? 'N/A'}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={getActionBadge(log.action)}>{log.action}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-slate-300">{log.entityType}</div>
                      <div className="text-xs font-mono text-slate-500">{log.entityId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <pre className="max-w-xs overflow-x-auto rounded-lg bg-[#0b1326] p-2 text-xs text-slate-400">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-700/60 bg-[#0f1624] px-6 py-4">
          <div className="text-sm text-slate-400">
            Showing <span className="font-medium text-white">{(page - 1) * 15 + 1}</span> to{' '}
            <span className="font-medium text-white">{Math.min(page * 15, total)}</span> of{' '}
            <span className="font-medium text-white">{total}</span> logs
          </div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-700 bg-[#171f33] px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page * 15 >= total}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-slate-700 bg-[#171f33] px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
