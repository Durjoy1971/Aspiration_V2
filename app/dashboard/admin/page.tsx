'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#2d3748] flex flex-col relative overflow-hidden">
      {/* Brand Ambient glow blurs */}
      <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-[#5995fd]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[30%] bg-[hsl(39,100%,50%)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Admin Navbar */}
      <header className="border-b border-[#cccc]/50 bg-gradient-to-r from-[hsl(38,100%,98%)] to-[hsl(144,45%,98%)] sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(39,100%,50%)] flex items-center justify-center font-black text-white shadow-md">
              A
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-[#2d3748]">
              Admin <span className="text-[#5995fd]">Control Center</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs sm:text-sm bg-white hover:bg-[#f4f6f9] text-[#4a5568] font-bold p-2 px-4 rounded-lg transition-all cursor-pointer border border-[#cccc]"
            >
              Back to Learner Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {/* Welcome Header */}
        <div className="bg-[#ffffff] border border-[#cccc]/50 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm relative overflow-hidden">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#5995fd]/10 text-[#5995fd] border border-[#5995fd]/20 mb-3">
            👑 Private Control Dashboard
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#2d3748]">
            Admin Control Center
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#4a5568] max-w-2xl leading-relaxed">
            Manage your educational assets, seed standard configurations, create learning categories, update primary skills, and manage user role configurations dynamically.
          </p>
        </div>

        {/* Admin Navigation Hub grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Categories CRUD */}
          <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 hover:shadow-md hover:border-[#38b2ac]/40 transition-all duration-300 flex flex-col group shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#38b2ac]/10 text-[#38b2ac] flex items-center justify-center font-bold text-lg mb-4">
              🗂️
            </div>
            <h3 className="text-lg font-black text-[#2d3748] group-hover:text-[#38b2ac] transition-colors">
              Manage Categories
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#4a5568] flex-1 leading-relaxed">
              Create, edit, reorder, or delete primary learning categories (e.g. Frontend Development, Backend Development, DevOps).
            </p>
            <Link
              href="/dashboard/admin/categories"
              className="mt-6 text-center text-xs bg-[#f4f6f9] hover:bg-[#38b2ac] hover:text-white text-[#38b2ac] font-black p-2.5 rounded-xl border border-[#cccc]/40 transition-all cursor-pointer"
            >
              Open Category Manager
            </Link>
          </div>

          {/* Card 2: Skills CRUD */}
          <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 hover:shadow-md hover:border-[#5995fd]/40 transition-all duration-300 flex flex-col group shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#5995fd]/10 text-[#5995fd] flex items-center justify-center font-bold text-lg mb-4">
              🎯
            </div>
            <h3 className="text-lg font-black text-[#2d3748] group-hover:text-[#5995fd] transition-colors">
              Manage Skills
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#4a5568] flex-1 leading-relaxed">
              Configure curriculum skills, map them to parent categories, set priorities, and associate learning material endpoints.
            </p>
            <Link
              href="/dashboard/admin/skills"
              className="mt-6 text-center text-xs bg-[#f4f6f9] hover:bg-[#5995fd] hover:text-white text-[#5995fd] font-black p-2.5 rounded-xl border border-[#cccc]/40 transition-all cursor-pointer"
            >
              Open Skill Manager
            </Link>
          </div>

          {/* Card 3: SuperAdmin User & Role manager */}
          {user?.role === 'superAdmin' && (
            <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 hover:shadow-md hover:border-[hsl(39,100%,50%)]/40 transition-all duration-300 flex flex-col group shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[hsl(39,100%,50%)]/10 text-[hsl(39,100%,50%)] flex items-center justify-center font-bold text-lg mb-4">
                🔑
              </div>
              <h3 className="text-lg font-black text-[#2d3748] group-hover:text-[hsl(39,100%,50%)] transition-colors">
                Role & Users Panel
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#4a5568] flex-1 leading-relaxed">
                SuperAdmin exclusive: view registered learners, assign administrative permissions, promote moderators, or revoke user flags.
              </p>
              <Link
                href="/dashboard/admin/users"
                className="mt-6 text-center text-xs bg-[#f4f6f9] hover:bg-[hsl(39,100%,50%)] hover:text-white text-[hsl(39,100%,50%)] font-black p-2.5 rounded-xl border border-[#cccc]/40 transition-all cursor-pointer"
              >
                Open User Manager
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#cccc]/50 bg-white text-center py-6 text-xs text-[#4a5568] mt-auto shadow-inner">
        &copy; {new Date().getFullYear()} Aspiration V2 Admin Panel. All rights reserved.
      </footer>
    </div>
  );
}
