'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Shield, Building2, Loader2, ArrowRight } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { toast } from 'react-hot-toast';

export default function SubscriptionPricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiClient.get('/billing/stripe/status');
        setStatus(res.data.data);
      } catch (err) {
        console.error('Failed to fetch stripe status', err);
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();

    // Handle bfcache: if the user hits the browser back button from Stripe
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setLoadingPlan(null);
        setLoadingStatus(false);
        toast.error('Checkout was interrupted or cancelled.');
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleSubscribe = async (planId: string) => {
    try {
      setLoadingPlan(planId);
      const res = await apiClient.post('/billing/create-checkout', { planId });
      
      if (res.data.data?.checkoutUrl) {
        window.location.href = res.data.data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Failed to initialize checkout. Please try again.');
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: 'STARTER',
      name: 'Starter',
      description: 'Perfect for small teams beginning their sustainability journey.',
      price: 'Free',
      icon: <Zap className="h-6 w-6 text-slate-400" />,
      features: [
        'Up to 5 team members',
        'Basic Scope 1 & 2 tracking',
        'Standard CSV exports',
        'Community support'
      ],
      cta: 'Upgrade',
      isPopular: false,
      buttonVariant: 'outline'
    },
    {
      id: 'PRO',
      name: 'Pro',
      description: 'Advanced features and AI predictions for growing enterprises.',
      price: '$149',
      period: '/month',
      icon: <Shield className="h-6 w-6 text-emerald-400" />,
      features: [
        'Unlimited team members',
        'Full Scope 1, 2, & 3 tracking',
        'AI-Powered forecasting models',
        'Immutable audit logs & PDF reports',
        'Priority 24/7 support'
      ],
      cta: 'Upgrade to Pro',
      isPopular: true,
      buttonVariant: 'primary'
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      description: 'Advanced carbon accounting for scaling teams.',
      price: '$499',
      period: '/month',
      icon: <Building2 className="h-6 w-6 text-blue-400" />,
      features: [
        'Everything in Pro',
        'Isolated Data Lakes',
        'Custom ERP integrations',
        'Dedicated Account Manager',
        'SLA guarantees'
      ],
      cta: 'Upgrade to Enterprise',
      isPopular: false,
      buttonVariant: 'secondary'
    }
  ];

  if (loadingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1326]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1326] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16 pt-10">
          {status && status.status === 'ACTIVE' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 text-sm font-medium"
            >
              <Check className="h-4 w-4" />
              Your {status.currentPlan.charAt(0).toUpperCase() + status.currentPlan.slice(1).toLowerCase()} plan is active. 
              {status.currentPeriodEnd && ` Next billing cycle: ${new Date(status.currentPeriodEnd).toLocaleDateString()}`}
            </motion.div>
          )}
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white tracking-tight sm:text-5xl"
          >
            Simple, transparent pricing
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-slate-400"
          >
            Invest in your sustainability future. No hidden fees.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const isCurrentPlan = status?.currentPlan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex flex-col rounded-3xl p-8 backdrop-blur-md border ${
                  plan.isPopular 
                    ? 'border-emerald-500/50 bg-[#171f33]/80 shadow-2xl shadow-emerald-500/10' 
                    : 'border-white/10 bg-[#171f33]/40'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-950">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-xl border ${plan.isPopular ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                </div>

                <p className="text-slate-400 text-sm mb-6 h-10">{plan.description}</p>

                <div className="mb-8 flex items-baseline text-white">
                  <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                  {plan.period && <span className="ml-1 text-xl font-medium text-slate-400">{plan.period}</span>}
                </div>

                <ul className="flex-1 space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null || isCurrentPlan || plan.id === 'STARTER'}
                  className={`flex items-center justify-center gap-2 w-full rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
                    isCurrentPlan
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      : plan.buttonVariant === 'primary'
                        ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
                        : plan.id === 'STARTER'
                          ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                          : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {isCurrentPlan ? 'Current Active Plan' : plan.cta}
                      {!isCurrentPlan && plan.id !== 'STARTER' && <ArrowRight className="h-4 w-4" />}
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
