'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase/clientApp';
import { auth } from '../../../lib/firebase/clientApp';
import { Shield, AlertTriangle, ArrowLeft, X, CheckCircle, ChevronUp, ChevronDown, Key } from 'lucide-react';

interface UserDoc {
  uid: string;
  displayName: string;
  email: string;
  role: 'learner' | 'admin' | 'superAdmin';
}

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [usersList, setUsersList] = useState<UserDoc[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Dual gating redirect rules inside the view
  useEffect(() => {
    if (user && user.role !== 'superAdmin') {
      router.push('/dashboard/admin');
    }
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      setLoadingData(true);
      const usersQuery = query(collection(db, 'users'), orderBy('displayName', 'asc'));
      const snapshot = await getDocs(usersQuery);
      const list = snapshot.docs.map((docItem) => ({
        uid: docItem.id,
        ...docItem.data(),
      })) as UserDoc[];
      setUsersList(list);
    } catch (err) {
      console.error('Failed to load registered users:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'superAdmin') {
      Promise.resolve().then(() => {
        fetchUsers();
      });
    }
  }, [user]);

  const handleUpdateRole = async (targetUid: string, newRole: 'learner' | 'admin' | 'superAdmin') => {
    if (targetUid === user?.uid) {
      alert('Security Alert: You cannot modify or demote your own SuperAdmin role credentials!');
      return;
    }

    try {
      setActionInProgress(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Get the current user's ID token from Firebase auth
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      const idToken = await firebaseUser.getIdToken();

      // Call the secure API route
      const response = await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetUserId: targetUid,
          newRole: newRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      setSuccessMsg(`Successfully updated user permissions to ${newRole}!`);
      await fetchUsers();
    } catch (err: unknown) {
      console.error('Failed to toggle role:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update user role.');
    } finally {
      setActionInProgress(false);
    }
  };

  if (!user || user.role !== 'superAdmin') {
    return null; // Layout secure guard handles loader redirections
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-[#2d3748] flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <header className="border-b border-[#cccc]/50 bg-gradient-to-r from-[hsl(38,100%,98%)] to-[hsl(144,45%,98%)] sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black text-lg sm:text-xl tracking-tight text-[#2d3748]">
              User Role & <span className="text-[hsl(39,100%,50%)]">Privilege Manager</span>
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {/* Header summary panel */}
        <div className="bg-[#ffffff] border border-[#cccc]/50 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm relative overflow-hidden">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[hsl(39,100%,50%)]/10 text-[hsl(39,100%,50%)] border border-[hsl(39,100%,50%)]/20 mb-3">
            <Shield className="w-3 h-3" /> SuperAdmin Access Level
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#2d3748]">
            Privileged Accounts Manager
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#4a5568] max-w-2xl leading-relaxed">
            Monitor registered learner profiles, adjust permission levels, designate administrators, or demote accounts to standard privileges.
          </p>
        </div>

        {/* Feedback alerts */}
        {successMsg && (
          <div className="p-3 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs sm:text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        {/* Users Control Board */}
        <div className="bg-white border border-[#cccc]/50 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-black text-[#2d3748] mb-6 flex items-center gap-2">
            <Key className="w-5 h-5" /> Privileged Accounts
          </h3>

          {loadingData ? (
            <div className="flex flex-col gap-3">
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : usersList.length === 0 ? (
            <p className="text-sm text-[#4a5568] italic">No registered users located in database.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#cccc]/40 text-left text-sm">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider text-[#4a5568]">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Account Privilege</th>
                    <th className="py-3 px-4 text-right">Assign Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#cccc]/30">
                  {usersList.map((userDoc) => (
                    <tr
                      key={userDoc.uid}
                      className={`hover:bg-[#f4f6f9]/50 transition-colors ${
                        userDoc.uid === user.uid ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-bold text-[#2d3748]">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 border border-[#cccc]/50 text-xs">
                            {userDoc.displayName?.charAt(0) || 'U'}
                          </div>
                          <span>
                            {userDoc.displayName} {userDoc.uid === user.uid && ' (You)'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-[#4a5568]">{userDoc.email}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            userDoc.role === 'superAdmin'
                              ? 'bg-[hsl(39,100%,50%)]/10 text-[hsl(39,100%,50%)]'
                              : userDoc.role === 'admin'
                              ? 'bg-[#5995fd]/10 text-[#5995fd]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {userDoc.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {userDoc.uid === user.uid ? (
                          <span className="text-xs text-[#4a5568] italic font-semibold">
                            System Lock (Active User)
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateRole(userDoc.uid, 'learner')}
                              disabled={actionInProgress}
                              className={`text-xs p-1.5 px-3 rounded-lg font-bold border transition-all cursor-pointer ${
                                userDoc.role === 'learner'
                                  ? 'bg-[#f4f6f9] border-[#cccc] text-[#a0aec0]'
                                  : 'bg-white hover:bg-slate-100 border-[#cccc] text-[#4a5568]'
                              }`}
                            >
                              Learner
                            </button>
                            <button
                              onClick={() => handleUpdateRole(userDoc.uid, 'admin')}
                              disabled={actionInProgress}
                              className={`text-xs p-1.5 px-3 rounded-lg font-bold border transition-all cursor-pointer ${
                                userDoc.role === 'admin'
                                  ? 'bg-[#5995fd]/15 border-[#5995fd]/30 text-[#5995fd]'
                                  : 'bg-white hover:bg-slate-100 border-[#cccc] text-[#4a5568]'
                              }`}
                            >
                              Admin
                            </button>
                            <button
                              onClick={() => handleUpdateRole(userDoc.uid, 'superAdmin')}
                              disabled={actionInProgress}
                              className={`text-xs p-1.5 px-3 rounded-lg font-bold border transition-all cursor-pointer ${
                                userDoc.role === 'superAdmin'
                                  ? 'bg-[hsl(39,100%,50%)]/15 border-[hsl(39,100%,50%)]/30 text-[hsl(39,100%,50%)]'
                                  : 'bg-white hover:bg-slate-100 border-[#cccc] text-[#4a5568]'
                              }`}
                            >
                              SuperAdmin
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
