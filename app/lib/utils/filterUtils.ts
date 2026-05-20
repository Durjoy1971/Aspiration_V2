import { Skill } from '../../types';

/**
 * Filter skills by category selection and search query term case-insensitively.
 */
export function filterSkills(
  skills: Skill[],
  categoryId: string,
  searchQuery: string
): Skill[] {
  return skills.filter((skill) => {
    // 1. Category Filter
    const matchesCategory =
      categoryId === 'all' || skill.categoryId === categoryId;

    // 2. Search Query Filter
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      skill.name.toLowerCase().includes(query) ||
      skill.description.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });
}
