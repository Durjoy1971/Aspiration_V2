export interface Category {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Skill {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  order: number;
  videoIds: string[];
}

export type VideoStatus = 'not_started' | 'in_progress' | 'completed';

export interface NoteDoc {
  id: string;
  userId: string;
  videoId: string;
  skillId: string;
  content: string;
}

export interface VideoProgressDoc {
  userId: string;
  videoId: string;
  skillId: string;
  status: VideoStatus;
}

export interface SkillProgressDoc {
  userId: string;
  skillId: string;
  totalVideos: number;
  completedVideos: number;
  completionPercent: number;
  status: VideoStatus;
}
