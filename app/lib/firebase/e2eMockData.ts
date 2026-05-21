/**
 * E2E Mock Data Layer
 *
 * When NEXT_PUBLIC_E2E_TEST_MODE is 'true', pages use this in-memory store
 * instead of hitting real Firestore.  This avoids the "Missing or insufficient
 * permissions" error that occurs because the E2E auth shim never performs a
 * real Firebase sign-in, so `request.auth` is null.
 */

import { Category, Skill } from '../../types';

export function isE2ETestMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true'
  );
}

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

let mockCategories: Category[] = [
  {
    id: 'e2e-category',
    name: 'E2E Test Category',
    description: 'Seeded category for end-to-end tests',
    order: 1,
  },
];

let mockSkills: Skill[] = [
  {
    id: 'e2e-skill',
    categoryId: 'e2e-category',
    name: 'E2E Test Skill',
    description: 'Seeded skill for end-to-end tests',
    order: 1,
    videoIds: [],
    keywords: ['e2e', 'test'],
  },
];

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export function e2eGetCategories(): Category[] {
  return [...mockCategories].sort((a, b) => a.order - b.order);
}

export function e2eAddCategory(category: Category): void {
  // Replace if same id already exists, otherwise push
  const idx = mockCategories.findIndex((c) => c.id === category.id);
  if (idx >= 0) {
    mockCategories[idx] = category;
  } else {
    mockCategories.push(category);
  }
}

export function e2eUpdateCategory(id: string, updates: Partial<Category>): void {
  const idx = mockCategories.findIndex((c) => c.id === id);
  if (idx >= 0) {
    mockCategories[idx] = { ...mockCategories[idx], ...updates };
  }
}

export function e2eDeleteCategory(id: string): void {
  mockCategories = mockCategories.filter((c) => c.id !== id);
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export function e2eGetSkills(): Skill[] {
  return [...mockSkills].sort((a, b) => a.order - b.order);
}

export function e2eAddSkill(skill: Skill): void {
  const idx = mockSkills.findIndex((s) => s.id === skill.id);
  if (idx >= 0) {
    mockSkills[idx] = skill;
  } else {
    mockSkills.push(skill);
  }
}

export function e2eUpdateSkill(id: string, updates: Partial<Skill>): void {
  const idx = mockSkills.findIndex((s) => s.id === id);
  if (idx >= 0) {
    mockSkills[idx] = { ...mockSkills[idx], ...updates };
  }
}

export function e2eDeleteSkill(id: string): void {
  mockSkills = mockSkills.filter((s) => s.id !== id);
}
