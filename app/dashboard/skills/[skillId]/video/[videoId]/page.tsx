'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase/clientApp';
import { useAuthStore } from '../../../../../store/useAuthStore';
import { Category, Skill, VideoStatus } from '../../../../../types';
import { VideoMetadata } from '../../../../../lib/youtube/cacheService';
import { getUserVideoNote, saveUserVideoNote } from '../../../../../lib/firebase/notesService';
import {
  getVideoProgress,
  recomputeSkillProgress,
  upsertVideoProgress,
} from '../../../../../lib/firebase/progressService';
import { AlertTriangle, ArrowLeft, Clock, CheckCircle, X, PlayCircle } from 'lucide-react';

export default function VideoLearningPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.skillId as string;
  const videoId = params.videoId as string;

  const { user, loading } = useAuthStore();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);

  const [noteDraft, setNoteDraft] = useState<string>('');
  const [lastSavedNote, setLastSavedNote] = useState<string>('');
  const [noteSaving, setNoteSaving] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string>('');

  const [videoStatus, setVideoStatus] = useState<VideoStatus>('not_started');
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string>('');

  const [loadingWorkspace, setLoadingWorkspace] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user || !skillId || !videoId) return;

    let active = true;

    const loadWorkspace = async () => {
      try {
        setLoadingWorkspace(true);
        setErrorMsg('');
        setNoteError('');
        setStatusError('');

        const skillRef = doc(db, 'skills', skillId);
        const skillSnap = await getDoc(skillRef);

        if (!skillSnap.exists()) {
          if (active) {
            setErrorMsg('Skill could not be found.');
            setLoadingWorkspace(false);
          }
          return;
        }

        const skillData = { id: skillSnap.id, ...skillSnap.data() } as Skill;

        let parentCategory: Category | null = null;
        if (skillData.categoryId) {
          const catRef = doc(db, 'categories', skillData.categoryId);
          const catSnap = await getDoc(catRef);
          if (catSnap.exists()) {
            parentCategory = { id: catSnap.id, ...catSnap.data() } as Category;
          }
        }

        let loadedVideos: VideoMetadata[] = [];
        if (skillData.videoIds && skillData.videoIds.length > 0) {
          const res = await fetch(`/api/youtube/videos?ids=${skillData.videoIds.join(',')}`);
          if (res.ok) {
            loadedVideos = await res.json();
          }
        } else {
          const queryParam = encodeURIComponent(skillData.name);
          const res = await fetch(`/api/youtube/search?query=${queryParam}&skillId=${skillData.id}`);
          if (res.ok) {
            loadedVideos = await res.json();
          }
        }

        const matchedVideo = loadedVideos.find((video) => video.id === videoId) || null;

        if (!matchedVideo) {
          if (active) {
            setErrorMsg('Video could not be found for this skill path.');
            setLoadingWorkspace(false);
          }
          return;
        }

        const noteDoc = await getUserVideoNote(user.uid, videoId);
        const progressDoc = await getVideoProgress(user.uid, videoId);

        if (!active) return;

        setSkill(skillData);
        setCategory(parentCategory);
        setVideos(loadedVideos);
        setSelectedVideo(matchedVideo);

        const initialNote = noteDoc?.content || '';
        setNoteDraft(initialNote);
        setLastSavedNote(initialNote);
        setVideoStatus(progressDoc?.status || 'not_started');

        setLoadingWorkspace(false);
      } catch (error) {
        console.error('Failed to initialize video learning page:', error);
        if (active) {
          setErrorMsg('Failed to initialize your learning workspace.');
          setLoadingWorkspace(false);
        }
      }
    };

    loadWorkspace();

    return () => {
      active = false;
    };
  }, [user, skillId, videoId]);

  const formatDuration = (isoDuration?: string) => {
    if (!isoDuration) return '10:00';
    try {
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return '10:00';
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const seconds = parseInt(match[3] || '0', 10);

      let result = '';
      if (hours > 0) {
        result += `${hours}:`;
      }
      result += `${minutes.toString().padStart(hours > 0 ? 2 : 1, '0')}:`;
      result += seconds.toString().padStart(2, '0');
      return result;
    } catch {
      return '10:00';
    }
  };

  const persistNote = async (content: string) => {
    if (!user || !skill || !selectedVideo) return;
    if (content === lastSavedNote) return;

    try {
      setNoteSaving(true);
      setNoteError('');
      await saveUserVideoNote(user.uid, skill.id, selectedVideo.id, content);
      setLastSavedNote(content);
    } catch (error) {
      console.error('Failed to save note:', error);
      setNoteError('Note save failed. Your text is still here; retry in a moment.');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleNoteChange = (value: string) => {
    setNoteDraft(value);
    setNoteError('');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void persistNote(value);
    }, 700);
  };

  const handleStatusChange = async (newStatus: VideoStatus) => {
    if (!user || !skill || !selectedVideo) return;

    try {
      setStatusUpdating(true);
      setStatusError('');
      setVideoStatus(newStatus);

      await upsertVideoProgress(user.uid, skill.id, selectedVideo.id, newStatus);
      await recomputeSkillProgress(
        user.uid,
        skill.id,
        videos.map((video) => video.id)
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      setStatusError('Status update failed. Please retry.');
    } finally {
      setStatusUpdating(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#2d3748] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-[#5995fd]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[30%] bg-[#38b2ac]/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="border-b border-[#cccc]/50 bg-gradient-to-r from-[hsl(38,100%,98%)] to-[hsl(144,45%,98%)] sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push(`/dashboard/skills/${skillId}`)}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#4a5568] hover:text-[#5995fd] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Skill
          </button>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#5995fd]/10 text-[#5995fd]">
              {category?.name || 'Curriculum Track'}
            </span>
            <span className="font-extrabold text-sm sm:text-base tracking-tight">
              Video <span className="text-[#5995fd]">Learning</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 flex flex-col gap-8">
        {loadingWorkspace ? (
          <div className="flex-1 flex flex-col justify-center items-center py-20">
            <div className="w-12 h-12 relative mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#5995fd] animate-spin" />
            </div>
            <p className="text-sm font-bold text-[#4a5568] animate-pulse">Loading video learning page...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col justify-center items-center py-12 max-w-md mx-auto text-center">
            <AlertTriangle className="w-16 h-16 mb-4 text-rose-500" />
            <h3 className="text-lg font-bold text-[#2d3748]">{errorMsg}</h3>
            <button
              onClick={() => router.push(`/dashboard/skills/${skillId}`)}
              className="mt-6 bg-[#5995fd] hover:bg-[#4884eb] text-white font-bold p-3 px-6 rounded-xl transition-all shadow-md"
            >
              Return to Skill
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white border border-[#cccc]/50 rounded-2xl overflow-hidden shadow-md flex flex-col">
              {selectedVideo && (
                <>
                  <div className="relative aspect-video w-full max-w-5xl mx-auto bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=0`}
                      title={selectedVideo.title}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <h2 className="text-xl sm:text-2xl font-black text-[#2d3748] leading-snug">{selectedVideo.title}</h2>
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#38b2ac]/10 text-[#38b2ac] border border-[#38b2ac]/20">
                        <Clock className="w-3 h-3" /> {formatDuration(selectedVideo.duration)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#4a5568] font-bold">{skill?.name}</p>
                    <p className="mt-4 text-sm text-[#4a5568] leading-relaxed whitespace-pre-line bg-[#f4f6f9] p-4 rounded-xl border border-[#cccc]/20">
                      {selectedVideo.description || 'No description available for this tutorial.'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black text-[#2d3748]">Private Study Notes</h3>
                  <span className="text-xs font-black text-[#5995fd]">
                    {noteSaving ? 'Saving...' : noteDraft === lastSavedNote ? 'Saved' : 'Unsaved'}
                  </span>
                </div>
                <textarea
                  value={noteDraft}
                  onChange={(event) => handleNoteChange(event.target.value)}
                  onBlur={() => {
                    void persistNote(noteDraft);
                  }}
                  placeholder="Write your learning notes for this video..."
                  rows={10}
                  className="w-full p-3 border border-[#cccc] rounded-xl text-sm bg-white text-[#2d3748] focus:outline-none focus:ring-2 focus:ring-[#5995fd]"
                />
                {noteError && (
                  <p className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {noteError}
                  </p>
                )}
              </div>

              <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-black text-[#2d3748] mb-3">Video Status</h3>
                <p className="text-sm text-[#4a5568] mb-4">
                  Mark your current learning state for this video. Skill completion updates automatically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['not_started', 'in_progress', 'completed'] as VideoStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => void handleStatusChange(status)}
                      disabled={statusUpdating}
                      className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        videoStatus === status
                          ? 'bg-[#5995fd]/15 border-[#5995fd]/30 text-[#5995fd]'
                          : 'bg-white border-[#cccc] text-[#4a5568] hover:bg-[#f4f6f9]'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {statusError && (
                  <p className="mt-3 text-xs font-bold text-rose-600">⚠️ {statusError}</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-[#cccc]/50 bg-white text-center py-6 text-xs text-[#4a5568] shadow-inner">
        &copy; {new Date().getFullYear()} Aspiration V2. Guided Learning Workspace.
      </footer>
    </div>
  );
}
