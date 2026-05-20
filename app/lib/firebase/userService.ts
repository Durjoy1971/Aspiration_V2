import { doc, getDoc, setDoc, updateDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { db } from './clientApp';

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'learner' | 'admin' | 'superAdmin';
  createdAt: FieldValue;
  lastLoginAt: FieldValue;
}

export async function syncUserDoc(firebaseUser: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserDoc> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  const email = firebaseUser.email || '';
  const displayName = firebaseUser.displayName || 'Learner';
  const photoURL = firebaseUser.photoURL || undefined;

  // Determine if this is the Super Admin email.
  const isSuperAdminEmail =
    email === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ||
    email === 'durjoy1971office@gmail.com';

  if (!userDocSnap.exists()) {
    // Assign role. If the email is the approved Super Admin email, promote them automatically.
    const role = isSuperAdminEmail ? 'superAdmin' : 'learner';

    const newUser: UserDoc = {
      uid: firebaseUser.uid,
      email,
      displayName,
      photoURL,
      role,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    await setDoc(userDocRef, newUser);
    return { ...newUser };
  } else {
    // If the user already exists, update their profile fields and lastLoginAt, but preserve their role.
    const existingData = userDocSnap.data() as UserDoc;

    const updates: Partial<UserDoc> = {
      displayName,
      photoURL,
      lastLoginAt: serverTimestamp(),
    };

    await updateDoc(userDocRef, updates);
    return {
      ...existingData,
      ...updates,
    };
  }
}
