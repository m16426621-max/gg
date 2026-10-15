import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

export { onAuthStateChanged };
export type { User };
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Question, LeaderboardEntry } from '../types/exam';

export const ADMIN_EMAIL = 'm16426621@gmail.com';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore (with custom database ID if provided)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (
      error?.code === 'unavailable' ||
      error?.message?.includes('offline') ||
      error?.message?.includes('unavailable')
    ) {
      // Normal behavior when device operates offline or backend is establishing connection
      return;
    }
    console.warn('Firebase connection status:', error?.message || error);
  }
}
testFirestoreConnection().catch(() => {});

// Check if a user is the owner/admin
export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Sign in with Google Popup
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Upsert user profile in firestore
    const user = result.user;
    const userRef = doc(db, 'users', user.uid);
    const role = isUserAdmin(user) ? 'admin' : 'candidate';
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'ผู้เข้าสอบ',
        photoURL: user.photoURL || '',
        role,
        lastLoginAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return user;
  } catch (err: any) {
    console.error('Google Sign-In Error:', err);
    throw err;
  }
}

// Sign out
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Fetch questions from Firestore
export async function getQuestionsFromCloud(): Promise<Question[]> {
  try {
    const colRef = collection(db, 'questions');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    return snapshot.docs.map((docSnap) => docSnap.data() as Question);
  } catch (err) {
    console.warn('Could not fetch questions from cloud, falling back to local:', err);
    return [];
  }
}

// Save single question to Firestore (Admin only)
export async function saveQuestionToCloud(question: Question): Promise<void> {
  const docRef = doc(db, 'questions', question.id);
  await setDoc(docRef, question);
}

// Delete question from Firestore (Admin only)
export async function deleteQuestionFromCloud(questionId: string): Promise<void> {
  const docRef = doc(db, 'questions', questionId);
  await deleteDoc(docRef);
}

// Batch seed questions to Firestore (Admin only)
export async function seedQuestionsToCloud(questions: Question[]): Promise<void> {
  for (const q of questions) {
    await saveQuestionToCloud(q);
  }
}

// Fetch Leaderboard from Firestore
export async function getLeaderboardFromCloud(): Promise<LeaderboardEntry[]> {
  try {
    const colRef = collection(db, 'leaderboard');
    const q = query(colRef, orderBy('score', 'desc'), limit(100));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    return snapshot.docs.map((docSnap) => docSnap.data() as LeaderboardEntry);
  } catch (err) {
    console.warn('Could not fetch cloud leaderboard:', err);
    return [];
  }
}

// Save score entry to Firestore
export async function saveLeaderboardToCloud(entry: LeaderboardEntry): Promise<void> {
  try {
    const docRef = doc(db, 'leaderboard', entry.id);
    await setDoc(docRef, entry);
  } catch (err) {
    console.error('Error saving score to cloud leaderboard:', err);
  }
}
