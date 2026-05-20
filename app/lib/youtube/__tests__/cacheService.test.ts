import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define mocks first
const mockGet = vi.fn();
const mockSet = vi.fn();

const mockDoc = vi.fn(() => ({
  get: mockGet,
  set: mockSet,
}));

const mockCollection = vi.fn(() => ({
  doc: mockDoc,
}));

vi.mock('../../firebase/adminApp', () => ({
  adminDb: {
    collection: mockCollection,
  },
}));

describe('cacheService logic tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getVideoCache: should return metadata when document exists and is not expired', async () => {
    const validTimestamp = Date.now() - 1000; // 1 second ago (well within 14 days)
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        id: 'vid-001',
        title: 'Awesome TypeScript',
        description: 'Learn TS in 5 minutes',
        thumbnail: 'https://img.yt/1.jpg',
        duration: 'PT5M0S',
        publishedAt: '2026-05-19T00:00:00Z',
        cachedAt: validTimestamp,
      }),
    });

    const { getVideoCache } = await import('../cacheService');
    const result = await getVideoCache('vid-001');

    expect(mockCollection).toHaveBeenCalledWith('videoCache');
    expect(mockDoc).toHaveBeenCalledWith('vid-001');
    expect(result).not.toBeNull();
    expect(result?.title).toBe('Awesome TypeScript');
    expect(result?.cachedAt).toBe(validTimestamp);
  });

  it('getVideoCache: should return null when document is expired', async () => {
    const expiredTimestamp = Date.now() - (15 * 24 * 60 * 60 * 1000); // 15 days ago (expired)
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        id: 'vid-001',
        title: 'Awesome TypeScript',
        cachedAt: expiredTimestamp,
      }),
    });

    const { getVideoCache } = await import('../cacheService');
    const result = await getVideoCache('vid-001');

    expect(result).toBeNull();
  });

  it('getVideoCache: should return null when document does not exist', async () => {
    mockGet.mockResolvedValueOnce({
      exists: false,
    });

    const { getVideoCache } = await import('../cacheService');
    const result = await getVideoCache('vid-001');

    expect(result).toBeNull();
  });

  it('setVideoCache: should write correct fields with new timestamp to videoCache collection', async () => {
    const { setVideoCache } = await import('../cacheService');
    const inputMetadata = {
      id: 'vid-002',
      title: 'Zustand State Guide',
      description: 'Zustand best practices',
      thumbnail: 'https://img.yt/2.jpg',
      duration: 'PT12M0S',
      publishedAt: '2026-05-18T00:00:00Z',
    };

    const result = await setVideoCache('vid-002', inputMetadata);

    expect(mockCollection).toHaveBeenCalledWith('videoCache');
    expect(mockDoc).toHaveBeenCalledWith('vid-002');
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'vid-002',
        title: 'Zustand State Guide',
        cachedAt: expect.any(Number),
      }),
      { merge: true }
    );
    expect(result.cachedAt).toBeGreaterThan(0);
  });

  it('getSkillQueryCache: should return video ID list when query cache exists and is not expired', async () => {
    const validTimestamp = Date.now() - 1000;
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        skillId: 'skill-react',
        videoIds: ['v1', 'v2', 'v3'],
        cachedAt: validTimestamp,
      }),
    });

    const { getSkillQueryCache } = await import('../cacheService');
    const result = await getSkillQueryCache('skill-react');

    expect(mockCollection).toHaveBeenCalledWith('skillVideoCache');
    expect(mockDoc).toHaveBeenCalledWith('skill-react');
    expect(result).toEqual(['v1', 'v2', 'v3']);
  });

  it('setSkillQueryCache: should successfully write query cache documents', async () => {
    const { setSkillQueryCache } = await import('../cacheService');
    await setSkillQueryCache('skill-css', ['css1', 'css2']);

    expect(mockCollection).toHaveBeenCalledWith('skillVideoCache');
    expect(mockDoc).toHaveBeenCalledWith('skill-css');
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        skillId: 'skill-css',
        videoIds: ['css1', 'css2'],
        cachedAt: expect.any(Number),
      }),
      { merge: true }
    );
  });
});
