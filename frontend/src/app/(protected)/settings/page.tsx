'use client';

// =============================================================================
// SETTINGS PAGE
// Two-section layout: User Profile & Company Details.
// Uses controlled React state; API wiring is left for the next phase.
// =============================================================================

import React, { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import {
  User,
  Building2,
  Shield,
  KeyRound,
  Save,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─── Role Badge ──────────────────────────────────────────────────────────────
const ROLE_META = {
  COMPANY_ADMIN: { label: 'Company Admin', color: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30' },
  DATA_CONTRIBUTOR: { label: 'Data Contributor', color: 'bg-blue-500/15 text-blue-400 ring-blue-500/30' },
  AUDITOR: { label: 'Auditor', color: 'bg-violet-500/15 text-violet-400 ring-violet-500/30' },
} as const;

function RoleBadge({ role }: { role: keyof typeof ROLE_META }) {
  const meta = ROLE_META[role] ?? ROLE_META.DATA_CONTRIBUTOR;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

// ─── Section Shell ───────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-700/40 bg-[#171f33] p-6 md:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="border-t border-slate-700/40 pt-6">{children}</div>
    </div>
  );
}

// ─── Form Field ──────────────────────────────────────────────────────────────
function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  hint,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-slate-600 shadow-sm transition-colors focus:outline-none focus:ring-1
          ${
            disabled
              ? 'cursor-not-allowed border-slate-800 bg-[#0f1624] text-slate-500'
              : 'border-slate-700 bg-[#0f1624] focus:border-emerald-500 focus:ring-emerald-500'
          }`}
      />
      {hint && <p className="mt-1.5 text-xs text-slate-600">{hint}</p>}
    </div>
  );
}

// ─── Save Button ─────────────────────────────────────────────────────────────
function SaveButton({
  isSaving,
  isSaved,
  label = 'Save Changes',
}: {
  isSaving: boolean;
  isSaved: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={isSaving || isSaved}
      className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSaving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSaved ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {isSaving ? 'Saving…' : isSaved ? 'Saved!' : label}
    </button>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'security', label: 'Security', icon: KeyRound },
] as const;

type TabId = (typeof TABS)[number]['id'];

// =============================================================================
// PAGE COMPONENT
// =============================================================================
export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // ── Profile form state ────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // ── Company form state ────────────────────────────────────────────────────
  const [companyForm, setCompanyForm] = useState({
    companyName: '',
    website: '',
    totalEmployees: '',
  });
  const [companySaving, setCompanySaving] = useState(false);
  const [companySaved, setCompanySaved] = useState(false);

  // ── Password form state ───────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Seed from AuthContext on mount
  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(' ');
      setProfileForm({
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ') ?? '',
      });
    }
  }, [user]);

  // ── Handlers (stub — API wiring Phase 6) ─────────────────────────────────
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    await new Promise((r) => setTimeout(r, 900)); // TODO: PATCH /users/me
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleCompanySave = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySaving(true);
    await new Promise((r) => setTimeout(r, 900)); // TODO: PATCH /companies/me
    setCompanySaving(false);
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 3000);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    setPasswordSaving(true);
    await new Promise((r) => setTimeout(r, 900)); // TODO: POST /auth/change-password
    setPasswordSaving(false);
    setPasswordSaved(true);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const isAdmin = user?.role === 'COMPANY_ADMIN';

  return (
    <div className="min-h-full bg-[#0b1326]">
      <div className="mx-auto max-w-4xl px-6 py-8">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Settings</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Manage your profile, company details, and security preferences.
          </p>
        </div>

        {/* ── Tab Navigation ───────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-1 rounded-xl border border-slate-700/40 bg-[#171f33] p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Profile Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="flex items-center gap-4 rounded-2xl border border-slate-700/40 bg-[#171f33] p-6">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xl font-bold text-white shadow-inner">
                {profileForm.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-base font-semibold text-white">
                  {profileForm.firstName || profileForm.lastName
                    ? `${profileForm.firstName} ${profileForm.lastName}`.trim()
                    : 'Your Name'}
                </p>
                <p className="truncate text-sm text-slate-400">{user?.email}</p>
                <div className="mt-1.5">
                  {user?.role && <RoleBadge role={user.role} />}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-600" />
            </div>

            {/* Edit Form */}
            <Section
              icon={User}
              title="Personal Information"
              description="Update your display name. Email changes require support."
            >
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="First Name"
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="Jane"
                  />
                  <FormField
                    label="Last Name"
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Smith"
                  />
                </div>
                <FormField
                  label="Email Address"
                  id="email"
                  type="email"
                  value={user?.email ?? ''}
                  disabled
                  hint="Email changes are handled by your Company Admin or via support."
                />
                <FormField
                  label="Role"
                  id="role"
                  value={user?.role ? ROLE_META[user.role]?.label ?? user.role : ''}
                  disabled
                  hint="Your role is assigned by your Company Admin."
                />
                <div className="flex justify-end pt-2">
                  <SaveButton isSaving={profileSaving} isSaved={profileSaved} />
                </div>
              </form>
            </Section>
          </div>
        )}

        {/* ── Company Tab ──────────────────────────────────────────────────── */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            {!isAdmin && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
                <Shield className="h-5 w-5 flex-shrink-0 text-amber-400" />
                <p className="text-sm text-amber-300">
                  Only <strong>Company Admins</strong> can modify company settings. Contact your admin to request changes.
                </p>
              </div>
            )}

            <Section
              icon={Building2}
              title="Company Details"
              description="Your organisation's profile on CarbonTrack."
            >
              <form onSubmit={handleCompanySave} className="space-y-5">
                <FormField
                  label="Company Name"
                  id="companyName"
                  value={companyForm.companyName}
                  onChange={(e) => setCompanyForm((p) => ({ ...p, companyName: e.target.value }))}
                  placeholder="Acme Corp Ltd."
                  disabled={!isAdmin}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="Website"
                    id="website"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, website: e.target.value }))}
                    placeholder="https://acme.com"
                    disabled={!isAdmin}
                  />
                  <FormField
                    label="Total Employees"
                    id="totalEmployees"
                    type="number"
                    value={companyForm.totalEmployees}
                    onChange={(e) => setCompanyForm((p) => ({ ...p, totalEmployees: e.target.value }))}
                    placeholder="250"
                    disabled={!isAdmin}
                  />
                </div>
                {isAdmin && (
                  <div className="flex justify-end pt-2">
                    <SaveButton isSaving={companySaving} isSaved={companySaved} label="Save Company" />
                  </div>
                )}
              </form>
            </Section>

            {/* Subscription Plan Card */}
            <Section
              icon={Shield}
              title="Current Subscription Plan"
              description="Manage your billing and plan details."
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Starter Plan</p>
                  <p className="text-xs text-slate-500">Trialing — upgrade for advanced ML features</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                >
                  Upgrade Plan
                </button>
              </div>
            </Section>
          </div>
        )}

        {/* ── Security Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Section
              icon={KeyRound}
              title="Change Password"
              description="Use a strong password with a mix of letters, numbers and symbols."
            >
              <form onSubmit={handlePasswordSave} className="space-y-5">
                {passwordError && (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400">
                    {passwordError}
                  </div>
                )}
                <FormField
                  label="Current Password"
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    label="New Password"
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min. 8 characters"
                    hint="Must include at least one uppercase letter and one number."
                  />
                  <FormField
                    label="Confirm New Password"
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <SaveButton isSaving={passwordSaving} isSaved={passwordSaved} label="Update Password" />
                </div>
              </form>
            </Section>

            {/* Active Sessions — placeholder card */}
            <Section
              icon={Shield}
              title="Active Sessions"
              description="Devices currently logged into your account."
            >
              <div className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-[#0f1624] px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">Current Device</p>
                  <p className="text-xs text-slate-500">Active now · JWT session</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
