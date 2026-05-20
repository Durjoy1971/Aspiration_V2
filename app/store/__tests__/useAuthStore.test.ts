import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase clientApp
vi.mock('../../lib/firebase/clientApp', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: { email: 'test@test.com' } })),
  signOut: vi.fn(() => Promise.resolve()),
  GoogleAuthProvider: class MockGoogleAuthProvider {},
}));

describe('Zustand useAuthStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should initialize with default values', async () => {
    const { useAuthStore } = await import('../useAuthStore');
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should update user, loading, and error states via actions', async () => {
    const { useAuthStore } = await import('../useAuthStore');

    useAuthStore.getState().setUser({
      uid: 'user-123',
      email: 'test@test.com',
      displayName: 'Test User',
      role: 'learner',
    });
    expect(useAuthStore.getState().user).toEqual({
      uid: 'user-123',
      email: 'test@test.com',
      displayName: 'Test User',
      role: 'learner',
    });

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().loading).toBe(false);

    useAuthStore.getState().setError('Authentication failed');
    expect(useAuthStore.getState().error).toBe('Authentication failed');
  });

  it('should trigger signInWithPopup on loginWithGoogle', async () => {
    const { signInWithPopup } = await import('firebase/auth');
    const { useAuthStore } = await import('../useAuthStore');

    await useAuthStore.getState().loginWithGoogle();
    expect(signInWithPopup).toHaveBeenCalled();
  });

  it('should trigger signOut on logout', async () => {
    const { signOut } = await import('firebase/auth');
    const { useAuthStore } = await import('../useAuthStore');

    await useAuthStore.getState().logout();
    expect(signOut).toHaveBeenCalled();
  });
});
