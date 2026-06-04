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

const industries = [
  'MANUFACTURING',
  'TECHNOLOGY',
  'FINANCE',
  'HEALTHCARE',
  'RETAIL',
  'LOGISTICS',
  'ENERGY',
  'AGRICULTURE',
  'CONSTRUCTION',
  'OTHER',
] as const;

const industryLabels: Record<(typeof industries)[number], string> = {
  MANUFACTURING: 'Manufacturing',
  TECHNOLOGY: 'Technology',
  FINANCE: 'Finance',
  HEALTHCARE: 'Healthcare',
  RETAIL: 'Retail',
  LOGISTICS: 'Logistics',
  ENERGY: 'Energy',
  AGRICULTURE: 'Agriculture',
  CONSTRUCTION: 'Construction',
  OTHER: 'Other',
};

const registerSchema = z.object({
  name: z.string().min(2, 'Please enter your full name.').max(80, 'Name is too long.'),
  email: z.string().email('Please enter a valid business email.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must include at least one number.'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters.').max(100),
  industry: z.enum(industries),
  registrationNumber: z
    .string()
    .min(3, 'Registration number must be at least 3 characters.')
    .max(30, 'Registration number cannot exceed 30 characters.'),
  totalEmployees: z
    .number({ message: 'Total employees must be a number.' })
    .int('Total employees must be a whole number.')
    .positive('Total employees must be greater than zero.')
    .max(1_000_000, 'Total employees is unrealistically high.'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      industry: 'TECHNOLOGY',
      totalEmployees: 10,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setAuthError(null);
      const res = await apiClient.post('/auth/register', data);
      const registerData = res.data?.data;

      if (registerData?.accessToken && registerData?.user) {
        login(registerData.accessToken, registerData.user);
        router.push('/dashboard');
        return;
      }

      // Fallback in case backend contract changes and doesn't auto-return auth payload.
      const loginRes = await apiClient.post('/auth/login', { email: data.email, password: data.password });
      const loginData = loginRes.data?.data;
      if (loginData?.accessToken && loginData?.user) {
        login(loginData.accessToken, loginData.user);
        router.push('/dashboard');
        return;
      }

      throw new Error('Unable to authenticate after registration.');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const backendErrors = axiosError.response?.data?.errors;
      const firstValidationError = backendErrors ? Object.values(backendErrors).flat()[0] : undefined;
      setAuthError(
        firstValidationError ||
          axiosError.response?.data?.message ||
          (err instanceof Error ? err.message : undefined) ||
          'Registration failed. Please verify your details and try again.'
      );
    }
  };

  return (
    <div className="flex h-screen bg-[#0b1326]">
      {/* Left Column: Graphic */}
      <div className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0 bg-[#070b14] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-900/30 via-[#070b14] to-[#070b14]" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <h3 className="text-3xl font-bold tracking-tight text-white mb-6">
              Establish total compliance oversight across your entire supply chain.
            </h3>
            <p className="text-lg text-violet-400/80 font-medium">RBAC Security • Auditable Ledgering</p>
          </div>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex h-screen w-full flex-col justify-start overflow-y-auto px-8 py-8 sm:px-12 lg:w-1/2 lg:justify-center lg:px-24 lg:py-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
              <Leaf className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">CarbonTrack</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Set up your company and administrator account in one step.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {authError && (
              <div className="rounded-lg bg-rose-500/10 p-4 text-sm font-medium text-rose-400 border border-rose-500/20">
                {authError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full rounded-xl border border-slate-700 bg-[#171f33] px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Jane Doe"
                />
                {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-400">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Email Address</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full rounded-xl border border-slate-700 bg-[#171f33] px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="name@company.com"
                />
                {errors.email && <p className="mt-1.5 text-xs font-semibold text-rose-400">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full rounded-xl border border-slate-700 bg-[#171f33] px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="8+ chars, 1 uppercase, 1 number"
                />
                {errors.password && <p className="mt-1.5 text-xs font-semibold text-rose-400">{errors.password.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Company Name</label>
                <input
                  type="text"
                  {...register('companyName')}
                  className="w-full rounded-xl border border-slate-700 bg-[#171f33] px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Acme Sustainability Ltd"
                />
                {errors.companyName && <p className="mt-1.5 text-xs font-semibold text-rose-400">{errors.companyName.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Industry</label>
                <select
                  {...register('industry')}
                  className="w-full rounded-xl border border-slate-700 bg-[#171f33] px-4 py-3.5 text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industryLabels[industry]}
                    </option>
                  ))}
                </select>
                {errors.industry && <p className="mt-1.5 text-xs font-semibold text-rose-400">{errors.industry.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Registration Number</label>
                <input
                  type="text"
                  {...register('registrationNumber')}
                  className="w-full rounded-xl border border-slate-700 bg-[#171f33] px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="CIN / VAT / Tax ID"
                />
                {errors.registrationNumber && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-400">{errors.registrationNumber.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Total Employees</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  {...register('totalEmployees', { valueAsNumber: true })}
                  className="w-full rounded-xl border border-slate-700 bg-[#171f33] px-4 py-3 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g., 250"
                />
                {errors.totalEmployees && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-400">{errors.totalEmployees.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-500/20 transition-all hover:bg-violet-400 hover:shadow-violet-500/40 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Register'}
              {!isSubmitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
