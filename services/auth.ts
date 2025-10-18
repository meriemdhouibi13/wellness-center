import { auth, db } from '@/lib/firebase';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from './types';

const USERS = 'users';

export type AuthState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
};

export async function ensureUserProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const ref = doc(db, USERS, uid);
  const snap = await getDoc(ref);
  const base: UserProfile = {
    id: uid,
    name: data.name ?? 'New User',
    email: data.email ?? '',
    role: (data.role as UserRole) ?? 'member',
    createdAt: Date.now(),
  };
  if (!snap.exists()) {
    await setDoc(ref, base, { merge: true });
    return base;
  }
  const merged = { ...base, ...(snap.data() as any) } as UserProfile;
  return merged;
}

export async function emailPasswordSignUp(email: string, password: string, name?: string, role: UserRole = 'member') {
  // For Expo web this sets browser persistence; on native it's ignored.
  try { await setPersistence(auth, browserLocalPersistence); } catch {}
  const res = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    try { await updateProfile(res.user, { displayName: name }); } catch {}
  }
  const profile = await ensureUserProfile(res.user.uid, { email, name: name ?? res.user.displayName ?? 'Member', role });
  return { user: res.user, profile };
}

export async function emailPasswordSignIn(email: string, password: string) {
  try { await setPersistence(auth, browserLocalPersistence); } catch {}
  const res = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, USERS, res.user.uid));
  const profile = (snap.exists() ? (snap.data() as UserProfile) : await ensureUserProfile(res.user.uid, { email })) as UserProfile;
  return { user: res.user, profile };
}

export async function signOutUser() {
  await signOut(auth);
}

export function subscribeAuth(callback: (state: AuthState) => void) {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback({ user: null, profile: null, loading: false });
      return;
    }
    const snap = await getDoc(doc(db, USERS, user.uid));
    const profile = snap.exists() ? (snap.data() as UserProfile) : await ensureUserProfile(user.uid, { email: user.email ?? '' });
    callback({ user, profile, loading: false });
  });
  return unsub;
}
