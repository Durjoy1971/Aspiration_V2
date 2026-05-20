import { describe, it, expect } from 'vitest';
import { Skill } from '../../types';

describe('Dashboard Filtering & Search Algorithms', () => {
  const mockSkills: Skill[] = [
    {
      id: 'react',
      categoryId: 'frontend',
      name: 'React.js Framework',
      description: 'Master core rendering cycles, functional components, and hooks.',
      order: 1,
      videoIds: [],
    },
    {
      id: 'css',
      categoryId: 'frontend',
      name: 'Vanilla CSS Layouts',
      description: 'Design premium layouts using CSS Grid, flexbox, and HSL colors.',
      order: 2,
      videoIds: [],
    },
    {
      id: 'nodejs',
      categoryId: 'backend',
      name: 'Node.js and APIs',
      description: 'Implement Express servers and build secure microservice contracts.',
      order: 1,
      videoIds: [],
    },
  ];

  it('should return all skills when category is "all" and search is empty', async () => {
    const { filterSkills } = await import('../../lib/utils/filterUtils');
    const result = filterSkills(mockSkills, 'all', '');
    expect(result).toHaveLength(3);
  });

  it('should filter skills by specific category ID', async () => {
    const { filterSkills } = await import('../../lib/utils/filterUtils');
    const result = filterSkills(mockSkills, 'frontend', '');
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toContain('react');
    expect(result.map(s => s.id)).toContain('css');
  });

  it('should search skills by matching term in title or description case-insensitively', async () => {
    const { filterSkills } = await import('../../lib/utils/filterUtils');
    
    // Match in title
    const searchTitle = filterSkills(mockSkills, 'all', 'React');
    expect(searchTitle).toHaveLength(1);
    expect(searchTitle[0].id).toBe('react');

    // Match in description
    const searchDesc = filterSkills(mockSkills, 'all', 'express');
    expect(searchDesc).toHaveLength(1);
    expect(searchDesc[0].id).toBe('nodejs');
  });

  it('should combine category filtering and search term dynamically', async () => {
    const { filterSkills } = await import('../../lib/utils/filterUtils');
    
    // Category matches but search term does not
    const resultNoMatch = filterSkills(mockSkills, 'frontend', 'Node');
    expect(resultNoMatch).toHaveLength(0);

    // Category matches and search term matches
    const resultMatch = filterSkills(mockSkills, 'frontend', 'Grid');
    expect(resultMatch).toHaveLength(1);
    expect(resultMatch[0].id).toBe('css');
  });
});
