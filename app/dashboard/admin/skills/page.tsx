'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase/clientApp';
import { Category, Skill } from '../../../types';
import { AlertTriangle, CheckCircle, ChevronUp, ChevronDown, Pencil, Trash2, X, Plus, Target, Eye, Video } from 'lucide-react';

export default function AdminSkillsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form parameters
  const [skillId, setSkillId] = useState<string>('');
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [skillName, setSkillName] = useState<string>('');
  const [skillDesc, setSkillDesc] = useState<string>('');
  const [skillKeywords, setSkillKeywords] = useState<string>('');
  const [skillOrder, setSkillOrder] = useState<number>(1);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Video manager state
  const [selectedSkillForVideos, setSelectedSkillForVideos] = useState<Skill | null>(null);
  const [newVideoId, setNewVideoId] = useState<string>('');
  const [videoManagerLoading, setVideoManagerLoading] = useState<boolean>(false);
  const [videoManagerError, setVideoManagerError] = useState<string>('');

  // Edit modal state
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editSkillName, setEditSkillName] = useState<string>('');
  const [editSkillDesc, setEditSkillDesc] = useState<string>('');
  const [editSkillKeywords, setEditSkillKeywords] = useState<string>('');
  const [editSkillOrder, setEditSkillOrder] = useState<number>(1);
  const [editSkillModalOpen, setEditSkillModalOpen] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const catQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const catSnapshot = await getDocs(catQuery);
      const catList = catSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Category[];
      setCategories(catList);

      const skillQuery = query(collection(db, 'skills'), orderBy('order', 'asc'));
      const skillSnapshot = await getDocs(skillQuery);
      const skillList = skillSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Skill[];
      setSkills(skillList);
    } catch (err) {
      console.error('Failed to load skills data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let active = true;

    const load = async () => {
      try {
        const catQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
        const catSnapshot = await getDocs(catQuery);
        const catList = catSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Category[];

        const skillQuery = query(collection(db, 'skills'), orderBy('order', 'asc'));
        const skillSnapshot = await getDocs(skillQuery);
        const skillList = skillSnapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        })) as Skill[];

        if (active) {
          setCategories(catList);
          setSkills(skillList);
          if (catList.length > 0) {
            setSelectedCatId(catList[0].id);
          }
          setLoadingData(false);
        }
      } catch (err) {
        console.error('Failed initial load:', err);
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

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedId = skillId.trim().toLowerCase();
    const trimmedName = skillName.trim();
    const trimmedDesc = skillDesc.trim();

    if (!trimmedId || !trimmedName || !trimmedDesc || !selectedCatId) {
      setErrorMsg('All fields (including parent category) are strictly required!');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(trimmedId)) {
      setErrorMsg('Skill ID must consist only of lowercase alphanumeric keys and hyphens!');
      return;
    }

    try {
      setActionInProgress(true);
      const keywordsArray = skillKeywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      const newSkill: Skill = {
        id: trimmedId,
        categoryId: selectedCatId,
        name: trimmedName,
        description: trimmedDesc,
        order: Number(skillOrder),
        videoIds: [],
        keywords: keywordsArray,
      };

      const skillDocRef = doc(db, 'skills', trimmedId);
      await setDoc(skillDocRef, newSkill);

      // Reset Form
      setSkillId('');
      setSkillName('');
      setSkillDesc('');
      setSkillKeywords('');
      setSkillOrder(skills.length + 2);

      await fetchData();
      setSuccessMsg('Skill created successfully!');
    } catch (err: unknown) {
      console.error('Failed to add skill:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save skill.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this skill module?')) {
      return;
    }

    try {
      setActionInProgress(true);
      setErrorMsg('');
      setSuccessMsg('');
      const skillDocRef = doc(db, 'skills', id);
      await deleteDoc(skillDocRef);
      await fetchData();
      setSuccessMsg('Skill deleted successfully!');
    } catch (err: unknown) {
      console.error('Failed to delete skill:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete skill.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setEditSkillName(skill.name);
    setEditSkillDesc(skill.description);
    setEditSkillKeywords(Array.isArray(skill.keywords) ? skill.keywords.join(', ') : '');
    setEditSkillOrder(skill.order);
    setEditSkillModalOpen(true);
  };

  const handleSaveSkillEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;

    try {
      setActionInProgress(true);
      setErrorMsg('');
      setSuccessMsg('');
      const keywordsArray = editSkillKeywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      const updatedSkill: Skill = {
        id: editingSkill.id,
        categoryId: editingSkill.categoryId,
        name: editSkillName.trim(),
        description: editSkillDesc.trim(),
        order: editSkillOrder,
        videoIds: editingSkill.videoIds,
        keywords: keywordsArray,
      };

      const skillDocRef = doc(db, 'skills', editingSkill.id);
      await setDoc(skillDocRef, updatedSkill, { merge: true });

      setEditSkillModalOpen(false);
      setEditingSkill(null);
      await fetchData();
      setSuccessMsg('Skill updated successfully!');
    } catch (err: unknown) {
      console.error('Failed to update skill:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update skill.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCloseSkillEditModal = () => {
    setEditSkillModalOpen(false);
    setEditingSkill(null);
    setEditSkillName('');
    setEditSkillDesc('');
    setEditSkillKeywords('');
    setEditSkillOrder(1);
  };

  const handleMoveSkillUp = async (index: number) => {
    if (index === 0) return;
    const newSkills = [...skills];
    [newSkills[index - 1], newSkills[index]] = [newSkills[index], newSkills[index - 1]];

    try {
      setActionInProgress(true);
      setErrorMsg('');
      setSuccessMsg('');
      // Update order values in Firestore
      for (let i = 0; i < newSkills.length; i++) {
        const skillRef = doc(db, 'skills', newSkills[i].id);
        await setDoc(skillRef, { order: i + 1 }, { merge: true });
      }
      await fetchData();
      setSuccessMsg('Skill moved up successfully!');
    } catch (err: unknown) {
      console.error('Failed to reorder skill:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reorder skill.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleMoveSkillDown = async (index: number) => {
    if (index === skills.length - 1) return;
    const newSkills = [...skills];
    [newSkills[index], newSkills[index + 1]] = [newSkills[index + 1], newSkills[index]];

    try {
      setActionInProgress(true);
      setErrorMsg('');
      setSuccessMsg('');
      // Update order values in Firestore
      for (let i = 0; i < newSkills.length; i++) {
        const skillRef = doc(db, 'skills', newSkills[i].id);
        await setDoc(skillRef, { order: i + 1 }, { merge: true });
      }
      await fetchData();
      setSuccessMsg('Skill moved down successfully!');
    } catch (err: unknown) {
      console.error('Failed to reorder skill:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reorder skill.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleOpenVideoManager = (skill: Skill) => {
    setSelectedSkillForVideos(skill);
    setNewVideoId('');
    setVideoManagerError('');
  };

  const handleCloseVideoManager = () => {
    setSelectedSkillForVideos(null);
    setNewVideoId('');
    setVideoManagerError('');
  };

  const handleAddVideoId = async () => {
    if (!selectedSkillForVideos || !newVideoId.trim()) {
      setVideoManagerError('Video ID is required');
      return;
    }

    const trimmedId = newVideoId.trim();
    if (selectedSkillForVideos.videoIds.includes(trimmedId)) {
      setVideoManagerError('This video ID is already in the curated list');
      return;
    }

    try {
      setVideoManagerLoading(true);
      setVideoManagerError('');

      const updatedVideoIds = [...selectedSkillForVideos.videoIds, trimmedId];
      const skillDocRef = doc(db, 'skills', selectedSkillForVideos.id);
      await setDoc(skillDocRef, { videoIds: updatedVideoIds }, { merge: true });

      setNewVideoId('');
      await fetchData();
      // Update the selected skill with new data
      const updatedSkill = skills.find(s => s.id === selectedSkillForVideos.id);
      if (updatedSkill) {
        setSelectedSkillForVideos(updatedSkill);
      }
    } catch (err: unknown) {
      console.error('Failed to add video ID:', err);
      setVideoManagerError(err instanceof Error ? err.message : 'Failed to add video ID');
    } finally {
      setVideoManagerLoading(false);
    }
  };

  const handleRemoveVideoId = async (videoId: string) => {
    if (!selectedSkillForVideos) return;

    try {
      setVideoManagerLoading(true);
      setVideoManagerError('');

      const updatedVideoIds = selectedSkillForVideos.videoIds.filter(id => id !== videoId);
      const skillDocRef = doc(db, 'skills', selectedSkillForVideos.id);
      await setDoc(skillDocRef, { videoIds: updatedVideoIds }, { merge: true });

      await fetchData();
      // Update the selected skill with new data
      const updatedSkill = skills.find(s => s.id === selectedSkillForVideos.id);
      if (updatedSkill) {
        setSelectedSkillForVideos(updatedSkill);
      }
    } catch (err: unknown) {
      console.error('Failed to remove video ID:', err);
      setVideoManagerError(err instanceof Error ? err.message : 'Failed to remove video ID');
    } finally {
      setVideoManagerLoading(false);
    }
  };

  const handleMoveVideoUp = async (index: number) => {
    if (!selectedSkillForVideos || index === 0) return;

    try {
      setVideoManagerLoading(true);
      setVideoManagerError('');

      const updatedVideoIds = [...selectedSkillForVideos.videoIds];
      [updatedVideoIds[index], updatedVideoIds[index - 1]] = [updatedVideoIds[index - 1], updatedVideoIds[index]];

      const skillDocRef = doc(db, 'skills', selectedSkillForVideos.id);
      await setDoc(skillDocRef, { videoIds: updatedVideoIds }, { merge: true });

      await fetchData();
      const updatedSkill = skills.find(s => s.id === selectedSkillForVideos.id);
      if (updatedSkill) {
        setSelectedSkillForVideos(updatedSkill);
      }
    } catch (err: unknown) {
      console.error('Failed to reorder video IDs:', err);
      setVideoManagerError(err instanceof Error ? err.message : 'Failed to reorder video IDs');
    } finally {
      setVideoManagerLoading(false);
    }
  };

  const handleMoveVideoDown = async (index: number) => {
    if (!selectedSkillForVideos || index === selectedSkillForVideos.videoIds.length - 1) return;

    try {
      setVideoManagerLoading(true);
      setVideoManagerError('');

      const updatedVideoIds = [...selectedSkillForVideos.videoIds];
      [updatedVideoIds[index], updatedVideoIds[index + 1]] = [updatedVideoIds[index + 1], updatedVideoIds[index]];

      const skillDocRef = doc(db, 'skills', selectedSkillForVideos.id);
      await setDoc(skillDocRef, { videoIds: updatedVideoIds }, { merge: true });

      await fetchData();
      const updatedSkill = skills.find(s => s.id === selectedSkillForVideos.id);
      if (updatedSkill) {
        setSelectedSkillForVideos(updatedSkill);
      }
    } catch (err: unknown) {
      console.error('Failed to reorder video IDs:', err);
      setVideoManagerError(err instanceof Error ? err.message : 'Failed to reorder video IDs');
    } finally {
      setVideoManagerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#2d3748] flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <header className="border-b border-[#cccc]/50 bg-gradient-to-r from-[hsl(38,100%,98%)] to-[hsl(144,45%,98%)] sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg sm:text-xl tracking-tight text-[#2d3748]">
              Skill <span className="text-[#5995fd]">Control Panel</span>
            </span>
          </div>

          <button
            onClick={() => router.push('/dashboard/admin')}
            className="text-xs sm:text-sm bg-white hover:bg-[#f4f6f9] text-[#4a5568] font-bold p-2 px-4 rounded-lg transition-all cursor-pointer border border-[#cccc]"
          >
            Back to Admin Center
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Hand: Skill Creation Form */}
        <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="text-lg font-black text-[#2d3748] mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add New Skill Module
          </h3>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleAddSkill} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Parent Category
              </label>
              {categories.length === 0 ? (
                <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> No categories exist. You must create a Category first!
                </p>
              ) : (
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white cursor-pointer font-medium text-[#2d3748]"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Skill ID (unique key)
              </label>
              <input
                type="text"
                placeholder="e.g. react-framework"
                value={skillId}
                onChange={(e) => setSkillId(e.target.value)}
                className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-[#f4f6f9]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Skill Name
              </label>
              <input
                type="text"
                placeholder="e.g. React & Component Trees"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Description
              </label>
              <textarea
                placeholder="Core concepts details..."
                value={skillDesc}
                onChange={(e) => setSkillDesc(e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Keywords (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. react, components, hooks"
                value={skillKeywords}
                onChange={(e) => setSkillKeywords(e.target.value)}
                className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
              />
              <p className="text-xs text-[#4a5568] mt-1">Used for YouTube search when no curated videos are set</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Order Value
              </label>
              <input
                type="number"
                value={skillOrder}
                onChange={(e) => setSkillOrder(Number(e.target.value))}
                min={1}
                className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={actionInProgress || categories.length === 0}
              className="w-full bg-[#5995fd] hover:bg-[#4d84e2] text-white font-bold p-3 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {actionInProgress ? 'Saving Skill...' : 'Save Skill'}
            </button>
          </form>
        </div>

        {/* Right Hand: Skills List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-[#2d3748] mb-6 flex items-center gap-2">
              <Target className="w-5 h-5" /> Active Curriculum Skills
            </h3>

            {loadingData ? (
              <p className="text-sm text-[#4a5568] animate-pulse">Loading active skills...</p>
            ) : skills.length === 0 ? (
              <p className="text-sm text-[#4a5568] italic">No skills found. Create one using the form on the left!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {skills.map((skill, index) => {
                  const parentCatName = categories.find((c) => c.id === skill.categoryId)?.name || skill.categoryId;
                  return (
                    <div
                      key={skill.id}
                      className="p-4 border border-[#cccc]/40 rounded-xl hover:border-[#5995fd]/40 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#f4f6f9]/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-sm font-black text-[#2d3748]">{skill.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                            id: {skill.id}
                          </span>
                          <span className="text-[10px] bg-[#5995fd]/15 text-[#5995fd] px-2 py-0.5 rounded font-bold">
                            cat: {parentCatName}
                          </span>
                          <span className="text-[10px] bg-[#ffde23]/25 text-[#2d3748] px-2 py-0.5 rounded font-black">
                            order: {skill.order}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-[#4a5568] leading-relaxed max-w-xl">
                          {skill.description}
                        </p>
                      </div>

                      <div className="flex gap-2 self-start sm:self-center">
                        <button
                          onClick={() => handleMoveSkillUp(index)}
                          disabled={actionInProgress || index === 0}
                          className="text-xs bg-[#f4f6f9] hover:bg-[#e2e8f0] text-[#4a5568] font-bold p-2 px-3 rounded-lg border border-[#cccc] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveSkillDown(index)}
                          disabled={actionInProgress || index === skills.length - 1}
                          className="text-xs bg-[#f4f6f9] hover:bg-[#e2e8f0] text-[#4a5568] font-bold p-2 px-3 rounded-lg border border-[#cccc] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditSkill(skill)}
                          disabled={actionInProgress}
                          className="text-xs bg-white hover:bg-[#5995fd] hover:text-white text-[#5995fd] font-bold p-2 px-4 rounded-lg border border-[#5995fd]/40 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleOpenVideoManager(skill)}
                          disabled={actionInProgress}
                          className="text-xs bg-white hover:bg-[#5995fd] hover:text-white text-[#5995fd] font-bold p-2 px-4 rounded-lg border border-[#5995fd]/40 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Video className="w-3 h-3" /> Manage Videos
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          disabled={actionInProgress}
                          className="text-xs bg-white hover:bg-rose-600 hover:text-white text-rose-600 font-bold p-2 px-4 rounded-lg border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Video Manager Modal */}
      {selectedSkillForVideos && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-[#f4f6f9] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#2d3748]">Manage Curated Videos</h3>
                <p className="text-xs text-[#4a5568] mt-1">
                  Skill: <span className="font-bold text-[#5995fd]">{selectedSkillForVideos.name}</span>
                </p>
              </div>
              <button
                onClick={handleCloseVideoManager}
                className="text-[#4a5568] hover:text-rose-600 transition-colors text-2xl font-bold leading-none"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {videoManagerError && (
                <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {videoManagerError}
                </div>
              )}

              {/* Add new video ID */}
              <div className="mb-6 p-4 bg-[#f4f6f9] rounded-xl">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-2">
                  Add YouTube Video ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. dQw4w9WgXcQ"
                    value={newVideoId}
                    onChange={(e) => setNewVideoId(e.target.value)}
                    className="flex-1 p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                    disabled={videoManagerLoading}
                  />
                  <button
                    onClick={handleAddVideoId}
                    disabled={videoManagerLoading || !newVideoId.trim()}
                    className="bg-[#5995fd] hover:bg-[#4d84e2] text-white font-bold p-2.5 px-4 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> {videoManagerLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
                <p className="text-[10px] text-[#4a5568] mt-2 flex items-center gap-1">
                  💡 Enter the 11-character YouTube video ID (from the URL: youtube.com/watch?v=VIDEO_ID)
                </p>
              </div>

              {/* Current video IDs list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-black text-[#2d3748]">Curated Videos ({selectedSkillForVideos.videoIds.length})</h4>
                  {selectedSkillForVideos.videoIds.length === 0 && (
                    <span className="text-xs text-[#4a5568] italic">No curated videos yet</span>
                  )}
                </div>

                {selectedSkillForVideos.videoIds.length > 0 && (
                  <div className="space-y-2">
                    {selectedSkillForVideos.videoIds.map((videoId, index) => (
                      <div
                        key={videoId}
                        className="flex items-center gap-3 p-3 bg-white border border-[#cccc]/40 rounded-xl"
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveVideoUp(index)}
                            disabled={videoManagerLoading || index === 0}
                            className="text-[#4a5568] hover:text-[#5995fd] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                            title="Move up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveVideoDown(index)}
                            disabled={videoManagerLoading || index === selectedSkillForVideos.videoIds.length - 1}
                            className="text-[#4a5568] hover:text-[#5995fd] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-bold"
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1">
                          <span className="text-xs font-mono bg-[#f4f6f9] px-2 py-1 rounded text-[#2d3748]">
                            {videoId}
                          </span>
                          <span className="text-[10px] text-[#4a5568] ml-2">Position {index + 1}</span>
                        </div>

                        <button
                          onClick={() => handleRemoveVideoId(videoId)}
                          disabled={videoManagerLoading}
                          className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-2 px-3 rounded-lg border border-rose-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#f4f6f9] flex justify-between items-center">
              <button
                onClick={() => {
                  const skillId = selectedSkillForVideos?.id;
                  handleCloseVideoManager();
                  if (skillId) {
                    setTimeout(() => {
                      router.push(`/dashboard/skills/${skillId}`);
                    }, 100);
                  }
                }}
                disabled={videoManagerLoading}
                className="bg-[#5995fd]/10 hover:bg-[#5995fd]/20 text-[#5995fd] font-bold p-2.5 px-4 rounded-xl transition-all cursor-pointer border border-[#5995fd]/30 disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Preview as Learner
              </button>
              <button
                onClick={handleCloseVideoManager}
                disabled={videoManagerLoading}
                className="bg-[#4a5568] hover:bg-[#2d3748] text-white font-bold p-2.5 px-6 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skill Edit Modal */}
      {editSkillModalOpen && editingSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-black text-[#2d3748] mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5" /> Edit Skill
            </h3>

            <form onSubmit={handleSaveSkillEdit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                  Skill Name
                </label>
                <input
                  type="text"
                  value={editSkillName}
                  onChange={(e) => setEditSkillName(e.target.value)}
                  className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                  Description
                </label>
                <textarea
                  value={editSkillDesc}
                  onChange={(e) => setEditSkillDesc(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={editSkillKeywords}
                  onChange={(e) => setEditSkillKeywords(e.target.value)}
                  className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                />
                <p className="text-xs text-[#4a5568] mt-1">Used for YouTube search when no curated videos are set</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                  Order Value
                </label>
                <input
                  type="number"
                  value={editSkillOrder}
                  onChange={(e) => setEditSkillOrder(Number(e.target.value))}
                  min={1}
                  className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseSkillEditModal}
                  disabled={actionInProgress}
                  className="flex-1 bg-[#f4f6f9] hover:bg-[#e2e8f0] text-[#4a5568] font-bold p-3 rounded-xl transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="flex-1 bg-[#5995fd] hover:bg-[#4d84e2] text-white font-bold p-3 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> {actionInProgress ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
