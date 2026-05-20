import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('../../lib/firebase/clientApp', () => ({
  db: {},
  auth: {},
}));

const mockGetDoc = vi.fn();
vi.mock('firebase/firestore', () => {
  const dummyRef = { id: 'dummy' };
  return {
    doc: vi.fn(() => dummyRef),
    getDoc: mockGetDoc,
  };
});

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
    };
  },
  useParams() {
    return {
      skillId: 'react-skill-id-123',
      videoId: 'v1',
    };
  },
}));

const mockUseAuthStore = vi.fn();
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

const mockGetUserVideoNote = vi.fn();
const mockSaveUserVideoNote = vi.fn();
vi.mock('../../lib/firebase/notesService', () => ({
  getUserVideoNote: (...args: unknown[]) => mockGetUserVideoNote(...args),
  saveUserVideoNote: (...args: unknown[]) => mockSaveUserVideoNote(...args),
}));

const mockGetVideoProgress = vi.fn();
const mockUpsertVideoProgress = vi.fn();
const mockRecomputeSkillProgress = vi.fn();
vi.mock('../../lib/firebase/progressService', () => ({
  getVideoProgress: (...args: unknown[]) => mockGetVideoProgress(...args),
  upsertVideoProgress: (...args: unknown[]) => mockUpsertVideoProgress(...args),
  recomputeSkillProgress: (...args: unknown[]) => mockRecomputeSkillProgress(...args),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('VideoLearningPage', () => {
  beforeEach(() => {
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

    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        id: 'react-skill-id-123',
        data: () => ({
          categoryId: 'frontend',
          name: 'React Advanced Hooks',
          description: 'Deep dive into rendering lifecycles.',
          order: 2,
          videoIds: ['v1', 'v2'],
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        id: 'frontend',
        data: () => ({
          name: 'Frontend Development',
          description: 'Web interfaces',
          order: 1,
        }),
      });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
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
          },
        ]),
    });

    mockGetUserVideoNote.mockResolvedValue({
      id: 'user-123_v1',
      userId: 'user-123',
      skillId: 'react-skill-id-123',
      videoId: 'v1',
      content: 'Existing note',
    });

    mockGetVideoProgress.mockResolvedValue({
      userId: 'user-123',
      skillId: 'react-skill-id-123',
      videoId: 'v1',
      status: 'in_progress',
    });

    mockSaveUserVideoNote.mockResolvedValue({});
    mockUpsertVideoProgress.mockResolvedValue({});
    mockRecomputeSkillProgress.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
  });

  test('renders video learning workspace and preloads note/status', async () => {
    const { default: VideoLearningPage } = await import('../skills/[skillId]/video/[videoId]/page');
    render(<VideoLearningPage />);

    await waitFor(() => {
      expect(screen.getByText('Mastering React useEffect')).toBeDefined();
      expect(screen.getByText(/Private Study Notes/i)).toBeDefined();
      expect(screen.getByDisplayValue('Existing note')).toBeDefined();
      expect(screen.getByText(/in progress/i)).toBeDefined();
    });
  });

  test('updates status and triggers recompute', async () => {
    const { default: VideoLearningPage } = await import('../skills/[skillId]/video/[videoId]/page');
    render(<VideoLearningPage />);

    await waitFor(() => {
      expect(screen.getByText('Mastering React useEffect')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /completed/i }));

    await waitFor(() => {
      expect(mockUpsertVideoProgress).toHaveBeenCalledWith(
        'user-123',
        'react-skill-id-123',
        'v1',
        'completed'
      );
      expect(mockRecomputeSkillProgress).toHaveBeenCalled();
    });
  });
});
