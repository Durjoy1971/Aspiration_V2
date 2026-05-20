import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, collectionName, id) => ({ path: `${collectionName}/${id}`, id })),
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

vi.mock('../clientApp', () => ({
  db: {},
}));

describe('notesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when note does not exist', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    const { getUserVideoNote } = await import('../notesService');
    const result = await getUserVideoNote('user-1', 'video-1');

    expect(result).toBeNull();
  });

  it('returns note when it exists', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'user-1_video-1',
      data: () => ({
        userId: 'user-1',
        skillId: 'skill-1',
        videoId: 'video-1',
        content: 'My saved note',
      }),
    });

    const { getUserVideoNote } = await import('../notesService');
    const result = await getUserVideoNote('user-1', 'video-1');

    expect(result).toEqual({
      id: 'user-1_video-1',
      userId: 'user-1',
      skillId: 'skill-1',
      videoId: 'video-1',
      content: 'My saved note',
    });
  });

  it('saves note with merge and returns note payload', async () => {
    const { saveUserVideoNote } = await import('../notesService');
    const result = await saveUserVideoNote('user-1', 'skill-1', 'video-1', 'Updated note text');

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'notes/user-1_video-1' }),
      expect.objectContaining({
        userId: 'user-1',
        skillId: 'skill-1',
        videoId: 'video-1',
        content: 'Updated note text',
        updatedAt: 'mock-timestamp',
        createdAt: 'mock-timestamp',
      }),
      { merge: true }
    );

    expect(result).toEqual({
      id: 'user-1_video-1',
      userId: 'user-1',
      skillId: 'skill-1',
      videoId: 'video-1',
      content: 'Updated note text',
    });
  });
});
