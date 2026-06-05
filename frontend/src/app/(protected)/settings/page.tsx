'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Building2, Bell, Shield, Save, Loader2, Boxes, Lock, Database, Server } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/services/apiClient';

type Tab = 'profile' | 'company' | 'notifications' | 'security' | 'integrations';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('STARTER');

  React.useEffect(() => {
    apiClient.get('/billing/stripe/status')
      .then(res => {
        if (res.data?.data?.currentPlan) {
          setCurrentPlan(res.data.data.currentPlan);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    // Mock save delay
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved successfully.');
    }, 1000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
    { id: 'company', label: 'Company Info', icon: <Building2 className="h-4 w-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Boxes className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="mt-2 text-slate-400">Manage your account settings and preferences.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="hidden lg:flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0">
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
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-6">Personal Information</h2>
                
                <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                  <div className="h-24 w-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <User className="h-10 w-10 text-emerald-400" />
                  </div>
                  <div>
                    <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
                      Change Avatar
                    </button>
                    <p className="mt-2 text-xs text-slate-400">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue="Admin User"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="admin@company.com"
                      disabled
                      className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-slate-400 cursor-not-allowed" 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Company Tab */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-6">Company Information</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Company Name</label>
                    <input 
                      type="text" 
                      defaultValue="Acme Corp"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Registration Number / VAT</label>
                    <input 
                      type="text" 
                      defaultValue="VAT-123456789"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Industry</label>
                      <select className="w-full rounded-xl border border-white/10 bg-[#171f33] px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none">
                        <option>Technology</option>
                        <option>Manufacturing</option>
                        <option>Logistics</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Total Employees</label>
                      <input 
                        type="number" 
                        defaultValue="250"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { title: 'Weekly Reports', desc: 'Receive a weekly summary of your carbon emissions.' },
                    { title: 'Goal Alerts', desc: 'Get notified when you are close to exceeding emission targets.' },
                    { title: 'Billing Updates', desc: 'Invoices and subscription renewal reminders.' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-sm text-slate-400 mt-1">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white mb-6">Security & Authentication</h2>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Change Password</p>
                      <p className="text-sm text-slate-400 mt-1">Ensure your account is using a long, random password.</p>
                    </div>
                    <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors">
                      Update
                    </button>
                  </div>

                  <div className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-400 mt-1">Add an extra layer of security to your account.</p>
                    </div>
                    <button className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Enterprise Integrations</h2>
                    <p className="mt-1 text-sm text-slate-400">Connect CarbonTrack with your existing data infrastructure.</p>
                  </div>
                  {currentPlan !== 'ENTERPRISE' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400 border border-violet-500/20">
                      <Lock className="h-3 w-3" />
                      Enterprise Only
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  {/* SAP/ERP Integration */}
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-6 relative overflow-hidden group">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Server className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">SAP / Oracle ERP</h3>
                        <p className="text-xs text-slate-400">Automated Scope 3 sync</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                      Automatically ingest supply chain and procurement data directly from your enterprise ERP system.
                    </p>
                    <button
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        currentPlan === 'ENTERPRISE' 
                          ? 'bg-blue-500 text-white hover:bg-blue-600' 
                          : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      {currentPlan === 'ENTERPRISE' ? 'Configure Connection' : 'Locked'}
                    </button>
                  </div>

                  {/* Snowflake/Data Lake */}
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-6 relative overflow-hidden group">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        <Database className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Snowflake Data Lake</h3>
                        <p className="text-xs text-slate-400">Continuous export</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                      Stream your standardized carbon ledgers to your centralized Snowflake or Databricks lakehouse.
                    </p>
                    <button
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        currentPlan === 'ENTERPRISE' 
                          ? 'bg-cyan-500 text-cyan-950 hover:bg-cyan-400' 
                          : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      {currentPlan === 'ENTERPRISE' ? 'Configure Connection' : 'Locked'}
                    </button>
                  </div>

                  {/* Overlay if not Enterprise */}
                  {currentPlan !== 'ENTERPRISE' && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#171f33]/60 backdrop-blur-[2px] rounded-2xl border border-slate-700/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/90 mb-4 border border-slate-700/50 shadow-xl">
                        <Lock className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 tracking-tight drop-shadow-md">Advanced Integrations Locked</h3>
                      <p className="text-sm text-slate-300 mb-6 max-w-sm text-center drop-shadow-md">
                        Upgrade to Enterprise to unlock direct ERP integrations and data lake streaming.
                      </p>
                      <button
                        onClick={() => window.location.href = '/subscription'}
                        className="flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-200 transition-all hover:scale-105"
                      >
                        Contact Sales for Enterprise
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </motion.div>

          {/* Mobile Save Button */}
          <div className="mt-6 flex lg:hidden">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
