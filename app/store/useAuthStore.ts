import { create } from 'zustand';
import { auth } from '../lib/firebase/clientApp';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'learner' | 'admin' | 'superAdmin';
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
