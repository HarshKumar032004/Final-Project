'use client';

import React, { useState, useEffect } from 'react';
import type { AxiosError } from 'axios';
import apiClient from '@/services/apiClient';
import { Plus, Loader2, Info, AlertTriangle, RefreshCw, Download, FileText, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';

type EmissionScope = 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
type EmissionCategory =
  | 'ELECTRICITY'
  | 'NATURAL_GAS'
  | 'FLEET_VEHICLES'
  | 'AIR_TRAVEL'
  | 'GROUND_TRAVEL'
  | 'WASTE'
  | 'WATER'
  | 'REFRIGERANTS'
  | 'PURCHASED_GOODS'
  | 'EMPLOYEE_COMMUTE'
  | 'OTHER';

interface EmissionRecord {
  id: string;
  scope: EmissionScope;
  category: EmissionCategory;
  description: string | null;
  calculatedCO2e: number;
  dateLogged: string;
  createdAt: string;
}

interface EmissionLogsData {
  items: EmissionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalCO2e: number;
    avgCO2e: number;
    unit: string;
  };
}

interface ApiSuccessResponse<T> {
  success: boolean;
  message: string;
  data: {
    [key: string]: unknown;
  } & T;
}

interface ApiErrorResponse {
  message?: string;
}

function normalizeEmissionItems(payload: ApiSuccessResponse<EmissionLogsData>['data'] | undefined): EmissionRecord[] {
  const items = payload?.items;
  return Array.isArray(items) ? items : [];
}

export default function LogsPage() {
  const [logs, setLogs] = useState<EmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('STARTER');
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    scope: 'SCOPE_1' as EmissionScope,
    category: 'ELECTRICITY' as EmissionCategory,
    amount: 0,
    unit: 'kwh',
    emissionFactor: 1,
    dateLogged: new Date().toISOString().split('T')[0],
  });

  async function fetchLogs() {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiSuccessResponse<EmissionLogsData>>('/emissions');
      setLogs(normalizeEmissionItems(res.data?.data));
      setError(null);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error('Failed to fetch logs:', err);
      setLogs([]);
      setError(
        axiosError.response?.data?.message ||
          (err instanceof Error ? err.message : undefined) ||
          'Failed to fetch emission logs.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialLogs() {
      try {
        const [res, planRes] = await Promise.all([
          apiClient.get<ApiSuccessResponse<EmissionLogsData>>('/emissions'),
          apiClient.get('/billing/stripe/status').catch(() => null)
        ]);
        if (!cancelled) {
          setLogs(normalizeEmissionItems(res.data?.data));
          if (planRes?.data?.data?.currentPlan) {
            setCurrentPlan(planRes.data.data.currentPlan);
          }
          setError(null);
        }
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        console.error('Failed to fetch logs:', err);
        if (!cancelled) {
          setLogs([]);
          setError(
            axiosError.response?.data?.message ||
              (err instanceof Error ? err.message : undefined) ||
              'Failed to fetch emission logs.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialLogs();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/emissions', {
        description: formData.description,
        scope: formData.scope,
        category: formData.category,
        amount: Number(formData.amount),
        unit: formData.unit,
        emissionFactor: Number(formData.emissionFactor),
        dateLogged: new Date(formData.dateLogged).toISOString(),
      });
      setIsModalOpen(false);
      setFormData({
        description: '',
        scope: 'SCOPE_1',
        category: 'ELECTRICITY',
        amount: 0,
        unit: 'kwh',
        emissionFactor: 1,
        dateLogged: new Date().toISOString().split('T')[0],
      });
      fetchLogs(); // refresh data
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error('Failed to create log:', err);
      
      if (axiosError.response?.status === 403) {
        const errorMsg = axiosError.response.data?.message || '';
        if (errorMsg.includes('limit reached')) {
          toast((t) => (
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Limit Reached
              </span>
              <span className="text-sm text-slate-300">You have reached the 100 logs limit for the Starter plan.</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  window.location.href = '/subscription';
                }}
                className="mt-2 rounded bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 w-full text-center transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          ), { duration: 8000, style: { background: '#171f33', border: '1px solid #334155' } });
        } else {
          toast.error("Access Restricted: Only Contributors and Admins can log emissions.", { duration: 5000 });
        }
      } else {
        toast.error(
          axiosError.response?.data?.message ||
            (err instanceof Error ? err.message : 'Failed to create emission log.')
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Emission Logs</h1>
          <p className="mt-1 text-sm text-slate-400">View and manage discrete carbon input records.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-r border-slate-700/50 pr-3 mr-1">
            <button
              onClick={async () => {
                try {
                  setIsExportingCsv(true);
                  const res = await apiClient.get('/export/csv', { responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'emission_logs.csv');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch {
                  toast.error('Failed to export CSV');
                } finally {
                  setIsExportingCsv(false);
                }
              }}
              disabled={isExportingCsv}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
            >
              {isExportingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              CSV
            </button>
            <button
              onClick={async () => {
                if (currentPlan === 'STARTER') {
                  toast((t) => (
                    <div className="flex flex-col gap-2">
                      <span className="font-semibold text-white flex items-center gap-2">
                        <Lock className="h-4 w-4 text-emerald-400" />
                        Unlock PDF Reports
                      </span>
                      <span className="text-sm text-slate-300">Upgrade to Pro or Enterprise to download professional PDF reports.</span>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          window.location.href = '/subscription';
                        }}
                        className="mt-2 rounded bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 w-full text-center transition-colors"
                      >
                        Upgrade Plan
                      </button>
                    </div>
                  ), { duration: 8000, style: { background: '#171f33', border: '1px solid #334155' } });
                  return;
                }
                
                try {
                  setIsExportingPdf(true);
                  const res = await apiClient.get('/export/pdf', { responseType: 'blob' });
                  const url = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'Emissions_Report.pdf');
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch {
                  toast.error('Failed to export PDF');
                } finally {
                  setIsExportingPdf(false);
                }
              }}
              disabled={isExportingPdf}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                currentPlan === 'STARTER' 
                  ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed hover:bg-slate-800' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : currentPlan === 'STARTER' ? <Lock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              PDF
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" /> New Log
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/30 bg-[#171f33] overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col h-64 items-center justify-center text-center px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 mb-4">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Failed to load logs</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md">{error}</p>
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-[#121828]">
                <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Scope</th>
                  <th className="px-6 py-4 text-right">kgCO₂e</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="px-6 py-4 text-slate-300">
                      {new Date(log.dateLogged).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{log.description || 'Untitled activity'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.scope === 'SCOPE_1' ? 'bg-emerald-500/10 text-emerald-400' :
                        log.scope === 'SCOPE_2' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-violet-500/10 text-violet-400'
                      }`}>
                        {log.scope.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-400">
                      {log.calculatedCO2e.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No emission records found. Create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* New Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#171f33] p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold text-white">Log Emission Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-400">Description</label>
                <input
                  required
                  type="text"
                  className="w-full rounded-lg border border-slate-700 bg-[#0b1326] px-3 py-2 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Office Electricity HQ"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm text-slate-400">
                    Scope
                    <div className="group relative flex items-center">
                      <Info className="h-4 w-4 text-slate-500 hover:text-emerald-400 cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 mb-2 hidden w-64 -translate-x-1/2 flex-col rounded-lg bg-[#0f1624] p-3 text-xs text-slate-300 shadow-xl border border-slate-700/50 group-hover:flex z-50">
                        <strong className="text-white mb-1">GHG Scopes</strong>
                        <ul className="space-y-1 list-disc list-inside">
                          <li><span className="text-emerald-400">Scope 1:</span> Direct emissions (e.g. company vehicles).</li>
                          <li><span className="text-emerald-400">Scope 2:</span> Indirect (e.g. purchased electricity).</li>
                          <li><span className="text-emerald-400">Scope 3:</span> Value chain (e.g. supply chain).</li>
                        </ul>
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <select
                      className="w-full rounded-lg border border-slate-700 bg-[#0b1326] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none appearance-none"
                      value={formData.scope}
                      onChange={(e) => setFormData({ ...formData, scope: e.target.value as EmissionScope })}
                    >
                      <option value="SCOPE_1">Scope 1</option>
                      <option value="SCOPE_2">Scope 2</option>
                      <option value="SCOPE_3" disabled={currentPlan === 'STARTER'}>
                        Scope 3 {currentPlan === 'STARTER' ? '(Requires Pro)' : ''}
                      </option>
                    </select>
                    {currentPlan === 'STARTER' && formData.scope !== 'SCOPE_3' && (
                      <div className="group absolute right-8 top-1/2 -translate-y-1/2 flex items-center">
                        <Lock className="h-4 w-4 text-slate-500 hover:text-emerald-400 cursor-help transition-colors" />
                        <div className="absolute bottom-full right-0 mb-2 hidden w-40 rounded-lg bg-[#0f1624] p-2 text-xs text-slate-300 shadow-xl border border-slate-700/50 group-hover:block z-50">
                          Unlock Scope 3 tracking with a Pro plan.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Category</label>
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-[#0b1326] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as EmissionCategory })}
                  >
                    <option value="ELECTRICITY">Electricity</option>
                    <option value="NATURAL_GAS">Natural Gas</option>
                    <option value="FLEET_VEHICLES">Fleet Vehicles</option>
                    <option value="AIR_TRAVEL">Air Travel</option>
                    <option value="GROUND_TRAVEL">Ground Travel</option>
                    <option value="WASTE">Waste</option>
                    <option value="WATER">Water</option>
                    <option value="REFRIGERANTS">Refrigerants</option>
                    <option value="PURCHASED_GOODS">Purchased Goods</option>
                    <option value="EMPLOYEE_COMMUTE">Employee Commute</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Date</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-lg border border-slate-700 bg-[#0b1326] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    value={formData.dateLogged}
                    onChange={(e) => setFormData({ ...formData, dateLogged: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm text-slate-400">
                    Emission Factor
                    <div className="group relative flex items-center">
                      <Info className="h-4 w-4 text-slate-500 hover:text-emerald-400 cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 mb-2 hidden w-56 -translate-x-1/2 flex-col rounded-lg bg-[#0f1624] p-3 text-xs text-slate-300 shadow-xl border border-slate-700/50 group-hover:flex z-50">
                        <strong className="text-white mb-1">What is this?</strong>
                        <p>The multiplier used to calculate total CO2e from 1 unit of this activity (e.g. kg CO2e per kWh).</p>
                      </div>
                    </div>
                  </label>
                  <input
                    required
                    type="number"
                    min="0.0001"
                    step="any"
                    className="w-full rounded-lg border border-slate-700 bg-[#0b1326] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    value={formData.emissionFactor}
                    onChange={(e) => setFormData({ ...formData, emissionFactor: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Amount</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="any"
                    className="w-full rounded-lg border border-slate-700 bg-[#0b1326] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-400">Unit</label>
                  <select
                    className="w-full rounded-lg border border-slate-700 bg-[#0b1326] px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="kwh">kWh</option>
                    <option value="liters">Liters</option>
                    <option value="tons">Tons</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
