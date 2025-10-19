import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { Equipment, EquipmentUsage } from './types';

const EQUIPMENT = 'equipment';

function usageColRef(equipmentId: string) {
  return collection(doc(db, EQUIPMENT, equipmentId), 'usage');
}

export async function logEquipmentUsageStart(equipmentId: string, userId?: string | null): Promise<EquipmentUsage> {
  const now = Date.now();
  const docRef = await addDoc(usageColRef(equipmentId), {
    equipmentId,
    userId: userId ?? null,
    startTime: now,
    endTime: null,
    createdAt: now,
  });
  return { id: docRef.id, equipmentId, userId: userId ?? null, startTime: now, endTime: null, createdAt: now } as EquipmentUsage;
}

export async function logEquipmentUsageEnd(equipmentId: string, usageId: string): Promise<EquipmentUsage | null> {
  const ref = doc(usageColRef(equipmentId), usageId) as any;
  const now = Date.now();
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  const start = typeof data.startTime === 'number' ? data.startTime : Date.now();
  const durationMinutes = Math.max(1, Math.round((now - start) / 60000));
  await updateDoc(ref, { endTime: now, durationMinutes });
  const updated = await getDoc(ref);
  return updated.exists() ? ({ id: updated.id, ...(updated.data() as any) } as EquipmentUsage) : null;
}

export async function listEquipmentUsage(equipmentId: string, max: number = 500): Promise<EquipmentUsage[]> {
  const q = query(usageColRef(equipmentId), orderBy('startTime', 'desc'), limit(max));
  const snap = await getDocs(q as any);
  return snap.docs.map((d: QueryDocumentSnapshot) => ({ id: d.id, ...(d.data() as any) } as EquipmentUsage));
}

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
