'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Building2, Key, FileText, Save, Loader2, Lock, Plus, Trash2, Copy, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/services/apiClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

type Tab = 'profile' | 'company' | 'apikeys' | 'audit';

// Form Schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
});

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().optional(),
  employeeSize: z.number().min(1, 'Must have at least 1 employee').optional(),
});

interface ApiKey {
  id: string;
  name: string;
  key?: string; // Only returned on creation
  lastUsedAt: string | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  details: any;
  ipAddress: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [currentPlan, setCurrentPlan] = useState<string>('STARTER');
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Enterprise State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingEnterprise, setLoadingEnterprise] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  });

  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        const [planRes, profileRes, companyRes] = await Promise.all([
          apiClient.get('/billing/stripe/status').catch(() => null),
          apiClient.get('/settings/profile'),
          apiClient.get('/settings/company'),
        ]);

        if (!isMounted) return;

        if (planRes?.data?.data?.currentPlan) {
          setCurrentPlan(planRes.data.data.currentPlan);
        }

        if (profileRes?.data?.data) {
          profileForm.reset({
            name: profileRes.data.data.name || '',
            email: profileRes.data.data.email || '',
          });
        }

        if (companyRes?.data?.data) {
          companyForm.reset({
            name: companyRes.data.data.name || '',
            industry: companyRes.data.data.industry || '',
            employeeSize: companyRes.data.data.employeeSize || 1,
          });
        }
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    fetchInitialData();
    return () => { isMounted = false; };
  }, [profileForm, companyForm]);

  useEffect(() => {
    if (currentPlan === 'ENTERPRISE' && (activeTab === 'apikeys' || activeTab === 'audit')) {
      const fetchEnterpriseData = async () => {
        setLoadingEnterprise(true);
        try {
          if (activeTab === 'apikeys') {
            const res = await apiClient.get('/settings/api-keys');
            setApiKeys(res.data.data || []);
          } else if (activeTab === 'audit') {
            const res = await apiClient.get('/settings/audit');
            setAuditLogs(res.data.data || []);
          }
        } catch (error) {
          console.error(`Failed to load ${activeTab} data`, error);
        } finally {
          setLoadingEnterprise(false);
        }
      };
      fetchEnterpriseData();
    }
  }, [activeTab, currentPlan]);

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      await apiClient.patch('/settings/profile', data);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const onCompanySubmit = async (data: z.infer<typeof companySchema>) => {
    try {
      await apiClient.patch('/settings/company', data);
      toast.success('Company info updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update company info');
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    try {
      const res = await apiClient.post('/settings/api-keys', { name: newKeyName });
      toast.success('API Key generated');
      setGeneratedKey(res.data.data.key);
      setNewKeyName('');
      // Refresh list
      const listRes = await apiClient.get('/settings/api-keys');
      setApiKeys(listRes.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create API key');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API Key? Integrations using it will immediately fail.')) return;
    try {
      await apiClient.delete(`/settings/api-keys/${id}`);
      setApiKeys(apiKeys.filter(k => k.id !== id));
      toast.success('API Key deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete API key');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'company', label: 'Company Info', icon: <Building2 className="h-4 w-4" /> },
    { id: 'apikeys', label: 'API Keys', icon: <Key className="h-4 w-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <FileText className="h-4 w-4" /> },
  ];

  if (loadingInitial) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="mt-2 text-sm lg:text-base text-slate-400">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-[#171f33] p-6 lg:p-8"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Personal Information</h2>
                  <button
                    type="submit"
                    disabled={profileForm.formState.isSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {profileForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Profile
                  </button>
                </div>
                
                <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                  <div className="h-24 w-24 shrink-0 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <User className="h-10 w-10 text-emerald-400" />
                  </div>
                  <div>
                    <button type="button" className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
                      Change Avatar
                    </button>
                    <p className="mt-2 text-xs text-slate-400">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Full Name</label>
                    <input 
                      {...profileForm.register('name')}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-xs text-rose-500">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                    <input 
                      {...profileForm.register('email')}
                      disabled
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-slate-400 cursor-not-allowed" 
                    />
                  </div>
                </div>
              </form>
            )}

            {/* Company Tab */}
            {activeTab === 'company' && (
              <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">Company Information</h2>
                  <button
                    type="submit"
                    disabled={companyForm.formState.isSubmitting}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {companyForm.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Company
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Company Name</label>
                    <input 
                      {...companyForm.register('name')}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                    />
                    {companyForm.formState.errors.name && (
                      <p className="text-xs text-rose-500">{companyForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Industry</label>
                      <input 
                        {...companyForm.register('industry')}
                        placeholder="e.g. Technology"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Total Employees</label>
                      <input 
                        type="number" 
                        {...companyForm.register('employeeSize', { valueAsNumber: true })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* API Keys Tab (Enterprise) */}
            {activeTab === 'apikeys' && (
              <div className="space-y-6 relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">API Keys</h2>
                    <p className="mt-1 text-sm text-slate-400">Manage API keys for custom ERP integrations.</p>
                  </div>
                  {currentPlan !== 'ENTERPRISE' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400 border border-violet-500/20">
                      <Lock className="h-3 w-3" />
                      Enterprise Only
                    </span>
                  )}
                </div>

                {/* Locked State Overlay */}
                {currentPlan !== 'ENTERPRISE' && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#171f33]/80 backdrop-blur-[4px] rounded-2xl">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 border border-slate-700 shadow-2xl mb-4">
                      <Lock className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 text-center">API Access Locked</h3>
                    <p className="text-sm text-slate-300 mb-6 max-w-sm text-center">
                      Upgrade to Enterprise to generate API keys and build custom integrations with your systems.
                    </p>
                    <button
                      onClick={() => window.location.href = '/subscription'}
                      className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg hover:bg-slate-200 transition-all hover:scale-105"
                    >
                      Upgrade to Enterprise
                    </button>
                  </div>
                )}

                <form onSubmit={handleCreateApiKey} className="flex gap-4">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. SAP Integration Key"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!newKeyName.trim() || currentPlan !== 'ENTERPRISE'}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Generate
                  </button>
                </form>

                {generatedKey && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-white">Save your new API key</h4>
                        <p className="text-xs text-amber-200/70 mt-1 mb-3">
                          This is the only time you will see this key. Please copy it and store it securely.
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-900 px-3 py-2 rounded-lg text-emerald-400 text-sm border border-slate-700 flex-1 break-all">
                            {generatedKey}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedKey);
                              toast.success('Copied to clipboard');
                            }}
                            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {loadingEnterprise ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                  </div>
                ) : (
                  <div className="overflow-x-auto whitespace-nowrap w-full border border-slate-700/50 rounded-xl mt-6">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#121828]">
                        <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-widest text-slate-500">
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Key Prefix</th>
                          <th className="px-6 py-4">Created</th>
                          <th className="px-6 py-4">Last Used</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {apiKeys.map((key) => (
                          <tr key={key.id} className="hover:bg-slate-800/20">
                            <td className="px-6 py-4 font-medium text-white">{key.name}</td>
                            <td className="px-6 py-4 text-slate-400 font-mono">ct_live_...</td>
                            <td className="px-6 py-4 text-slate-400">
                              {new Date(key.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleDeleteApiKey(key.id)}
                                className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {apiKeys.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                              No API keys found. Generate one to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Audit Logs Tab (Enterprise) */}
            {activeTab === 'audit' && (
              <div className="space-y-6 relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Audit Logs</h2>
                    <p className="mt-1 text-sm text-slate-400">Immutable record of security and administrative actions.</p>
                  </div>
                  {currentPlan !== 'ENTERPRISE' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400 border border-violet-500/20">
                      <Lock className="h-3 w-3" />
                      Enterprise Only
                    </span>
                  )}
                </div>

                {/* Locked State Overlay */}
                {currentPlan !== 'ENTERPRISE' && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#171f33]/80 backdrop-blur-[4px] rounded-2xl">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 border border-slate-700 shadow-2xl mb-4">
                      <ShieldCheck className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 text-center">Compliance Locked</h3>
                    <p className="text-sm text-slate-300 mb-6 max-w-sm text-center">
                      Enterprise plans include full audit logging for compliance and security monitoring.
                    </p>
                    <button
                      onClick={() => window.location.href = '/subscription'}
                      className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg hover:bg-slate-200 transition-all hover:scale-105"
                    >
                      Upgrade to Enterprise
                    </button>
                  </div>
                )}

                {loadingEnterprise ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                  </div>
                ) : (
                  <div className="overflow-x-auto whitespace-nowrap w-full border border-slate-700/50 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#121828]">
                        <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-widest text-slate-500">
                          <th className="px-6 py-4">Action</th>
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">IP Address</th>
                          <th className="px-6 py-4 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/20">
                            <td className="px-6 py-4 font-medium text-white">{log.action}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-slate-300">{log.user.name}</span>
                                <span className="text-xs text-slate-500">{log.user.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.ipAddress}</td>
                            <td className="px-6 py-4 text-slate-400 text-right">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {auditLogs.length === 0 && currentPlan === 'ENTERPRISE' && (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                              No audit logs recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
