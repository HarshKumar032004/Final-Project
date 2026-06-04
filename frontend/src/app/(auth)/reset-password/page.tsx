'use client';
export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Loader2, Eye, EyeOff, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import apiClient from '@/services/apiClient';
import type { AxiosError } from 'axios';

type ApiErrorResponse = { message?: string };

const schema = z
  .object({
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

function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

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
      setServerError('No reset token found. Please use the link from your email.');
    }
  }, [token]);

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    setServerError(null);
    try {
      await apiClient.post('/auth/reset-password', { token, password: data.password });
      setIsSuccess(true);
      setTimeout(() => router.replace('/login'), 3000);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiErrorResponse>;
      setServerError(
        axiosErr.response?.data?.message ?? 'Reset failed. The link may have expired.'
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1326] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">Password Reset!</h2>
          <p className="text-slate-400">Your password has been updated. Redirecting to sign in…</p>
          <div className="mt-4 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0b1326] px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 transition group-hover:bg-emerald-500/25">
          <Leaf className="h-5 w-5 text-emerald-400" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">CarbonTrack</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-700/40 bg-[#171f33] p-8 shadow-2xl shadow-black/40">
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
              <ShieldCheck className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Set a New Password</h1>
              <p className="mt-1 text-sm text-slate-400">
                Choose a strong password. All existing sessions will be logged out.
              </p>
            </div>
          </div>

          {serverError && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400" />
              <p className="text-sm text-rose-300">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="rp-pw" className="mb-1.5 block text-sm font-medium text-slate-300">
                New Password
              </label>
              <div className="relative">
                <input
                  id="rp-pw"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters with uppercase & number"
                  autoComplete="new-password"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-700 bg-[#0f1624] px-4 py-3 pr-11 text-sm text-white placeholder-slate-600
                             outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
                />
                <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-rose-400">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="rp-confirm" className="mb-1.5 block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="rp-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="w-full rounded-xl border border-slate-700 bg-[#0f1624] px-4 py-3 pr-11 text-sm text-white placeholder-slate-600
                             outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-xs text-rose-400">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting || !token}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold
                         text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 disabled:opacity-60">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Updating Password…</>
              ) : (
                <><ShieldCheck className="h-4 w-4" /> Reset Password</>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-violet-400 hover:text-violet-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b1326]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
