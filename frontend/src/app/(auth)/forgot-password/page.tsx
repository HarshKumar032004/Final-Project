'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import apiClient from '@/services/apiClient';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid business email.'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ApiErrorResponse = { message?: string };

export default function ForgotPasswordPage() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setAuthError(null);
      await apiClient.post('/auth/forgot-password', {
        email: data.email,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setAuthError(
        axiosError.response?.data?.message ||
          (err instanceof Error ? err.message : undefined) ||
          'An error occurred. Please try again.'
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b1326]">
      {/* Left Column: Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-12 lg:w-1/2 lg:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <Leaf className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">CarbonTrack</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {isSuccess ? (
            <div className="mt-8">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
                <h3 className="mb-2 text-lg font-bold text-white">Check your inbox</h3>
                <p className="text-sm text-emerald-100/80">
                  If an account exists for that email address, we've sent instructions on how to reset your password.
                </p>
              </div>
              <div className="mt-8 text-center">
                <Link href="/login" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                  Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
              {authError && (
                <div className="rounded-lg bg-rose-500/10 p-4 text-sm font-medium text-rose-400 border border-rose-500/20">
                  {authError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Email Address</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full rounded-xl border border-slate-700 bg-[#171f33] px-4 py-3.5 text-white placeholder-slate-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="name@company.com"
                  />
                  {errors.email && <p className="mt-1.5 text-xs font-semibold text-rose-400">{errors.email.message}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Link'}
                {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </button>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors">
                  Nevermind, I remembered my password
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Column: Graphic */}
      <div className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0 bg-[#070b14] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-[#070b14] to-[#070b14]" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <h3 className="text-3xl font-bold tracking-tight text-white mb-6">
              The most powerful trajectory optimization engine for enterprise sustainability.
            </h3>
            <p className="text-lg text-emerald-400/80 font-medium">Predictive Intelligence • ML Forecasting</p>
          </div>
        </div>
      </div>
    </div>
  );
}
