import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firestore functions
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db, path, id) => ({ path: `${path}/${id}` })),
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

vi.mock('../clientApp', () => ({
  db: {},
}));

describe('userService syncUserDoc logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  });

  it('should create a new user document as learner by default', async () => {
    // Mock getDoc to return not-exists
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    const { syncUserDoc } = await import('../userService');

    const firebaseUser = {
      uid: 'user-123',
      email: 'learner@aspiration.com',
      displayName: 'Jane Doe',
      photoURL: 'https://example.com/jane.jpg',
    };

    const result = await syncUserDoc(firebaseUser);

    expect(mockGetDoc).toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: 'user-123',
        email: 'learner@aspiration.com',
        displayName: 'Jane Doe',
        photoURL: 'https://example.com/jane.jpg',
        role: 'learner',
        createdAt: 'mock-timestamp',
        lastLoginAt: 'mock-timestamp',
      })
    );
    expect(result.role).toBe('learner');
  });

  it('should auto-assign superAdmin role if email matches durjoy1971office@gmail.com', async () => {
    // Mock getDoc to return not-exists
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    const { syncUserDoc } = await import('../userService');

    const firebaseUser = {
      uid: 'admin-999',
      email: 'durjoy1971office@gmail.com',
      displayName: 'Durjoy',
      photoURL: null,
    };

    const result = await syncUserDoc(firebaseUser);

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: 'admin-999',
        email: 'durjoy1971office@gmail.com',
        role: 'superAdmin',
      })
    );
    expect(result.role).toBe('superAdmin');
  });

  it('should only update lastLoginAt and preserve existing role if user document already exists', async () => {
    // Mock getDoc to return exists
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        uid: 'admin-999',
        email: 'durjoy1971office@gmail.com',
        displayName: 'Durjoy',
        role: 'superAdmin',
        createdAt: 'original-timestamp',
      }),
    });

    const { syncUserDoc } = await import('../userService');

    const firebaseUser = {
      uid: 'admin-999',
      email: 'durjoy1971office@gmail.com',
      displayName: 'Durjoy Updated Name',
      photoURL: null,
    };

    const result = await syncUserDoc(firebaseUser);

    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        displayName: 'Durjoy Updated Name',
        lastLoginAt: 'mock-timestamp',
      })
    );
    // Should return original role and existing fields
    expect(result.role).toBe('superAdmin');
  });
});
