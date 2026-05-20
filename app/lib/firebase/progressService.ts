import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from './clientApp';
import { SkillProgressDoc, VideoProgressDoc, VideoStatus } from '../../types';
import { calculateSkillCompletion } from '../utils/progressUtils';

function chunkVideoIds(videoIds: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += size) {
    chunks.push(videoIds.slice(i, i + size));
  }
  return chunks;
}

export async function getVideoProgress(
  userId: string,
  videoId: string
): Promise<VideoProgressDoc | null> {
  const progressRef = doc(db, 'progress', userId, 'videos', videoId);
  const progressSnap = await getDoc(progressRef);

  if (!progressSnap.exists()) {
    return null;
  }

  return progressSnap.data() as VideoProgressDoc;
}

export async function getSkillProgress(
  userId: string,
  skillId: string
): Promise<SkillProgressDoc | null> {
  const progressRef = doc(db, 'progress', userId, 'skills', skillId);
  const progressSnap = await getDoc(progressRef);

  if (!progressSnap.exists()) {
    return null;
  }

  return progressSnap.data() as SkillProgressDoc;
}

export async function upsertVideoProgress(
  userId: string,
  skillId: string,
  videoId: string,
  status: VideoStatus
): Promise<VideoProgressDoc> {
  const progressRef = doc(db, 'progress', userId, 'videos', videoId);
  const payload: VideoProgressDoc = {
    userId,
    videoId,
    skillId,
    status,
  };

  await setDoc(
    progressRef,
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return payload;
}

export async function recomputeSkillProgress(
  userId: string,
  skillId: string,
  videoIds: string[]
): Promise<SkillProgressDoc> {
  let statuses: VideoStatus[] = [];

  if (videoIds.length > 0) {
    const progressCollectionRef = collection(db, 'progress', userId, 'videos');
    const statusByVideoId = new Map<string, VideoStatus>();

    const chunks = chunkVideoIds(videoIds, 10);
    for (const chunk of chunks) {
      const progressQuery = query(
        progressCollectionRef,
        where('skillId', '==', skillId),
        where('videoId', 'in', chunk)
      );
      const progressSnapshot = await getDocs(progressQuery);

      progressSnapshot.docs.forEach((docItem) => {
        const progress = docItem.data() as VideoProgressDoc;
        statusByVideoId.set(progress.videoId, progress.status);
      });
    }

    statuses = videoIds.map((videoId) => statusByVideoId.get(videoId) || 'not_started');
  }

  const completion = calculateSkillCompletion(statuses);

  const summary: SkillProgressDoc = {
    userId,
    skillId,
    totalVideos: completion.totalVideos,
    completedVideos: completion.completedVideos,
    completionPercent: completion.completionPercent,
    status: completion.status,
  };

  const skillProgressRef = doc(db, 'progress', userId, 'skills', skillId);
  await setDoc(
    skillProgressRef,
    {
      ...summary,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return summary;
}
