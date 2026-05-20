import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firestore functions
const mockSetDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockGetDocs = vi.fn(() => ({
  docs: [], // Empty by default
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db, path, id) => ({ path: `${path}/${id}` })),
  collection: vi.fn((_db, name) => ({ path: name })),
  getDocs: mockGetDocs,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
}));

vi.mock('../clientApp', () => ({
  db: {},
}));

describe('Database Seeder integration logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should seed categories and skills successfully', async () => {
    const { seedDatabase } = await import('../seed');

    // Run the seed script
    await seedDatabase();

    // Verify it writes key categories (Frontend, Backend)
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'categories/frontend' }),
      expect.objectContaining({ name: 'Frontend Development' })
    );

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'categories/backend' }),
      expect.objectContaining({ name: 'Backend Development' })
    );

    // Verify it writes key skills (React, Node) under correct category mapping
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'skills/react' }),
      expect.objectContaining({
        name: 'React.js Framework',
        categoryId: 'frontend',
      })
    );

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'skills/nodejs' }),
      expect.objectContaining({
        name: 'Node.js & Express',
        categoryId: 'backend',
      })
    );
  });
});
