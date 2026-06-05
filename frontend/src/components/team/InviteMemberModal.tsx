import React, { useState } from 'react';
import { Loader2, Mail, User, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/services/apiClient';
import type { UserRole } from '@/context/AuthContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteMemberModal({ isOpen, onClose, onSuccess }: InviteMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'DATA_CONTRIBUTOR' as UserRole,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/team/invite', formData);
      toast.success('Invitation sent successfully!');
      onSuccess();
      onClose();
      // Reset form
      setFormData({ name: '', email: '', role: 'DATA_CONTRIBUTOR' });
    } catch (error: any) {
      console.error('Invite error:', error);
      
      if (error.response?.status === 403) {
        const errorMsg = error.response.data?.message || '';
        if (errorMsg.includes('limit reached')) {
          toast((t) => (
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Limit Reached
              </span>
              <span className="text-sm text-slate-300">You have reached the 5 member limit for the Starter plan.</span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  window.location.href = '/subscription';
                }}
                className="mt-2 rounded bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-400 w-full text-center transition-colors"
              >
                Upgrade Plan
              </button>
            </div>
          ), { duration: 8000, style: { background: '#171f33', border: '1px solid #334155' } });
          return;
        }
      }

      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#171f33] p-6 shadow-2xl">
        <h2 className="mb-2 text-xl font-bold text-white">Invite New Member</h2>
        <p className="mb-6 text-sm text-slate-400">
          Send an invitation email to add a new member to your workspace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Full Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <input
                required
                type="text"
                placeholder="Jane Doe"
                className="w-full rounded-lg border border-slate-700 bg-[#0b1326] pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Email Address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-slate-500" />
              </div>
              <input
                required
                type="email"
                placeholder="jane@example.com"
                className="w-full rounded-lg border border-slate-700 bg-[#0b1326] pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-400">Role</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Shield className="h-4 w-4 text-slate-500" />
              </div>
              <select
                required
                className="w-full rounded-lg border border-slate-700 bg-[#0b1326] pl-10 pr-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <option value="DATA_CONTRIBUTOR">Contributor (Can log data)</option>
                <option value="AUDITOR">Auditor (Read-only access)</option>
                <option value="COMPANY_ADMIN">Admin (Full access)</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
