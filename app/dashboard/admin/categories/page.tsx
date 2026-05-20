'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase/clientApp';
import { Category } from '../../../types';

export default function AdminCategoriesPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form parameters
  const [catId, setCatId] = useState<string>('');
  const [catName, setCatName] = useState<string>('');
  const [catDesc, setCatDesc] = useState<string>('');
  const [catOrder, setCatOrder] = useState<number>(1);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchCategories = async () => {
    try {
      setLoadingData(true);
      const catQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const catSnapshot = await getDocs(catQuery);
      const catList = catSnapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      })) as Category[];
      setCategories(catList);
    } catch (err) {
      console.error('Failed to load categories:', err);
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

        if (active) {
          setCategories(catList);
          setLoadingData(false);
        }
      } catch (err) {
        console.error('Failed in initial load:', err);
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedId = catId.trim().toLowerCase();
    const trimmedName = catName.trim();
    const trimmedDesc = catDesc.trim();

    if (!trimmedId || !trimmedName || !trimmedDesc) {
      setErrorMsg('All fields are strictly required!');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(trimmedId)) {
      setErrorMsg('Category ID must consist only of lowercase alphanumeric keys and hyphens!');
      return;
    }

    try {
      setActionInProgress(true);
      const newCategory: Category = {
        id: trimmedId,
        name: trimmedName,
        description: trimmedDesc,
        order: Number(catOrder),
      };

      const categoryDocRef = doc(db, 'categories', trimmedId);
      await setDoc(categoryDocRef, newCategory);

      // Reset Form
      setCatId('');
      setCatName('');
      setCatDesc('');
      setCatOrder(categories.length + 2);

      await fetchCategories();
    } catch (err: unknown) {
      console.error('Failed to add category:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this category? All associated UI mapping will be unlinked.')) {
      return;
    }

    try {
      setActionInProgress(true);
      const categoryDocRef = doc(db, 'categories', id);
      await deleteDoc(categoryDocRef);
      await fetchCategories();
    } catch (err: unknown) {
      console.error('Failed to delete category:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete category.');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#2d3748] flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <header className="border-b border-[#cccc]/50 bg-gradient-to-r from-[hsl(38,100%,98%)] to-[hsl(144,45%,98%)] sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg sm:text-xl tracking-tight text-[#2d3748]">
              Category <span className="text-[#38b2ac]">Control Panel</span>
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
        {/* Left Hand: Category Creation Form */}
        <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 shadow-sm h-fit">
          <h3 className="text-lg font-black text-[#2d3748] mb-4">🆕 Add New Category</h3>

          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Category ID (unique key)
              </label>
              <input
                type="text"
                placeholder="e.g. frontend"
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-[#f4f6f9]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Frontend Development"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Description
              </label>
              <textarea
                placeholder="Brief description of this learning pathway..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                rows={3}
                className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a5568] mb-1">
                Order Value (for grid sorting)
              </label>
              <input
                type="number"
                value={catOrder}
                onChange={(e) => setCatOrder(Number(e.target.value))}
                min={1}
                className="w-full p-2.5 border border-[#cccc] rounded-xl text-sm bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={actionInProgress}
              className="w-full bg-[#38b2ac] hover:bg-[#2d8a83] text-white font-bold p-3 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {actionInProgress ? 'Saving Category...' : 'Save Category'}
            </button>
          </form>
        </div>

        {/* Right Hand: Categories List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-black text-[#2d3748] mb-6">🗂️ Active Path Categories</h3>

            {loadingData ? (
              <p className="text-sm text-[#4a5568] animate-pulse">Loading active paths...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-[#4a5568] italic">No categories found in datastore. Create one on the left!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="p-4 border border-[#cccc]/40 rounded-xl hover:border-[#38b2ac]/40 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#f4f6f9]/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#2d3748]">{category.name}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                          id: {category.id}
                        </span>
                        <span className="text-[10px] bg-[#38b2ac]/10 text-[#38b2ac] px-2 py-0.5 rounded font-black">
                          order: {category.order}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#4a5568] leading-relaxed max-w-xl">
                        {category.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={actionInProgress}
                      className="text-xs bg-white hover:bg-rose-600 hover:text-white text-rose-600 font-bold p-2 px-4 rounded-lg border border-rose-200 transition-all cursor-pointer self-start sm:self-center"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
