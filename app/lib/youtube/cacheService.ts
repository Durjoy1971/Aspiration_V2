import { adminDb } from '../firebase/adminApp';

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration?: string; // ISO 8601 duration (e.g. PT10M30S)
  publishedAt: string;
  cachedAt: number;
}

export interface SkillVideoCacheDoc {
  skillId: string;
  videoIds: string[];
  cachedAt: number;
}

// 14 Days Time-To-Live cache validation (14 * 24 * 60 * 60 * 1000 ms)
export const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Checks if a cached timestamp is still valid within the 14 days TTL boundary
 */
export function isCacheValid(cachedAtMs: number): boolean {
  if (!cachedAtMs) return false;
  return Date.now() - cachedAtMs < CACHE_TTL_MS;
}

/**
 * Retrieves a normalized video document from the videoCache collection
 */
export async function getVideoCache(videoId: string): Promise<VideoMetadata | null> {
  try {
    const docRef = adminDb.collection('videoCache').doc(videoId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return null;
    }
    
    const data = docSnap.data() as VideoMetadata;
    if (isCacheValid(data.cachedAt)) {
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Failed to get video cache for ${videoId}:`, error);
    return null;
  }
}

/**
 * Saves or updates a normalized video document in the videoCache collection
 */
export async function setVideoCache(
  videoId: string,
  metadata: Omit<VideoMetadata, 'cachedAt'>
): Promise<VideoMetadata> {
  const cachedData: VideoMetadata = {
    ...metadata,
    cachedAt: Date.now(),
  };
  
  try {
    const docRef = adminDb.collection('videoCache').doc(videoId);
    await docRef.set(cachedData, { merge: true });
    return cachedData;
  } catch (error) {
    console.error(`Failed to set video cache for ${videoId}:`, error);
    return cachedData;
  }
}

/**
 * Retrieves cached query search video IDs list for a specific skillId
 */
export async function getSkillQueryCache(skillId: string): Promise<string[] | null> {
  try {
    const docRef = adminDb.collection('skillVideoCache').doc(skillId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return null;
    }
    
    const data = docSnap.data() as SkillVideoCacheDoc;
    if (isCacheValid(data.cachedAt)) {
      return data.videoIds;
    }
    return null;
  } catch (error) {
    console.error(`Failed to get skill query cache for ${skillId}:`, error);
    return null;
  }
}

/**
 * Caches the search query output list of video IDs associated with a specific skillId
 */
export async function setSkillQueryCache(
  skillId: string,
  videoIds: string[]
): Promise<void> {
  const cachedDoc: SkillVideoCacheDoc = {
    skillId,
    videoIds,
    cachedAt: Date.now(),
  };
  
  try {
    const docRef = adminDb.collection('skillVideoCache').doc(skillId);
    await docRef.set(cachedDoc, { merge: true });
  } catch (error) {
    console.error(`Failed to set skill query cache for ${skillId}:`, error);
  }
}
