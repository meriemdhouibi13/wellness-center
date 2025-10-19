import { db } from '@/lib/firebase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { UserProfile, UserRole } from './types';
import Constants from 'expo-constants';

const USERS = 'users';

type UserLike = { uid: string; email?: string | null; displayName?: string | null };

export type AuthState = {
  user: UserLike | null;
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
    roleDetail: (data.roleDetail as any) ?? undefined,
    avatarUrl: (data.avatarUrl as any) ?? undefined,
    createdAt: Date.now(),
  };
  if (!snap.exists()) {
    await setDoc(ref, base, { merge: true });
    return base;
  }
  const merged = { ...base, ...(snap.data() as any) } as UserProfile;
  return merged;
}

// Force reload of profile for subscribers
export async function reloadProfile(uid: string) {
  const snap = await getDoc(doc(db, USERS, uid));
  const profile = (snap.exists() ? (snap.data() as UserProfile) : null) as UserProfile | null;
  const session = await loadSession();
  notify({ user: session ? { uid: session.uid, email: session.email, displayName: session.displayName } : null, profile, loading: false });
  return profile;
}

export async function emailPasswordSignUp(email: string, password: string, name?: string, role: UserRole = 'member') {
  // All platforms: Use Firebase Identity Toolkit REST API (works in Expo Go and web)
  const apiKey = (Constants.expoConfig?.extra?.firebaseApiKey as string) || '';
  const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error?.message || 'Sign up failed');
  const uid = json.localId as string;
  const displayName = name ?? 'Member';
  const profile = await ensureUserProfile(uid, { email, name: displayName, role });
  const userLike: UserLike = { uid, email, displayName };
  await saveSession({ uid, email, displayName, idToken: json.idToken, refreshToken: json.refreshToken, expiresIn: Number(json.expiresIn || 3600) });
  notify({ user: userLike, profile, loading: false });
  return { user: userLike, profile };
}

export async function emailPasswordSignIn(email: string, password: string) {
  // All platforms: Firebase Identity Toolkit REST API
  const apiKey = (Constants.expoConfig?.extra?.firebaseApiKey as string) || '';
  const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error?.message || 'Sign in failed');
  const uid = json.localId as string;
  const snap = await getDoc(doc(db, USERS, uid));
  const profile = (snap.exists() ? (snap.data() as UserProfile) : await ensureUserProfile(uid, { email })) as UserProfile;
  const userLike: UserLike = { uid, email, displayName: profile.name };
  await saveSession({ uid, email, displayName: profile.name, idToken: json.idToken, refreshToken: json.refreshToken, expiresIn: Number(json.expiresIn || 3600) });
  notify({ user: userLike, profile, loading: false });
  return { user: userLike, profile };
}

export async function signOutUser() {
  await AsyncStorage.removeItem(SESSION_KEY);
  notify({ user: null, profile: null, loading: false });
}

export function subscribeAuth(callback: (state: AuthState) => void) {
  listeners.add(callback);
  // Emit initial state from persisted session
  loadSession().then(async (s) => {
    if (!s) { callback({ user: null, profile: null, loading: false }); return; }
    const snap = await getDoc(doc(db, USERS, s.uid));
    const profile = (snap.exists() ? (snap.data() as UserProfile) : await ensureUserProfile(s.uid, { email: s.email ?? '' })) as UserProfile;
    callback({ user: { uid: s.uid, email: s.email, displayName: s.displayName }, profile, loading: false });
  }).catch(() => callback({ user: null, profile: null, loading: false }));
  return () => { listeners.delete(callback); };
}

// Simple in-app session store
const SESSION_KEY = 'auth:session';
type Session = { uid: string; email?: string; displayName?: string; idToken?: string; refreshToken?: string; expiresIn?: number; createdAt?: number };
async function saveSession(s: Session) { s.createdAt = Date.now(); await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
async function loadSession(): Promise<Session | null> { const t = await AsyncStorage.getItem(SESSION_KEY); return t ? JSON.parse(t) as Session : null; }

// Tiny listener set to notify AuthContext of changes
const listeners = new Set<(s: AuthState) => void>();
function notify(state: AuthState) { for (const l of listeners) { try { l(state); } catch {} } }
