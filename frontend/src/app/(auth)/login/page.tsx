'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Leaf, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { AxiosError } from 'axios';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid business email.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ApiErrorResponse = { message?: string };

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setAuthError(null);
      const res = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      const loginData = res.data?.data;

      if (!loginData?.accessToken || !loginData?.user) {
        throw new Error('Invalid login response from server.');
      }

      login(loginData.accessToken, loginData.user);
      
      // Redirect to protected dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setAuthError(
        axiosError.response?.data?.message ||
          (err instanceof Error ? err.message : undefined) ||
          'Invalid email or password.'
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
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your enterprise carbon footprint dashboard.
          </p>

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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-700 bg-[#171f33] px-4 py-3.5 text-white placeholder-slate-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1.5 text-xs font-semibold text-rose-400">{errors.password.message}</p>}
                <div className="mt-2 flex justify-end">
                  <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-slate-300 transition">
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-bold text-slate-900 shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
              {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Don&apos;t have an organizational account?{' '}
            <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Request Access
            </Link>
          </p>
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
