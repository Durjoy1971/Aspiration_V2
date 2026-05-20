import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockGetDocs = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...segments: string[]) => ({ path: segments.join('/') })),
  collection: vi.fn((_db, ...segments: string[]) => ({ path: segments.join('/') })),
  query: vi.fn((ref) => ref),
  where: vi.fn(() => ({ type: 'where' })),
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
}));

vi.mock('../clientApp', () => ({
  db: {},
}));

describe('progressService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for missing video progress', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
    });

    const { getVideoProgress } = await import('../progressService');
    const result = await getVideoProgress('user-1', 'video-1');

    expect(result).toBeNull();
  });

  it('upserts video progress with merge', async () => {
    const { upsertVideoProgress } = await import('../progressService');
    const result = await upsertVideoProgress('user-1', 'skill-1', 'video-1', 'in_progress');

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'progress/user-1/videos/video-1' }),
      expect.objectContaining({
        userId: 'user-1',
        skillId: 'skill-1',
        videoId: 'video-1',
        status: 'in_progress',
        updatedAt: 'mock-timestamp',
      }),
      { merge: true }
    );

    expect(result).toEqual({
      userId: 'user-1',
      skillId: 'skill-1',
      videoId: 'video-1',
      status: 'in_progress',
    });
  });

  it('recomputes and persists skill progress summary', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { data: () => ({ userId: 'user-1', skillId: 'skill-1', videoId: 'v1', status: 'completed' }) },
        { data: () => ({ userId: 'user-1', skillId: 'skill-1', videoId: 'v2', status: 'in_progress' }) },
      ],
    });

    const { recomputeSkillProgress } = await import('../progressService');
    const result = await recomputeSkillProgress('user-1', 'skill-1', ['v1', 'v2', 'v3']);

    expect(result).toEqual({
      userId: 'user-1',
      skillId: 'skill-1',
      totalVideos: 3,
      completedVideos: 1,
      completionPercent: 33,
      status: 'in_progress',
    });

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'progress/user-1/skills/skill-1' }),
      expect.objectContaining({
        userId: 'user-1',
        skillId: 'skill-1',
        totalVideos: 3,
        completedVideos: 1,
        completionPercent: 33,
        status: 'in_progress',
        updatedAt: 'mock-timestamp',
      }),
      { merge: true }
    );
  });
});
