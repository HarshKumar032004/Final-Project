'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isInitializing, isAuthenticated, router]);

  // Show a full-screen loader while checking the initial localStorage state
  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0b1326] text-emerald-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  // If we finished initializing but are not authenticated, render nothing (we are redirecting)
  if (!isAuthenticated) {
    return null;
  }

  // Valid authenticated user
  return <>{children}</>;
}
