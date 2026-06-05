'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ExternalLink, Loader2, Download, Receipt, Building2, BarChart3, AlertCircle, Users } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/services/apiClient';
import { toast } from 'react-hot-toast';

interface SubscriptionData {
  currentPlan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
}

interface Invoice {
  id: string;
  number: string;
  amount_paid: number;
  status: string;
  created: number;
  hosted_invoice_url: string | null;
}

interface UsageData {
  logs: { count: number; limit: number | null; percentage: number };
  team: { count: number; limit: number | null; percentage: number };
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const statusParam = searchParams.get('status');

        if (sessionId && statusParam === 'success') {
          // Synchronously verify checkout session on the backend to avoid webhook race conditions
          await apiClient.post('/billing/verify-checkout', { sessionId });
          toast.success('Subscription upgraded successfully!');
          // Clean up the URL without reloading the page
          router.replace('/billing');
        }

        const [subRes, invRes, usageRes] = await Promise.all([
          apiClient.get('/billing/stripe/status'),
          apiClient.get('/billing/stripe/invoices'),
          apiClient.get('/billing/usage')
        ]);
        setSubscription(subRes.data.data);
        setInvoices(invRes.data.data || []);
        setUsage(usageRes.data.data);
      } catch (error) {
        console.error('Failed to fetch billing data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBillingData();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setPortalLoading(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleManageBilling = async () => {
    try {
      setPortalLoading(true);
      const res = await apiClient.post('/billing/create-portal');
      if (res.data.data?.portalUrl) {
        window.location.href = res.data.data.portalUrl;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to open customer portal.');
      setPortalLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-[#0b1326]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const isPro = subscription?.currentPlan !== 'STARTER';
  const isActive = subscription?.status === 'ACTIVE';
  const planName = subscription?.currentPlan ? subscription.currentPlan.charAt(0).toUpperCase() + subscription.currentPlan.slice(1).toLowerCase() : 'Starter';

  return (
    <div className="min-h-screen bg-[#0b1326] p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Billing & Usage</h1>
          <p className="mt-2 text-slate-400">Manage your subscription, view invoices, and monitor platform usage.</p>
        </div>

        {/* Top Section: Usage Summary */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carbon Logs Metric */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-700/40 bg-[#171f33] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Carbon Logs Generated
              </h3>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">This Month</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-white">{usage?.logs.count.toLocaleString() || 0}</span>
              <span className="text-sm text-slate-500">
                / {usage?.logs.limit === null ? 'Unlimited' : usage?.logs.limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className={`h-2 rounded-full ${usage?.logs.limit === null ? 'bg-emerald-500/50 w-full' : 'bg-emerald-500'}`} 
                style={{ width: usage?.logs.limit === null ? '100%' : `${usage?.logs.percentage}%` }}
              ></div>
            </div>
          </motion.div>

          {/* Active Team Members Metric */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-700/40 bg-[#171f33] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4" /> Active Team Members
              </h3>
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">Current</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-white">{usage?.team.count.toLocaleString() || 0}</span>
              <span className="text-sm text-slate-500">
                / {usage?.team.limit === null ? 'Unlimited' : usage?.team.limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className={`h-2 rounded-full ${usage?.team.limit === null ? 'bg-blue-500/50 w-full' : 'bg-blue-500'}`} 
                style={{ width: usage?.team.limit === null ? '100%' : `${usage?.team.percentage}%` }}
              ></div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Current Plan */}
          <div className="lg:col-span-1 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-slate-700/40 bg-[#171f33] p-8 relative overflow-hidden shadow-lg shadow-black/20"
            >
              <div className="absolute right-0 top-0 h-48 w-48 bg-emerald-500/5 blur-3xl rounded-full"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Subscription</h2>
                  {isActive ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-400 border border-yellow-500/20">
                      {subscription?.status || 'Trial'}
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <Building2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{planName} Plan</h3>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-700/50 pt-6 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Current Period</span>
                    <span className="text-sm text-white font-medium">
                      {subscription?.currentPeriodStart ? new Date(subscription.currentPeriodStart).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Next Renewal</span>
                    <span className="text-sm text-white font-medium">
                      {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'Manual'}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  {isPro ? (
                    <button
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      className="flex items-center justify-center w-full gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 border border-slate-600 transition-all"
                    >
                      {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Manage via Stripe
                    </button>
                  ) : (
                    <button
                      onClick={() => window.location.href = '/subscription'}
                      className="flex items-center justify-center w-full gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 transition-all"
                    >
                      Upgrade Plan
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-400">Enterprise Support</h3>
              </div>
              <p className="text-xs text-emerald-200/70 mt-2 leading-relaxed">
                Need to increase your usage limits or discuss custom SLAs? Contact your dedicated account manager.
              </p>
            </div>
          </div>

          {/* Right Column: Invoices Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-slate-700/40 bg-[#171f33] overflow-hidden flex flex-col h-full shadow-lg shadow-black/20"
            >
              <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-slate-400" />
                  <h2 className="text-lg font-semibold text-white">Invoice History</h2>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                {invoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                    <Receipt className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No invoices found for this account.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-800/50 text-xs uppercase text-slate-500 border-b border-slate-700/50">
                      <tr>
                        <th className="px-6 py-4 font-medium">Invoice Number</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Amount</th>
                        <th className="px-6 py-4 font-medium text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-300">
                            {inv.number}
                          </td>
                          <td className="px-6 py-4">
                            {new Date(inv.created * 1000).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            {inv.status === 'paid' ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400 border border-yellow-500/20 capitalize">
                                {inv.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-white">
                            {formatCurrency(inv.amount_paid)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {inv.hosted_invoice_url ? (
                              <a 
                                href={inv.hosted_invoice_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                title="Download Invoice"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-600">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
