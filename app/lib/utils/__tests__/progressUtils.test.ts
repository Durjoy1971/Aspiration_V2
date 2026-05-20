import { describe, it, expect } from 'vitest';
import { calculateSkillCompletion } from '../progressUtils';

describe('progressUtils calculateSkillCompletion', () => {
  it('returns zeroed summary for empty statuses', () => {
    const result = calculateSkillCompletion([]);

    expect(result).toEqual({
      totalVideos: 0,
      completedVideos: 0,
      completionPercent: 0,
      status: 'not_started',
    });
  });

  it('returns not_started when all videos are untouched', () => {
    const result = calculateSkillCompletion(['not_started', 'not_started']);

    expect(result.totalVideos).toBe(2);
    expect(result.completedVideos).toBe(0);
    expect(result.completionPercent).toBe(0);
    expect(result.status).toBe('not_started');
  });

  it('returns in_progress when any video has started but not all complete', () => {
    const result = calculateSkillCompletion(['not_started', 'in_progress', 'completed']);

    expect(result.totalVideos).toBe(3);
    expect(result.completedVideos).toBe(1);
    expect(result.completionPercent).toBe(33);
    expect(result.status).toBe('in_progress');
  });

  it('returns completed when all videos are completed', () => {
    const result = calculateSkillCompletion(['completed', 'completed']);

    expect(result.totalVideos).toBe(2);
    expect(result.completedVideos).toBe(2);
    expect(result.completionPercent).toBe(100);
    expect(result.status).toBe('completed');
  });
});
