import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ProviderProfile } from './types';

const PROVIDERS = 'providers';

export async function upsertProvider(provider: ProviderProfile): Promise<void> {
  await setDoc(doc(db, PROVIDERS, provider.id), provider, { merge: true });
}

export async function getProvider(id: string): Promise<ProviderProfile | null> {
  const snap = await getDoc(doc(db, PROVIDERS, id));
  return snap.exists() ? (snap.data() as ProviderProfile) : null;
}

export async function listProviders(specialty?: string): Promise<ProviderProfile[]> {
  const col = collection(db, PROVIDERS);
  const q = specialty ? query(col, where('specialty', '==', specialty)) : col;
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ProviderProfile);
}
