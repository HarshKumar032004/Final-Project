'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Users, UserPlus, Loader2, Mail, ShieldAlert } from 'lucide-react';

import type { UserRole } from '@/context/AuthContext';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        setIsLoading(true);
        const res = await apiClient.get('/users');
        setMembers(res.data.data);
      } catch (err: any) {
        setError('Failed to fetch team roster.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeam();
  }, []);

  const isAdmin = user?.role === 'COMPANY_ADMIN';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            <Users className="h-6 w-6 text-violet-400" />
            Team Roster
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage organizational access control and RBAC assignments.
          </p>
        </div>

        {/* RBAC Guarded Button */}
        {isAdmin ? (
          <button className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-violet-500 hover:shadow-violet-500/25">
            <UserPlus className="h-4 w-4" />
            Invite New Member
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-2 text-sm text-slate-400 cursor-not-allowed">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            Admin privileges required to invite
          </div>
        )}
      </div>

      {/* Roster Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-[#171f33] shadow-2xl">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-rose-400">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#121828]">
                <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role Hierarchy</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {members.map((member) => (
                  <tr key={member.id} className="transition-colors hover:bg-slate-800/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-white uppercase">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{member.name}</span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail className="h-3 w-3" /> {member.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        member.role === 'COMPANY_ADMIN'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : member.role === 'AUDITOR'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {member.role === 'COMPANY_ADMIN' ? 'Admin' : member.role === 'DATA_CONTRIBUTOR' ? 'Contributor' : 'Auditor'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.isActive ? (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                          Deactivated
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {member.lastLoginAt
                        ? new Date(member.lastLoginAt).toLocaleDateString()
                        : 'Never logged in'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
