import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Equipment } from './types';

const EQUIPMENT = 'equipment';

export async function upsertEquipment(item: Equipment): Promise<void> {
  await setDoc(doc(db, EQUIPMENT, item.id), item, { merge: true });
}

export async function getEquipment(id: string): Promise<Equipment | null> {
  const snap = await getDoc(doc(db, EQUIPMENT, id));
  return snap.exists() ? (snap.data() as Equipment) : null;
}

export async function listEquipment(): Promise<Equipment[]> {
  const q = query(collection(db, EQUIPMENT));
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot) => d.data() as Equipment);
}

export async function updateEquipmentStatus(id: string, status: Equipment['status']): Promise<void> {
  await updateDoc(doc(db, EQUIPMENT, id), { status, updatedAt: Date.now() });
}
