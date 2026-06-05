'use client';

// =============================================================================
// CARBONTRACK — Premium Enterprise Landing Page
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Leaf,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ShieldCheck,
  Building2,
  Globe,
  ChevronRight,
  Database,
  Lock,
  Zap,
  Server,
  LineChart,
  FileText
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b1326] text-white selection:bg-emerald-500/30 selection:text-emerald-200">

      {/* ────────────────────────────────────────────────────────────────────────
          1. NAVIGATION BAR
      ──────────────────────────────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0b1326]/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Leaf className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-xl font-bold tracking-tight">CarbonTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-slate-300 transition hover:text-white sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ────────────────────────────────────────────────────────────────────────
          2. HERO SECTION
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        {/* Background Gradients */}
        <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#0ea5e9] to-[#10b981] opacity-20" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              Announcing CarbonTrack 2.0 Enterprise
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl"
            >
              Enterprise Carbon Intelligence, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Powered by AI.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg leading-8 text-slate-400"
            >
              Transform your sustainability strategy with real-time tracking, predictive machine learning models, and audit-ready reporting. Built for scale, engineered for a zero-carbon future.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex items-center justify-center gap-4"
            >
              <Link
                href="/register"
                className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-emerald-950 shadow-sm hover:bg-emerald-400 transition"
              >
                Start Tracking Today
              </Link>
              <Link
                href="#features"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                View Features <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ────────────────────────────────────────────────────────────────────────
          4. FEATURES SECTION (Bento Grid)
      ──────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Everything you need to reach Net Zero.</h2>
            <p className="mt-4 text-lg text-slate-400">
              A comprehensive suite of tools designed to measure, analyze, and reduce your corporate carbon footprint.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {/* Bento Box 1: Real-time Tracking (Large) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#171f33] p-8 lg:col-span-2"
            >
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl transition-opacity group-hover:bg-emerald-500/20"></div>
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <BarChart3 className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">Real-Time Emission Tracking</h3>
                <p className="mt-2 text-slate-400 max-w-md">
                  Monitor Scope 1, 2, and 3 emissions in real-time. Automatically ingest data from your ERP, cloud providers, and utility bills through our secure API gateways.
                </p>
              </div>
            </motion.div>

            {/* Bento Box 2: AI Predictions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#171f33] p-8"
            >
              <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl transition-opacity group-hover:bg-cyan-500/20"></div>
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                  <BrainCircuit className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">AI-Powered Forecasting</h3>
                <p className="mt-2 text-slate-400">
                  Leverage Scikit-Learn based predictive models to forecast future emissions and identify exact optimization opportunities.
                </p>
              </div>
            </motion.div>

            {/* Bento Box 3: Audit-Ready Reporting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#171f33] p-8"
            >
              <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl transition-opacity group-hover:bg-violet-500/20"></div>
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30">
                  <ShieldCheck className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">Audit-Ready Reporting</h3>
                <p className="mt-2 text-slate-400">
                  Generate immutable, ISO-compliant CSV and PDF exports instantly. Full immutable audit logs for enterprise compliance.
                </p>
              </div>
            </motion.div>

            {/* Bento Box 4: Multi-Tenant Architecture (Large) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#171f33] p-8 lg:col-span-2"
            >
              <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl transition-opacity group-hover:bg-blue-500/20"></div>
              <div className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-white">Secure Multi-Tenant Architecture</h3>
                <p className="mt-2 text-slate-400 max-w-md">
                  Isolated data lakes per tenant. Role-Based Access Control (RBAC) ensures your data is only accessible to authorized personnel within your organization.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          4.5 HOW IT WORKS
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-[#0f1624]/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">From raw data to actionable insights</h2>
            <p className="mt-4 text-lg text-slate-400">
              A streamlined three-step workflow that transforms fragmented energy data into compliance-ready emission reports.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-2xl border border-white/10 bg-[#171f33]/50 p-8 text-center backdrop-blur-sm"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">1. Connect Data</h3>
              <p className="mt-2 text-sm text-slate-400">
                Integrate with AWS, GCP, Azure, and your internal ERP systems via our secure API endpoints to automatically fetch activity data.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative rounded-2xl border border-white/10 bg-[#171f33]/50 p-8 text-center backdrop-blur-sm"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">2. AI Analysis</h3>
              <p className="mt-2 text-sm text-slate-400">
                Our proprietary ML models clean the data, assign emission factors (EPA, DEFRA), and forecast future carbon trajectories.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative rounded-2xl border border-white/10 bg-[#171f33]/50 p-8 text-center backdrop-blur-sm"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">3. Generate Reports</h3>
              <p className="mt-2 text-sm text-slate-400">
                Instantly export immutable, board-ready ESG reports in PDF and CSV formats for compliance and stakeholder reviews.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────────────
          4.6 ENTERPRISE SECURITY
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Bank-grade security for your sensitive ESG data.</h2>
              <p className="mt-4 text-lg text-slate-400">
                We designed CarbonTrack from the ground up to meet the rigorous security requirements of Fortune 500 companies and government agencies.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">SOC 2 Type II Compliant</h3>
                    <p className="mt-1 text-sm text-slate-400">Annual independent audits ensure your data is handled with the highest level of security and confidentiality.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Data Residency & Isolation</h3>
                    <p className="mt-1 text-sm text-slate-400">Choose where your data is stored (US, EU, APAC) with strict logical isolation per tenant database.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Immutable Audit Trails</h3>
                    <p className="mt-1 text-sm text-slate-400">Every action taken by users or API keys is cryptographically logged and cannot be altered or deleted.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative aspect-square rounded-3xl border border-white/10 bg-[#171f33] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5"></div>

              {/* Abstract decorative graphic for security */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm">
                <div className="relative rounded-xl border border-white/10 bg-[#0b1326]/80 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="font-semibold text-sm">System Status</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">Protected</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="h-2 w-full rounded bg-slate-800">
                      <div className="h-2 w-3/4 rounded bg-emerald-500"></div>
                    </div>
                    <div className="h-2 w-full rounded bg-slate-800">
                      <div className="h-2 w-1/2 rounded bg-cyan-500"></div>
                    </div>
                    <div className="h-2 w-full rounded bg-slate-800">
                      <div className="h-2 w-5/6 rounded bg-violet-500"></div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between text-xs text-slate-500">
                    <span>Encryption: AES-256</span>
                    <span>Uptime: 99.99%</span>
                  </div>
                </div>

                {/* Decorative glowing rings */}
                <div className="absolute left-1/2 top-1/2 -z-10 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-500/20 blur-sm"></div>
                <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/10 blur-sm"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ────────────────────────────────────────────────────────────────────────
          5. CTA & FOOTER
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-emerald-500/5"></div>
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to decarbonize your enterprise?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Join the sustainability leaders using CarbonTrack to measure, reduce, and report their environmental impact.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-500 px-8 py-4 text-base font-semibold text-emerald-950 shadow-sm hover:bg-emerald-400 transition"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0b1326] py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-300">
            <Leaf className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold tracking-tight">CarbonTrack</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-400">
            <Link href="#" className="hover:text-white transition">Product</Link>
            <Link href="#" className="hover:text-white transition">Company</Link>
            <Link href="#" className="hover:text-white transition">Legal</Link>
            <Link href="#" className="hover:text-white transition">Contact</Link>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} CarbonTrack Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
