'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (user.role !== 'admin' && user.role !== 'superAdmin') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center bg-[#f4f6f9] text-[#2d3748]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#5995fd] animate-spin" />
        </div>
        <p className="mt-4 text-sm text-[#4a5568] font-bold">
          Verifying admin credentials...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
