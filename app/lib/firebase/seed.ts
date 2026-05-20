import { doc, setDoc } from 'firebase/firestore';
import { db } from './clientApp';
import { Category, Skill } from '../../types';

export const standardCategories: Category[] = [
  {
    id: 'frontend',
    name: 'Frontend Development',
    description: 'Master HTML, modern HSL vanilla CSS, interactive animations, and Next.js applications.',
    order: 1,
  },
  {
    id: 'backend',
    name: 'Backend Development',
    description: 'Design secure APIs, perform real-time Firestore synchronization, and model relational data.',
    order: 2,
  },
  {
    id: 'devops',
    name: 'DevOps & Infrastructure',
    description: 'Understand cloud orchestration, build Docker containers, and set up continuous integration pipelines.',
    order: 3,
  },
];

export const standardSkills: Skill[] = [
  {
    id: 'react',
    categoryId: 'frontend',
    name: 'React.js Framework',
    description: 'Understand component rendering, states, hooks, and clean responsive UI architecture.',
    order: 1,
    videoIds: [],
  },
  {
    id: 'css',
    categoryId: 'frontend',
    name: 'Vanilla CSS & Interactions',
    description: 'Style custom components using responsive grids, premium transitions, and hover micro-animations.',
    order: 2,
    videoIds: [],
  },
  {
    id: 'nodejs',
    categoryId: 'backend',
    name: 'Node.js & Express',
    description: 'Build backend microservices, configure middleware routers, and manage environment secrets.',
    order: 1,
    videoIds: [],
  },
  {
    id: 'docker',
    categoryId: 'devops',
    name: 'Docker Containers',
    description: 'Package web applications into lightweight portable container images and build pipelines.',
    order: 1,
    videoIds: [],
  },
];

export async function seedDatabase(): Promise<void> {
  // Seed Categories
  for (const category of standardCategories) {
    const categoryDocRef = doc(db, 'categories', category.id);
    await setDoc(categoryDocRef, category);
  }

  // Seed Skills
  for (const skill of standardSkills) {
    const skillDocRef = doc(db, 'skills', skill.id);
    await setDoc(skillDocRef, skill);
  }
}
