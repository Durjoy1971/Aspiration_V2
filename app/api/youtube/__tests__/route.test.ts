import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the caching service completely to bypass database interactions in endpoint tests
vi.mock('../../../lib/youtube/cacheService', () => ({
  getSkillQueryCache: vi.fn().mockResolvedValue(null),
  setSkillQueryCache: vi.fn().mockResolvedValue(undefined),
  getVideoCache: vi.fn().mockResolvedValue(null),
  setVideoCache: vi.fn().mockImplementation((id, data) => Promise.resolve({ ...data, cachedAt: 12345 })),
  isCacheValid: vi.fn().mockReturnValue(true),
}));

describe('YouTube API Endpoints Handler Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.YOUTUBE_API_KEY;
  });

  describe('GET /api/youtube/search', () => {
    it('should return 400 Bad Request if search query is missing', async () => {
      const { GET } = await import('../search/route');
      const req = new NextRequest('http://localhost:3000/api/youtube/search');
      
      const res = await GET(req);
      expect(res.status).toBe(400);
      
      const json = await res.json();
      expect(json.error).toBe('Missing search query parameter');
    });

    it('should return mock search details if YOUTUBE_API_KEY is not defined', async () => {
      const { GET } = await import('../search/route');
      const req = new NextRequest('http://localhost:3000/api/youtube/search?query=react');
      
      const res = await GET(req);
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json.length).toBeGreaterThan(0);
      expect(json[0].title).toContain('TypeScript');
    });

    it('should fetch from Google YouTube API if YOUTUBE_API_KEY is defined', async () => {
      process.env.YOUTUBE_API_KEY = 'test-key-123';
      
      // Mock global fetch
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('search')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              items: [{ id: { videoId: 'mock-vid' } }]
            })
          });
        }
        if (url.includes('videos')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              items: [{
                id: 'mock-vid',
                snippet: { title: 'Fetched React video', description: 'desc', publishedAt: '2026-05-19T00:00:00Z' },
                contentDetails: { duration: 'PT15M0S' }
              }]
            })
          });
        }
        return Promise.reject(new Error('Unknown url'));
      });
      global.fetch = mockFetch;

      const { GET } = await import('../search/route');
      const req = new NextRequest('http://localhost:3000/api/youtube/search?query=react');
      
      const res = await GET(req);
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json.length).toBe(1);
      expect(json[0].id).toBe('mock-vid');
      expect(json[0].title).toBe('Fetched React video');
    });
  });

  describe('GET /api/youtube/videos', () => {
    it('should return 400 Bad Request if ids parameter is missing', async () => {
      const { GET } = await import('../videos/route');
      const req = new NextRequest('http://localhost:3000/api/youtube/videos');
      
      const res = await GET(req);
      expect(res.status).toBe(400);
      
      const json = await res.json();
      expect(json.error).toBe('Missing video IDs parameter');
    });

    it('should return mock curated details if YOUTUBE_API_KEY is missing', async () => {
      const { GET } = await import('../videos/route');
      const req = new NextRequest('http://localhost:3000/api/youtube/videos?ids=dQw4w9WgXcQ');
      
      const res = await GET(req);
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json.length).toBe(1);
      expect(json[0].id).toBe('dQw4w9WgXcQ');
      expect(json[0].title).toContain('TypeScript');
    });

    it('should query details from YouTube API if YOUTUBE_API_KEY is defined', async () => {
      process.env.YOUTUBE_API_KEY = 'test-key-123';
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          items: [{
            id: 'vid-99',
            snippet: { title: 'Batch Details Video', description: 'Curated' },
            contentDetails: { duration: 'PT30M' }
          }]
        })
      });
      global.fetch = mockFetch;

      const { GET } = await import('../videos/route');
      const req = new NextRequest('http://localhost:3000/api/youtube/videos?ids=vid-99');
      
      const res = await GET(req);
      expect(res.status).toBe(200);
      
      const json = await res.json();
      expect(json.length).toBe(1);
      expect(json[0].id).toBe('vid-99');
      expect(json[0].title).toBe('Batch Details Video');
    });
  });
});
