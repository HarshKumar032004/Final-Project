'use client';

// =============================================================================
// BILLING PAGE — Phase 6
// Displays current plan status and 3 pricing tiers (Starter / Pro / Enterprise)
// Upgrade buttons call POST /api/v1/billing/create-checkout → redirect to Stripe
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Zap,
  Building2,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Star,
  Crown,
} from 'lucide-react';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type PlanId = 'STARTER' | 'PRO' | 'ENTERPRISE';

type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';

interface Subscription {
  id: string;
  planType: PlanId;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

// ─── Plan Definitions ─────────────────────────────────────────────────────────
interface PricingPlan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  badgeColor: string;
  features: string[];
  highlighted: boolean;
}

const PLANS: PricingPlan[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: '$49',
    period: '/ month',
    description: 'For small teams starting their sustainability journey.',
    icon: Zap,
    accentColor: 'border-slate-600/60 hover:border-slate-500/80',
    badgeColor: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
    highlighted: false,
    features: [
      'Up to 5 users',
      'Scope 1 & 2 emission tracking',
      '12-month historical data',
      'Basic PDF reports',
      'Email support',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '$149',
    period: '/ month',
    description: 'For growing companies with advanced analytics needs.',
    icon: Star,
    accentColor: 'border-emerald-500/50 hover:border-emerald-400/80 shadow-emerald-500/10',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    highlighted: true,
    features: [
      'Up to 50 users',
      'Scope 1, 2 & 3 tracking',
      'AI-powered 6-month forecast',
      'Custom emission factors',
      'Full audit log access',
      'Priority email support',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: '$499',
    period: '/ month',
    description: 'For large organisations with compliance mandates.',
    icon: Crown,
    accentColor: 'border-violet-500/40 hover:border-violet-400/80 shadow-violet-500/10',
    badgeColor: 'bg-violet-500/15 text-violet-400 ring-violet-500/30',
    highlighted: false,
    features: [
      'Unlimited users',
      'Full GHG Protocol compliance',
      'AI 12-month forecast + anomaly detection',
      'Dedicated Customer Success Manager',
      'TCFD / CDP / GRI report generation',
      'SSO / SAML integration',
      'SLA — 99.9% uptime guarantee',
    ],
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  ACTIVE:   'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  TRIALING: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  PAST_DUE: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  CANCELED: 'bg-rose-500/15 text-rose-400 ring-rose-500/30',
};

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLES[status]}`}>
      {status === 'TRIALING' ? 'Free Trial' : status.replace('_', ' ')}
    </span>
  );
}

// ─── Current Plan Card ────────────────────────────────────────────────────────
function CurrentPlanCard({ subscription }: { subscription: Subscription | null }) {
  const plan = PLANS.find((p) => p.id === subscription?.planType);

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-[#171f33] p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <CreditCard className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-white">Current Plan</h2>
            {subscription && <StatusBadge status={subscription.status} />}
          </div>
          <p className="mt-1 text-2xl font-bold text-white">
            {plan?.name ?? 'No Plan'}
            {plan && <span className="ml-1 text-sm font-normal text-slate-400">{plan.price}{plan.period}</span>}
          </p>
          {subscription?.trialEndDate && subscription.status === 'TRIALING' && (
            <p className="mt-1 text-sm text-amber-400">
              Trial ends: {new Date(subscription.trialEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {subscription?.endDate && subscription.status === 'ACTIVE' && (
            <p className="mt-1 text-sm text-slate-400">
              Renews: {new Date(subscription.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      {subscription?.status === 'PAST_DUE' && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300">
            Your last payment failed. Please update your payment method to restore full access.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Pricing Tier Card ────────────────────────────────────────────────────────
function PlanCard({
  plan,
  isCurrentPlan,
  isAdmin,
  isUpgrading,
  onUpgrade,
}: {
  plan: PricingPlan;
  isCurrentPlan: boolean;
  isAdmin: boolean;
  isUpgrading: boolean;
  onUpgrade: (planId: PlanId) => void;
}) {
  const Icon = plan.icon;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-[#171f33] p-6 shadow-lg transition-all duration-200
        ${plan.highlighted ? `${plan.accentColor} shadow-xl` : plan.accentColor}`}
    >
      {plan.highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-900 shadow-lg shadow-emerald-500/30">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div className="mb-3 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            plan.highlighted ? 'bg-emerald-500/15' : plan.id === 'ENTERPRISE' ? 'bg-violet-500/15' : 'bg-slate-700/60'
          }`}>
            <Icon className={`h-5 w-5 ${
              plan.highlighted ? 'text-emerald-400' : plan.id === 'ENTERPRISE' ? 'text-violet-400' : 'text-slate-400'
            }`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{plan.name}</h3>
            <span className={`text-xs font-semibold ring-1 rounded-full px-2 py-0.5 ${plan.badgeColor}`}>{plan.id}</span>
          </div>
        </div>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold tracking-tight text-white">{plan.price}</span>
          <span className="mb-1 text-sm text-slate-500">{plan.period}</span>
        </div>
        <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
      </div>

      {/* Feature List */}
      <ul className="mb-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      {isCurrentPlan ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/40 px-4 py-3 text-sm font-semibold text-slate-400 cursor-default">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Current Plan
        </div>
      ) : (
        <button
          onClick={() => onUpgrade(plan.id)}
          disabled={!isAdmin || isUpgrading}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all
            ${!isAdmin
              ? 'cursor-not-allowed border border-slate-700 bg-slate-800/30 text-slate-600'
              : plan.highlighted
              ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-500/40 disabled:opacity-60'
              : plan.id === 'ENTERPRISE'
              ? 'border border-violet-500/40 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 disabled:opacity-60'
              : 'border border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700/60 disabled:opacity-60'
            }`}
          title={!isAdmin ? 'Only Company Admins can upgrade plans' : undefined}
        >
          {isUpgrading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Building2 className="h-4 w-4" />
              Upgrade to {plan.name}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================
export default function BillingPage() {
  const { user } = useAuth();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoadingSub, setIsLoadingSub] = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState<PlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isAdmin = user?.role === 'COMPANY_ADMIN';

  // ── Fetch current subscription ──────────────────────────────────────────────
  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoadingSub(true);
      setFetchError(null);
      const res = await apiClient.get('/billing/subscription');
      setSubscription(res.data.data as Subscription);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setFetchError(axiosErr.response?.data?.message ?? 'Could not load subscription data.');
    } finally {
      setIsLoadingSub(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // ── Handle Upgrade button click ─────────────────────────────────────────────
  const handleUpgrade = async (planId: PlanId) => {
    if (!isAdmin) return;
    setCheckoutError(null);
    setUpgradingPlan(planId);

    try {
      const res = await apiClient.post('/billing/create-checkout', { planId });
      const { checkoutUrl } = res.data.data as { checkoutUrl: string };

      // Redirect the browser to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCheckoutError(
        axiosErr.response?.data?.message ?? 'Failed to initiate checkout. Please try again.'
      );
      setUpgradingPlan(null);
    }
  };

  // ── Read URL params for Stripe redirect result ──────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    if (status === 'success') {
      // Refresh subscription data after successful checkout
      fetchSubscription();
      // Clean up URL params without a full reload
      window.history.replaceState({}, '', '/billing');
    } else if (status === 'cancelled') {
      setCheckoutError('Checkout was cancelled. No charges were made.');
      window.history.replaceState({}, '', '/billing');
    }
  }, [fetchSubscription]);

  return (
    <div className="min-h-full bg-[#0b1326]">
      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Billing & Subscription
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Manage your CarbonTrack plan and upgrade for more features.
            {!isAdmin && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Only Company Admins can change plans.
              </span>
            )}
          </p>
        </div>

        {/* ── Checkout Error Banner ──────────────────────────────────────────── */}
        {checkoutError && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-5 py-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400" />
            <p className="text-sm text-rose-300">{checkoutError}</p>
            <button
              onClick={() => setCheckoutError(null)}
              className="ml-auto text-slate-500 hover:text-slate-300 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* ── Current Plan Card ──────────────────────────────────────────────── */}
        <div className="mb-8">
          {isLoadingSub ? (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-700/40 bg-[#171f33] p-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              <span className="text-sm text-slate-500">Loading subscription data…</span>
            </div>
          ) : fetchError ? (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-800/30 bg-rose-900/10 p-6">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400" />
              <p className="text-sm text-rose-400">{fetchError}</p>
              <button
                onClick={fetchSubscription}
                className="ml-auto text-xs text-rose-400 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          ) : (
            <CurrentPlanCard subscription={subscription} />
          )}
        </div>

        {/* ── Pricing Tier Grid ──────────────────────────────────────────────── */}
        <div>
          <h2 className="mb-5 text-lg font-bold text-white">
            Available Plans
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={subscription?.planType === plan.id}
                isAdmin={isAdmin}
                isUpgrading={upgradingPlan === plan.id}
                onUpgrade={handleUpgrade}
              />
            ))}
          </div>
        </div>

        {/* ── Footer Note ───────────────────────────────────────────────────── */}
        <p className="mt-8 text-center text-xs text-slate-600">
          All plans are billed monthly in USD. Cancel anytime. Payments are processed securely by{' '}
          <span className="text-slate-500">Stripe</span>.
          VAT/GST may apply based on your billing address.
        </p>
      </div>
    </div>
  );
}
