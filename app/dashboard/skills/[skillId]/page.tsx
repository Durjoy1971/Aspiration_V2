'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase/clientApp';
import { useAuthStore } from '../../../store/useAuthStore';
import { Skill, Category, SkillProgressDoc, VideoStatus } from '../../../types';
import { VideoMetadata } from '../../../lib/youtube/cacheService';
import { getSkillProgress } from '../../../lib/firebase/progressService';
import { AlertTriangle, ArrowLeft, Target, Play, Inbox } from 'lucide-react';

export default function SkillWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.skillId as string;

  const { user, loading } = useAuthStore();

  // Firestore & API Loaded States
  const [skill, setSkill] = useState<Skill | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [skillProgress, setSkillProgress] = useState<SkillProgressDoc | null>(null);
  const [videoStatusMap, setVideoStatusMap] = useState<Record<string, VideoStatus>>({});
  
  // Loading indicators
  const [loadingWorkspace, setLoadingWorkspace] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Load Workspace Data
  useEffect(() => {
    if (!user || !skillId) return;

    let active = true;

    const loadWorkspace = async () => {
      try {
        setLoadingWorkspace(true);
        setErrorMsg(null);

        // 1. Fetch Skill Document
        const skillRef = doc(db, 'skills', skillId);
        const skillSnap = await getDoc(skillRef);

        if (!skillSnap.exists()) {
          if (active) {
            setErrorMsg('The requested skill pathway could not be found.');
            setLoadingWorkspace(false);
          }
          return;
        }

        const skillData = { id: skillSnap.id, ...skillSnap.data() } as Skill;

        // 2. Fetch Category Document for branding context
        let parentCat: Category | null = null;
        if (skillData.categoryId) {
          const catRef = doc(db, 'categories', skillData.categoryId);
          const catSnap = await getDoc(catRef);
          if (catSnap.exists()) {
            parentCat = { id: catSnap.id, ...catSnap.data() } as Category;
          }
        }

        if (!active) return;
        setSkill(skillData);
        setCategory(parentCat);

        // 3. Retrieve Videos (Priority: curated ids first, fallback to search)
        let loadedVideos: VideoMetadata[] = [];

        if (skillData.videoIds && skillData.videoIds.length > 0) {
          // Fetch curated details in batch
          const res = await fetch(`/api/youtube/videos?ids=${skillData.videoIds.join(',')}`);
          if (res.ok) {
            loadedVideos = await res.json();
          }
        } else {
          // Fetch matching search results using skill keywords, fallback to skill name
          const searchQuery = Array.isArray(skillData.keywords) && skillData.keywords.length > 0
            ? skillData.keywords.join(' OR ')
            : skillData.name;
          const queryParam = encodeURIComponent(searchQuery);
          const res = await fetch(`/api/youtube/search?query=${queryParam}&skillId=${skillData.id}`);
          if (res.ok) {
            loadedVideos = await res.json();
          }
        }

        if (!active) return;
        setVideos(loadedVideos);

        const progressDocsSnapshot = await getDocs(
          query(collection(db, 'progress', user.uid, 'videos'), where('skillId', '==', skillData.id))
        );
        const statusMap = progressDocsSnapshot.docs.reduce<Record<string, VideoStatus>>((acc, docItem) => {
          const data = docItem.data() as { videoId: string; status: VideoStatus };
          acc[data.videoId] = data.status;
          return acc;
        }, {});

        const summary = await getSkillProgress(user.uid, skillData.id);

        if (!active) return;
        setVideoStatusMap(statusMap);
        if (summary) {
          setSkillProgress(summary);
        } else {
          setSkillProgress({
            userId: user.uid,
            skillId: skillData.id,
            totalVideos: loadedVideos.length,
            completedVideos: 0,
            completionPercent: 0,
            status: 'not_started',
          });
        }
        setLoadingWorkspace(false);
      } catch (err) {
        console.error('Failed to load workspace data:', err);
        if (active) {
          setErrorMsg('An unexpected error occurred while setting up the workspace.');
          setLoadingWorkspace(false);
        }
      }
    };

    loadWorkspace();

    return () => {
      active = false;
    };
  }, [user, skillId]);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center bg-[#f4f6f9] text-[#2d3748]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#5995fd] animate-spin" />
        </div>
      </div>
    );
  }

  // Helper to convert ISO 8601 duration (e.g. PT12M30S) to readable text
  const formatDuration = (isoDuration?: string) => {
    if (!isoDuration) return '10:00';
    try {
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return '10:00';
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);
      
      let res = '';
      if (hours > 0) {
        res += `${hours}:`;
      }
      res += `${minutes.toString().padStart(hours > 0 ? 2 : 1, '0')}:`;
      res += seconds.toString().padStart(2, '0');
      return res;
    } catch {
      return '10:00';
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#2d3748] flex flex-col relative overflow-hidden">
      {/* Glow Blur Accents */}
      <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-[#5995fd]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[30%] bg-[#38b2ac]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header element matching the landing styling */}
      <header className="border-b border-[#cccc]/50 bg-gradient-to-r from-[hsl(38,100%,98%)] to-[hsl(144,45%,98%)] sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#4a5568] hover:text-[#5995fd] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[hsl(39,100%,50%)] flex items-center justify-center font-black text-xs text-white">
              A
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight">
              Aspiration <span className="text-[#5995fd]">Console</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 flex flex-col">
        {loadingWorkspace ? (
          // Shimmer loading screen
          <div className="flex-1 flex flex-col justify-center items-center py-20">
            <div className="w-12 h-12 relative mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#5995fd] animate-spin" />
            </div>
            <p className="text-sm font-bold text-[#4a5568] animate-pulse">Initializing training workspace...</p>
          </div>
        ) : errorMsg ? (
          // Error Message screen
          <div className="flex-1 flex flex-col justify-center items-center py-12 max-w-md mx-auto text-center">
            <AlertTriangle className="w-16 h-16 mb-4 text-rose-500" />
            <h3 className="text-lg font-bold text-[#2d3748]">{errorMsg}</h3>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 bg-[#5995fd] hover:bg-[#4884eb] text-white font-bold p-3 px-6 rounded-xl transition-all shadow-md"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-8">
            <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 shadow-sm">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#5995fd]/10 text-[#5995fd]">
                    {category?.name || 'Curriculum Track'}
                  </span>
                  <span className="text-xs text-[#4a5568] font-bold flex items-center gap-1">
                    <Target className="w-3 h-3" /> Priority {skill?.order}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#2d3748] tracking-tight">{skill?.name}</h2>
                <p className="mt-1 text-sm text-[#4a5568] leading-relaxed">{skill?.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#4a5568]">Skill Completion</span>
                  <span className="font-black text-[#5995fd]">{skillProgress?.completionPercent ?? 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#f4f6f9] overflow-hidden">
                  <div
                    className="h-full bg-[#5995fd] transition-all"
                    style={{ width: `${skillProgress?.completionPercent ?? 0}%` }}
                  />
                </div>
                <p className="text-[11px] uppercase tracking-wider font-black text-[#4a5568]">
                  {skillProgress?.status?.replace('_', ' ') || 'not started'}
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#cccc]/50 rounded-2xl p-5 shadow-md flex flex-col flex-1">
              <div className="border-b border-[#f4f6f9] pb-4 mb-4 flex items-center justify-between">
                <h3 className="font-black text-[#2d3748] tracking-tight">Curriculum Tutorials</h3>
                <span className="text-xs bg-[#5995fd]/15 text-[#5995fd] px-2.5 py-0.5 rounded-full font-black">
                  {videos.length} Modules
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {videos.map((vid, index) => {
                  const videoStatus = videoStatusMap[vid.id] || 'not_started';

                  return (
                    <div
                      key={vid.id}
                      className="w-full flex flex-col sm:flex-row gap-3 p-3 rounded-xl border text-left transition-all bg-white hover:bg-[#f4f6f9] border-[#cccc]/40"
                    >
                      <div className="w-full sm:w-60 shrink-0 aspect-video rounded-lg bg-slate-100 border border-[#cccc]/30 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/85 text-[10px] text-white px-1.5 py-0.5 rounded font-black">
                          {formatDuration(vid.duration)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-[#4a5568] font-black uppercase tracking-wider block mb-1">
                          Module {index + 1}
                        </span>
                        <h4 className="text-xs font-bold text-[#2d3748] truncate leading-snug">
                          {vid.title}
                        </h4>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[#4a5568]/60">
                            Added {new Date(vid.publishedAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-black text-[#5995fd]">
                            {videoStatus.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            router.push(`/dashboard/skills/${skillId}/video/${vid.id}`)
                          }
                          className="mt-2 text-xs bg-[#f4f6f9] hover:bg-[#5995fd] hover:text-white text-[#5995fd] font-bold p-2 px-3 rounded-lg border border-[#cccc]/40 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Open Learning Page
                        </button>
                      </div>
                    </div>
                  );
                })}

                {videos.length === 0 && (
                  <div className="text-center py-12 text-[#4a5568]">
                    <Inbox className="w-12 h-12 mx-auto mb-2 text-[#4a5568]/50" />
                    <p className="text-xs font-bold mt-2">No learning resources cached yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Element */}
      <footer className="border-t border-[#cccc]/50 bg-white text-center py-6 text-xs text-[#4a5568] shadow-inner">
        &copy; {new Date().getFullYear()} Aspiration V2. Guided Learning Workspace.
      </footer>
    </div>
  );
}
