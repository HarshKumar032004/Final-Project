'use client';

// =============================================================================
// PROTECTED APP LAYOUT — Persistent Sidebar
// Upgraded: active nav highlighting, real user data from AuthContext.
// =============================================================================

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Leaf, LayoutDashboard, Database, Users, Settings, LogOut, CreditCard, ShieldCheck } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Logs',      href: '/logs',      icon: Database },
  { name: 'Team',      href: '/team',      icon: Users },
  { name: 'Billing',   href: '/billing',   icon: CreditCard },
  { name: 'Subscription', href: '/subscription', icon: ShieldCheck },
  { name: 'Settings',  href: '/settings',  icon: Settings },
];

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        isActive
          ? 'bg-emerald-500/15 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.2)]'
          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
      }`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
      {label}
      {isActive && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
      )}
    </Link>
  );
}

// ─── Sidebar User Footer ──────────────────────────────────────────────────────
function UserFooter() {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? 'U');

  return (
    <div className="border-t border-slate-800/60 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-700 text-xs font-bold text-white shadow-inner">
          {initials}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-white">
            {user?.name ?? 'Authorized User'}
          </span>
          <span className="truncate text-xs text-slate-500">{user?.email ?? ''}</span>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="ml-auto flex-shrink-0 rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center gap-2.5 border-b border-slate-800/60 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
          <Leaf className="h-4 w-4 text-emerald-400" />
        </div>
        <span className="text-base font-bold tracking-tight text-white">CarbonTrack</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-4">
        {navigation.map((item) => (
          <NavItem
            key={item.name}
            href={item.href}
            icon={item.icon}
            label={item.name}
            isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          />
        ))}
      </nav>

      {/* User Footer with Logout */}
      <UserFooter />
    </>
  );

  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full overflow-hidden bg-[#0b1326]">
        
        {/* Desktop Persistent Left Sidebar */}
        <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-slate-800/60 bg-[#0b1326]/95 backdrop-blur-xl">
          <SidebarContent />
        </aside>

        {/* Mobile Overlay & Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/60 bg-[#0b1326] shadow-2xl md:hidden"
              >
                <div className="absolute right-4 top-4">
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Top Nav */}
          <header className="flex h-16 flex-shrink-0 items-center border-b border-slate-800/60 bg-[#0b1326]/95 px-4 backdrop-blur-xl md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20">
                <Leaf className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white">CarbonTrack</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
