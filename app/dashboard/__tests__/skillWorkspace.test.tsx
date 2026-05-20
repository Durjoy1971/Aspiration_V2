import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

// Mock client Firebase App
vi.mock('../../lib/firebase/clientApp', () => ({
  db: {},
  auth: {},
}));

// Mock firebase/firestore with specific workspace document responses
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
vi.mock('firebase/firestore', () => {
  const dummyRef = { id: 'dummy' };
  return {
    collection: vi.fn(() => dummyRef),
    doc: vi.fn(() => dummyRef),
    getDoc: mockGetDoc,
    getDocs: mockGetDocs,
    query: vi.fn((ref) => ref),
    where: vi.fn(() => ({})),
  };
});

const mockGetSkillProgress = vi.fn();
vi.mock('../../lib/firebase/progressService', () => ({
  getSkillProgress: (...args: unknown[]) => mockGetSkillProgress(...args),
}));

// Mock next/navigation params and router push actions
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
    };
  },
  useParams() {
    return {
      skillId: 'react-skill-id-123',
    };
  },
}));

// Mock useAuthStore
const mockUseAuthStore = vi.fn();
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// Fetch global mocking
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SkillWorkspacePage console tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: {
        uid: 'user-123',
        displayName: 'John Learner',
        email: 'john@aspiration.com',
        role: 'learner',
      },
      loading: false,
    });

    mockGetDocs.mockResolvedValue({ docs: [] });
    mockGetSkillProgress.mockResolvedValue({
      userId: 'user-123',
      skillId: 'react-skill-id-123',
      totalVideos: 2,
      completedVideos: 0,
      completionPercent: 0,
      status: 'not_started',
    });
  });

  afterEach(() => {
    cleanup();
  });

  test('should render the workspace screen loading spinner initially', async () => {
    // Hang getDoc promise to keep it in loading phase
    mockGetDoc.mockReturnValue(new Promise(() => {}));
    
    const { default: SkillWorkspacePage } = await import('../skills/[skillId]/page');
    render(<SkillWorkspacePage />);
    
    expect(screen.getByText(/Initializing training workspace.../i)).toBeDefined();
  });

  test('should load and render skill titles and video curriculum panels upon API resolution', async () => {
    // Resolve Skill document exists
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'react-skill-id-123',
      data: () => ({
        categoryId: 'frontend',
        name: 'React Advanced Hooks',
        description: 'Deep dive into rendering lifecycles.',
        order: 2,
        videoIds: ['v1', 'v2'],
      }),
    });

    // Resolve Category document exists
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'frontend',
      data: () => ({
        name: 'Frontend Development',
        description: 'Web interfaces',
        order: 1,
      }),
    });

    // Mock fetch for curated videos details API
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 'v1',
          title: 'Mastering React useEffect',
          description: 'A complete guide to effect synchronization hooks.',
          thumbnail: 'https://img.yt/1.jpg',
          duration: 'PT15M30S',
          publishedAt: '2026-05-19T00:00:00Z',
        },
        {
          id: 'v2',
          title: 'Mastering React custom hooks',
          description: 'Write reusable reactive logic capsules.',
          thumbnail: 'https://img.yt/2.jpg',
          duration: 'PT12M0S',
          publishedAt: '2026-05-18T00:00:00Z',
        }
      ]),
    });

    const { default: SkillWorkspacePage } = await import('../skills/[skillId]/page');
    render(<SkillWorkspacePage />);

    // Assert skill and category texts are rendered
    await waitFor(() => {
      expect(screen.getByText('React Advanced Hooks')).toBeDefined();
      expect(screen.getByText('Frontend Development')).toBeDefined();
    });

    // Assert curated videos have mapped dynamic curriculum items list
    await waitFor(() => {
      expect(screen.getAllByText('Mastering React useEffect').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mastering React custom hooks').length).toBeGreaterThan(0);
      expect(screen.getByText(/2 Modules/i)).toBeDefined();
      expect(screen.getAllByText(/Open Learning Page/i).length).toBeGreaterThan(0);
    });
  });
});
