'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '../store/useAuthStore';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase/clientApp';
import { seedDatabase } from '../lib/firebase/seed';
import { Category, Skill, SkillProgressDoc } from '../types';
import { filterSkills } from '../lib/utils/filterUtils';

export default function DashboardPage() {
  const { user, loading, logout } = useAuthStore();
  const router = useRouter();

  // Firestore loaded states
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillProgressMap, setSkillProgressMap] = useState<Record<string, SkillProgressDoc>>({});
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Filter and Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [seedingInProgress, setSeedingInProgress] = useState<boolean>(false);

  // Redirect to landing page if the user gets unauthenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Load Firestore data dynamically returning results to avoid direct state set in hook
  const fetchFirestoreData = async (userId: string) => {
    // Fetch Categories sorted by order
    const catQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const catSnapshot = await getDocs(catQuery);
    const catList = catSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];

    // Fetch Skills sorted by order
    const skillQuery = query(collection(db, 'skills'), orderBy('order', 'asc'));
    const skillSnapshot = await getDocs(skillQuery);
    const skillList = skillSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Skill[];

    const progressSnapshot = await getDocs(collection(db, 'progress', userId, 'skills'));
    const progressList = progressSnapshot.docs.map((docItem) =>
      docItem.data()
    ) as SkillProgressDoc[];
    const progressMap = progressList.reduce<Record<string, SkillProgressDoc>>((acc, item) => {
      acc[item.skillId] = item;
      return acc;
    }, {});

    return { categories: catList, skills: skillList, progressMap };
  };

  useEffect(() => {
    if (!user) return;

    let active = true;
    const load = async () => {
      try {
        const { categories: catList, skills: skillList, progressMap } = await fetchFirestoreData(user.uid);
        if (active) {
          setCategories(catList);
          setSkills(skillList);
          setSkillProgressMap(progressMap);
          setLoadingData(false);
        }
      } catch (err) {
        console.error('Failed to load collections from Firestore:', err);
        if (active) {
          setLoadingData(false);
        }
      }
    };
    load();

    return () => {
      active = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const handleSeedDatabase = async () => {
    if (!user) return;

    try {
      setSeedingInProgress(true);
      await seedDatabase();
      const { categories: catList, skills: skillList, progressMap } = await fetchFirestoreData(user.uid);
      setCategories(catList);
      setSkills(skillList);
      setSkillProgressMap(progressMap);
    } catch (err) {
      console.error('Seeding database failed:', err);
    } finally {
      setSeedingInProgress(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center bg-[#f4f6f9] text-[#2d3748]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#5995fd] animate-spin" />
        </div>
        <p className="mt-4 text-sm text-[#4a5568] font-bold animate-pulse">
          Loading learning workspace...
        </p>
      </div>
    );
  }

  // Get active skills filtered by search query and category
  const activeSkills = filterSkills(skills, selectedCategory, searchQuery);

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#2d3748] flex flex-col relative overflow-hidden">
      {/* Brand Design Custom Ambient Glowing Blurs (Clean Bright colors) */}
      <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-[#5995fd]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[30%] bg-[#38b2ac]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navbar Component (using gradient nav: Cream HSL) */}
      <header className="border-b border-[#cccc]/50 bg-gradient-to-r from-[hsl(38,100%,98%)] to-[hsl(144,45%,98%)] sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Primary Orange Brand Emblem */}
            <div className="w-8 h-8 rounded-lg bg-[hsl(39,100%,50%)] flex items-center justify-center font-black text-white shadow-md">
              A
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-[#2d3748]">
              Aspiration <span className="text-[#5995fd]">Workspace</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* User Profile Summary */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-[#2d3748]">{user.displayName}</span>
              <span className="text-xs text-[#5995fd] uppercase tracking-wider font-extrabold capitalize">
                {user.role}
              </span>
            </div>

            <div className="w-9 h-9 rounded-full border border-[#cccc] p-0.5 shadow-sm bg-white">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName}
                  width={36}
                  height={36}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#5995fd] rounded-full flex items-center justify-center font-bold text-sm text-white">
                  {user.displayName.charAt(0)}
                </div>
              )}
            </div>

            {(user.role === 'admin' || user.role === 'superAdmin') && (
              <button
                onClick={() => router.push('/dashboard/admin')}
                className="text-xs sm:text-sm bg-[hsl(39,100%,50%)]/10 hover:bg-[hsl(39,100%,50%)] hover:text-white text-[hsl(39,100%,50%)] font-extrabold p-2 px-4 rounded-lg transition-all cursor-pointer border border-[hsl(39,100%,50%)]/20"
              >
                👑 Admin Center
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="text-xs sm:text-sm bg-white hover:bg-[#f4f6f9] text-[#4a5568] font-bold p-2 px-4 rounded-lg transition-all cursor-pointer border border-[#cccc]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {/* Welcome Block */}
        <div className="bg-[#ffffff] border border-[#cccc]/50 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#5995fd]/10 text-[#5995fd] border border-[#5995fd]/20">
              ⚡ {user.role === 'superAdmin' ? 'Super Admin Workspace' : 'Learner Dashboard'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#2d3748]">
            Welcome, {user.displayName}!
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#4a5568] max-w-xl leading-relaxed">
            Continue mapping your developer skill matrix, watch curated learning modules, and update your personal progress paths.
          </p>
        </div>

        {/* Categories Horizontal Scroll Bar & Search row */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Scrollable category selection capsules */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`p-2 px-5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm ${
                selectedCategory === 'all'
                  ? 'bg-[hsl(39,100%,50%)] hover:bg-[hsl(39,100%,45%)] text-white border-[hsl(39,100%,50%)]'
                  : 'bg-white hover:bg-[#f4f6f9] text-[#2d3748] border-[#cccc]'
              }`}
            >
              All Skills
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-2 px-5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-[#38b2ac] hover:bg-[#2d8a83] text-white border-[#38b2ac]'
                    : 'bg-white hover:bg-[#f4f6f9] text-[#2d3748] border-[#cccc]'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Search box with dynamic search input */}
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-[#4a5568]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search skill title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-[#cccc] rounded-xl bg-white text-sm text-[#2d3748] placeholder-[#4a5568]/60 focus:outline-none focus:ring-2 focus:ring-[#5995fd] focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Database Empty Seeder Prompt (Massive WOW Factor) */}
        {!loadingData && categories.length === 0 && (user?.role === 'admin' || user?.role === 'superAdmin') && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-sm">
            <h3 className="text-lg font-bold text-amber-800 mb-2">
              🗃️ Empty Datastore Detected
            </h3>
            <p className="text-sm text-amber-700 mb-6 leading-relaxed">
              No categories or skills have been seeded into your Firestore database yet. Click the button below to automatically bootstrap Aspiration V2 with default standard curriculum tracks!
            </p>
            <button
              onClick={handleSeedDatabase}
              disabled={seedingInProgress}
              className="bg-[hsl(39,100%,50%)] hover:bg-[hsl(39,100%,45%)] text-white font-bold p-3 px-6 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {seedingInProgress ? 'Seeding Firestore...' : 'Seed Database with Defaults'}
            </button>
          </div>
        )}

        {/* Grid Skills Lists */}
        {loadingData ? (
          /* Shimmer skeletons while loading */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-[#cccc]/50 rounded-2xl p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-[#f4f6f9] w-1/4 rounded-full mb-4" />
                <div className="h-6 bg-[#f4f6f9] w-3/4 rounded-full mb-2" />
                <div className="h-4 bg-[#f4f6f9] w-full rounded-full mb-6" />
                <div className="h-8 bg-[#f4f6f9] w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          categories.length > 0 && (
            <div>
              {activeSkills.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-[#cccc]/50 shadow-sm max-w-md mx-auto">
                  <span className="text-3xl">🔍</span>
                  <h4 className="text-base font-bold text-[#2d3748] mt-3">No matching skills found</h4>
                  <p className="text-xs text-[#4a5568] mt-1 px-4">
                    Adjust your category scroll bar selection or search queries and try again!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeSkills.map((skill) => {
                    // Match category for branding badges
                    const parentCategory = categories.find((c) => c.id === skill.categoryId);
                    const progress = skillProgressMap[skill.id];
                    const completionPercent = progress?.completionPercent ?? 0;
                    const completionStatus = progress?.status ?? 'not_started';
                    const badgeColor =
                      skill.categoryId === 'frontend'
                        ? 'bg-[#38b2ac]/15 text-[#38b2ac]'
                        : skill.categoryId === 'backend'
                        ? 'bg-[#e91e63]/15 text-[#e91e63]'
                        : 'bg-[#5995fd]/15 text-[#5995fd]';

                    return (
                      <div
                        key={skill.id}
                        className="bg-white border border-[#cccc]/50 rounded-2xl p-5 hover:shadow-md hover:border-[#5995fd]/40 transition-all duration-300 flex flex-col group shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${badgeColor}`}>
                            {parentCategory?.name || skill.categoryId}
                          </span>
                          <span className="text-xs text-[#4a5568] font-bold">🎯 Priority {skill.order}</span>
                        </div>

                        <h4 className="text-lg font-bold text-[#2d3748] group-hover:text-[#5995fd] transition-colors leading-tight">
                          {skill.name}
                        </h4>
                        <p className="mt-2 text-xs sm:text-sm text-[#4a5568] flex-1 leading-relaxed">
                          {skill.description}
                        </p>

                        <div className="mt-6 pt-4 border-t border-[#f4f6f9] space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[#4a5568] font-bold">🗂️ {skill.videoIds?.length || 0} curated videos</span>
                            <span className="font-black text-[#5995fd]">{completionPercent}% complete</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#f4f6f9] overflow-hidden">
                            <div
                              className="h-full bg-[#5995fd] transition-all"
                              style={{ width: `${completionPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase tracking-wider font-black text-[#4a5568]">
                              {completionStatus.replace('_', ' ')}
                            </span>
                          <button
                            onClick={() => router.push(`/dashboard/skills/${skill.id}`)}
                            className="text-xs bg-[#f4f6f9] hover:bg-[#5995fd] hover:text-white text-[#5995fd] font-bold p-2 px-4 rounded-lg border border-[#cccc]/40 transition-all cursor-pointer"
                          >
                            Explore Skill
                          </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
            </div>
          )
        )}
      </main>

      {/* Footer Component */}
      <footer className="border-t border-[#cccc]/50 bg-white text-center py-6 text-xs text-[#4a5568] mt-auto shadow-inner">
        &copy; {new Date().getFullYear()} Aspiration V2. All rights reserved. Built with Next.js & Firebase.
      </footer>
    </div>
  );
}
