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
        { id: 'cat-1', data: () => ({ name: 'Frontend', description: 'Web UI', order: 1 }) },
        { id: 'skill-1', data: () => ({ categoryId: 'cat-1', name: 'React', description: 'UI Lib', order: 1, videoIds: [] }) },
      ],
    })),
    doc: vi.fn(() => dummyRef),
    setDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    query: vi.fn((ref) => ref),
    orderBy: vi.fn(() => dummyRef),
  };
});

import { render, screen, waitFor, cleanup } from '@testing-library/react';
import AdminDashboardPage from '../page';
import AdminCategoriesPage from '../categories/page';
import AdminSkillsPage from '../skills/page';

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

describe('Admin Control Panels & CRUD Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: {
        uid: 'admin-123',
        displayName: 'Test Admin',
        email: 'admin@test.com',
        role: 'admin',
      },
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  test('should render the secure Admin Dashboard Control Center home layout', () => {
    render(<AdminDashboardPage />);
    expect(screen.getByText(/Admin Control Center/i)).toBeDefined();
    expect(screen.getByText(/Manage Categories/i)).toBeDefined();
    expect(screen.getByText(/Manage Skills/i)).toBeDefined();
  });

  test('should render the Categories CRUD Panel form and items list', async () => {
    render(<AdminCategoriesPage />);
    
    // Assert unique page markers
    expect(screen.getByText(/Add New Category/i)).toBeDefined();
    expect(screen.getByText(/Back to Admin Center/i)).toBeDefined();
    
    // Check that categories lists are loaded from mocked firestore
    await waitFor(() => {
      expect(screen.getByText(/Active Path Categories/i)).toBeDefined();
    });
  });

  test('should render the Skills CRUD Panel with parent selectors', async () => {
    render(<AdminSkillsPage />);
    
    // Assert unique page markers
    expect(screen.getByText(/Add New Skill Module/i)).toBeDefined();
    expect(screen.getByText(/Back to Admin Center/i)).toBeDefined();
    
    await waitFor(() => {
      expect(screen.getByText(/Active Curriculum Skills/i)).toBeDefined();
    });
  });
});
