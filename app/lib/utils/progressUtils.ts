import { VideoStatus } from '../../types';

export interface SkillCompletionSummary {
  totalVideos: number;
  completedVideos: number;
  completionPercent: number;
  status: VideoStatus;
}

export function calculateSkillCompletion(statuses: VideoStatus[]): SkillCompletionSummary {
  const totalVideos = statuses.length;

  if (totalVideos === 0) {
    return {
      totalVideos: 0,
      completedVideos: 0,
      completionPercent: 0,
      status: 'not_started',
    };
  }

  const completedVideos = statuses.filter((status) => status === 'completed').length;
  const startedVideos = statuses.filter((status) => status !== 'not_started').length;
  const completionPercent = Math.round((completedVideos / totalVideos) * 100);

  let status: VideoStatus = 'not_started';
  if (completedVideos === totalVideos) {
    status = 'completed';
  } else if (startedVideos > 0) {
    status = 'in_progress';
  }

  return {
    totalVideos,
    completedVideos,
    completionPercent,
    status,
  };
}
