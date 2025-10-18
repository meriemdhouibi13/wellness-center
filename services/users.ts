import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserProfile } from './types';

const USERS = 'users';

export async function upsertUser(user: UserProfile): Promise<void> {
  await setDoc(doc(db, USERS, user.id), user, { merge: true });
}

export async function getUser(id: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, USERS, id));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function listUsers(role?: UserProfile['role']): Promise<UserProfile[]> {
  const col = collection(db, USERS);
  const q = role ? query(col, where('role', '==', role)) : col;
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}
