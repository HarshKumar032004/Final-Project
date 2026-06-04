'use client';

// =============================================================================
// ACCEPT INVITE PAGE — Phase 7
// Route: /accept-invite?token=<hex>
// Reads the invite token from URL, asks user to set a password, then
// calls POST /auth/accept-invite → auto-logs in and redirects to dashboard.
// =============================================================================
export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from 'react'; // Suspense import kiya
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Loader2, CheckCircle2, Eye, EyeOff, AlertTriangle, KeyRound } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import type { AxiosError } from 'axios';

type ApiErrorResponse = { message?: string };

const schema = z
  .object({
    name:            z.string().min(2, 'Name must be at least 2 characters'),
    password:        z.string().min(8, 'Password must be at least 8 characters')
                               .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
                               .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

// 1. Tumhara saara main logic is naye Component mein daal diya
function AcceptInviteContent() {
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const token          = searchParams.get('token');
  const { login }      = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess,   setIsSuccess]   = useState(false);
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!token) {
      setServerError('No invitation token found in the URL. Please use the link from your email.');
    }
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setServerError(null);

    try {
      const res = await apiClient.post('/auth/accept-invite', {
        token,
        password: data.password,
        name: data.name,
      });

      const { accessToken, user } = res.data.data as {
        accessToken: string;
        user: { id: string; name: string; email: string; role: string; companyId: string };
      };

      // Auto-login
      login(accessToken, {
        id:        user.id,
        name:      user.name,
        email:     user.email,
        role:      user.role as Parameters<typeof login>[1]['role'],
        companyId: user.companyId,
      });

      setIsSuccess(true);
      setTimeout(() => router.replace('/dashboard'), 2000);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setServerError(
        axiosErr.response?.data?.message ?? 'Activation failed. The link may have expired.'
      );
    }
  };

  // ── Success State ────────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1326] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">Account Activated!</h2>
          <p className="text-slate-400">Welcome to CarbonTrack. Taking you to your dashboard…</p>
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1326] px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2.5 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 transition group-hover:bg-emerald-500/25">
          <Leaf className="h-5 w-5 text-emerald-400" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">CarbonTrack</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-700/40 bg-[#171f33] p-8 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <KeyRound className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Activate Your Account</h1>
              <p className="mt-1 text-sm text-slate-400">
                Set a strong password to get started with CarbonTrack.
              </p>
            </div>
          </div>

          {/* Token error */}
          {!token && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400" />
              <p className="text-sm text-rose-300">
                Invalid invitation link. Please use the link from your email.
              </p>
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400" />
              <p className="text-sm text-rose-300">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Name */}
            <div>
              <label htmlFor="acc-name" className="mb-1.5 block text-sm font-medium text-slate-300">
                Your Name
              </label>
              <input
                id="acc-name"
                type="text"
                placeholder="Jane Doe"
                autoComplete="name"
                {...register('name')}
                className="w-full rounded-xl border border-slate-700 bg-[#0f1624] px-4 py-3 text-sm text-white placeholder-slate-600
                           outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.name.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="acc-pw" className="mb-1.5 block text-sm font-medium text-slate-300">
                New Password
              </label>
              <div className="relative">
                <input
                  id="acc-pw"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters with uppercase & number"
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-700 bg-[#0f1624] px-4 py-3 pr-11 text-sm text-white placeholder-slate-600
                             outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="acc-confirm" className="mb-1.5 block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="acc-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="w-full rounded-xl border border-slate-700 bg-[#0f1624] px-4 py-3 pr-11 text-sm text-white placeholder-slate-600
                             outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-rose-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold
                         text-slate-900 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Activating Account…</>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Activate Account
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-emerald-500 hover:text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// 2. Main Page ko Suspense mein wrap kar diya
export default function AcceptInvitePage() {
  return (
    <Suspense 
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b1326]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}