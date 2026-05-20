'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from './store/useAuthStore';
import { AlertTriangle } from 'lucide-react';

export default function LandingPage() {
  const { user, loading, error, loginWithGoogle, logout } = useAuthStore();
  const router = useRouter();

  // Automatically redirect authenticated users to their gated dashboard workspace
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Sign-in failed:', err);
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen justify-center items-center bg-[#f4f6f9] relative overflow-hidden px-4"
      style={{ backgroundImage: 'linear-gradient(90deg, hsl(38, 100%, 98%) 21.32%, hsl(144, 45%, 98%) 130%)' }}
    >
      {/* Dynamic Bright Ambient Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#5995fd]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <main className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-1.5 px-4 rounded-full bg-[#5995fd]/10 border border-[#5995fd]/20 text-[#5995fd] text-xs font-black uppercase tracking-wider mb-4 animate-pulse shadow-sm">
            ✨ Premium Learning Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#2d3748]">
            Aspiration <span className="text-[hsl(39,100%,50%)]">V2</span>
          </h1>
          <p className="mt-2 text-base sm:text-lg text-[#4a5568] font-semibold">
            Guided Skill Pathways for Developers
          </p>
        </div>

        {/* Premium Warm Card-Based UI Layout */}
        <div className="bg-[#ffffff] border border-[#cccc]/40 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {loading ? (
            /* Sleek light loading state */
            <div className="flex flex-col items-center py-8">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#5995fd] animate-spin" />
              </div>
              <p className="mt-4 text-sm text-[#4a5568] font-bold animate-pulse">
                Synchronizing secure session...
              </p>
            </div>
          ) : !user ? (
            /* Unauthenticated landing card */
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-[#2d3748] mb-2 text-center">
                Begin Your Learning Journey
              </h2>
              <p className="text-xs sm:text-sm text-[#4a5568] text-center mb-6 leading-relaxed">
                Access curated video modules, track interactive skill milestones, write persistent private notes, and view your visual progress map.
              </p>

              {error && (
                <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}

              {/* Premium Google Sign-In Button with Brand Blue Actions */}
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-[#5995fd] hover:bg-[#4d84e2] text-white font-bold p-3.5 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 cursor-pointer text-sm sm:text-base border border-[#5995fd]"
              >
                {/* Embedded SVG Google Icon wrapped in circular white bg */}
                <div className="p-1 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
                Sign In with Google
              </button>
            </div>
          ) : (
            /* Authenticated fallback panel */
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full border-2 border-[#5995fd]/30 p-1 mb-4">
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={user.displayName}
                    width={64}
                    height={64}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#5995fd] rounded-full flex items-center justify-center font-bold text-lg text-white">
                    {user.displayName.charAt(0)}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold text-[#2d3748]">
                Welcome back, {user.displayName}!
              </h3>
              <p className="text-xs text-[#5995fd] mt-1.5 uppercase tracking-widest font-extrabold bg-[#5995fd]/10 p-1 px-3 rounded-full border border-[#5995fd]/20 inline-block">
                🔑 {user.role}
              </p>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-[#5995fd] hover:bg-[#4d84e2] text-white font-bold p-3 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-sm shadow-md"
                >
                  Enter Workspace
                </button>
                <button
                  onClick={() => logout()}
                  className="bg-[#f4f6f9] hover:bg-[#e9e9e9] text-[#4a5568] font-bold p-3 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer text-sm border border-[#cccc]/50"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
