import { addDoc, collection, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserSession } from './types';

function colRef(uid: string) {
  return collection(doc(db, 'users', uid), 'sessions');
}

export async function getOpenSession(uid: string): Promise<UserSession | null> {
  const q = query(colRef(uid), where('endTime', '==', null), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data() as any;
  return { id: d.id, ...data } as UserSession;
}

export async function startSession(uid: string): Promise<UserSession> {
  const open = await getOpenSession(uid);
  if (open) throw new Error('You already have an active session');
  const now = Date.now();
  const docRef = await addDoc(colRef(uid), {
    startTime: now,
    endTime: null,
    createdAt: now,
  });
  return { id: docRef.id, startTime: now, endTime: null, createdAt: now };
}

export async function endSession(uid: string): Promise<UserSession> {
  const open = await getOpenSession(uid);
  if (!open) throw new Error('No active session to end');
  const end = Date.now();
  const durationMinutes = Math.max(1, Math.round((end - open.startTime) / 60000));
  await updateDoc(doc(colRef(uid), open.id), {
    endTime: end,
    durationMinutes,
  });
  return { ...open, endTime: end, durationMinutes };
}

export async function listSessions(uid: string, max: number = 100): Promise<UserSession[]> {
  const q = query(colRef(uid), orderBy('startTime', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as UserSession));
}
