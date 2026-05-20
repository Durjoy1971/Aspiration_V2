import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './clientApp';
import { NoteDoc } from '../../types';

function buildNoteId(userId: string, videoId: string) {
  return `${userId}_${videoId}`;
}

export async function getUserVideoNote(userId: string, videoId: string): Promise<NoteDoc | null> {
  const noteId = buildNoteId(userId, videoId);
  const noteRef = doc(db, 'notes', noteId);
  const noteSnap = await getDoc(noteRef);

  if (!noteSnap.exists()) {
    return null;
  }

  return {
    id: noteSnap.id,
    ...(noteSnap.data() as Omit<NoteDoc, 'id'>),
  };
}

export async function saveUserVideoNote(
  userId: string,
  skillId: string,
  videoId: string,
  content: string
): Promise<NoteDoc> {
  const noteId = buildNoteId(userId, videoId);
  const noteRef = doc(db, 'notes', noteId);

  await setDoc(
    noteRef,
    {
      userId,
      skillId,
      videoId,
      content,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    id: noteId,
    userId,
    skillId,
    videoId,
    content,
  };
}
