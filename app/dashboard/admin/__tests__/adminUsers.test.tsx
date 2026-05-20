import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Mock client Firebase App to prevent initialization throws
vi.mock('../../../lib/firebase/clientApp', () => ({
  db: {},
  auth: {},
}));

// Mock firebase/firestore with safe query reference chaining
vi.mock('firebase/firestore', () => {
  const dummyRef = { id: 'dummy' };
  return {
    collection: vi.fn(() => dummyRef),
    getDocs: vi.fn(() => Promise.resolve({
      docs: [
        { id: 'u1', data: () => ({ displayName: 'Learner A', email: 'a@learner.com', role: 'learner' }) },
        { id: 'u2', data: () => ({ displayName: 'Admin B', email: 'b@admin.com', role: 'admin' }) },
      ],
    })),
    doc: vi.fn(() => dummyRef),
    setDoc: vi.fn(() => Promise.resolve()),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    query: vi.fn((ref) => ref),
    orderBy: vi.fn(() => dummyRef),
  };
});

import { render, screen, waitFor, cleanup } from '@testing-library/react';
import AdminUsersPage from '../users/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
    };
  },
}));

// Mock useAuthStore
const mockUseAuthStore = vi.fn();
vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

describe('SuperAdmin Users & Roles Panel Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: {
        uid: 'superadmin-789',
        displayName: 'Boss SuperAdmin',
        email: 'durjoy1971office@gmail.com',
        role: 'superAdmin',
      },
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  test('should render the User & Role Panel for authenticated superAdmin', async () => {
    render(<AdminUsersPage />);

    // Assert unique page indicators
    expect(screen.getByText(/Privileged Accounts Manager/i)).toBeDefined();
    expect(screen.getByText(/SuperAdmin Access Level/i)).toBeDefined();
    expect(screen.getByText(/Back to Admin Center/i)).toBeDefined();

    // Verify dynamic loaded learners list
    await waitFor(() => {
      expect(screen.getByText(/Learner A/i)).toBeDefined();
      expect(screen.getByText(/Admin B/i)).toBeDefined();
    });
  });
});
