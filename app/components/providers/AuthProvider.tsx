'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase/clientApp';
import { useAuthStore, AuthUser } from '../../store/useAuthStore';
import { syncUserDoc } from '../../lib/firebase/userService';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const isE2ETestMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';

    if (isE2ETestMode && typeof window !== 'undefined') {
      try {
        const e2eUserRaw = window.localStorage.getItem('__e2eAuthUser');
        if (e2eUserRaw) {
          const e2eUser = JSON.parse(e2eUserRaw) as AuthUser;
          if (e2eUser?.uid && e2eUser?.email && e2eUser?.displayName && e2eUser?.role) {
            document.cookie = `session-token=${e2eUser.uid}; path=/; max-age=86400; SameSite=Lax`;
            setUser(e2eUser);
            setLoading(false);
            return () => {};
          }
        }
      } catch (error) {
        console.error('Failed to bootstrap E2E mock auth user:', error);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Clear session cookie on logout
        document.cookie = 'session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Synchronize authenticated session with Firestore (creating user doc & retrieving their role)
        const syncedDoc = await syncUserDoc({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });

        // Set session cookie for Next.js Edge middleware routing
        document.cookie = `session-token=${firebaseUser.uid}; path=/; max-age=86400; SameSite=Lax`;

        const userPayload: AuthUser = {
          uid: syncedDoc.uid,
          email: syncedDoc.email,
          displayName: syncedDoc.displayName,
          photoURL: syncedDoc.photoURL || undefined,
          role: syncedDoc.role,
        };

        setUser(userPayload);
      } catch (error) {
        console.error('Failed to sync user session with database:', error);
        document.cookie = 'session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
