// services/waitlist.ts
import { collection, doc, setDoc, deleteDoc, query, where, getDocs, orderBy, updateDoc, increment, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WaitlistEntry } from './types';

const WAITLIST_COLLECTION = 'waitlist';
const EQUIPMENT_COLLECTION = 'equipment';

/**
 * Join the waitlist for a specific equipment
 */
export async function joinWaitlist(
  equipmentId: string,
  userId: string,
  userName: string
): Promise<WaitlistEntry> {
  if (!db) throw new Error('Firebase not initialized');
  
  // Check if user is already on this waitlist
  const existing = await getUserWaitlistEntry(equipmentId, userId);
  if (existing) {
    throw new Error('You are already on the waitlist for this equipment');
  }
  
  // Get current waitlist count for this equipment
  const waitlistRef = collection(db, WAITLIST_COLLECTION);
  const q = query(
    waitlistRef,
    where('equipmentId', '==', equipmentId),
    where('status', '==', 'waiting')
  );
  const snapshot = await getDocs(q);
  const position = snapshot.size + 1;
  
  // Create waitlist entry
  const entryId = `${equipmentId}_${userId}_${Date.now()}`;
  const entry: WaitlistEntry = {
    id: entryId,
    equipmentId,
    userId,
    userName,
    joinedAt: Date.now(),
    position,
    notified: false,
    status: 'waiting',
  };
  
  // Save to Firestore
  await setDoc(doc(db, WAITLIST_COLLECTION, entryId), entry);
  
  // Update equipment waitlist count
  const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
  await updateDoc(equipmentRef, {
    waitlistCount: increment(1),
  });
  
  return entry;
}

/**
 * Leave the waitlist
 */
export async function leaveWaitlist(
  equipmentId: string,
  userId: string
): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  // Find user's waitlist entry
  const entry = await getUserWaitlistEntry(equipmentId, userId);
  if (!entry) {
    throw new Error('You are not on the waitlist for this equipment');
  }
  
  // Delete the entry
  await deleteDoc(doc(db, WAITLIST_COLLECTION, entry.id));
  
  // Update equipment waitlist count
  const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
  await updateDoc(equipmentRef, {
    waitlistCount: increment(-1),
  });
  
  // Reorder remaining waitlist entries
  await reorderWaitlist(equipmentId);
}

/**
 * Get user's waitlist entry for specific equipment
 */
export async function getUserWaitlistEntry(
  equipmentId: string,
  userId: string
): Promise<WaitlistEntry | null> {
  if (!db) throw new Error('Firebase not initialized');
  
  const waitlistRef = collection(db, WAITLIST_COLLECTION);
  const q = query(
    waitlistRef,
    where('equipmentId', '==', equipmentId),
    where('userId', '==', userId),
    where('status', '==', 'waiting')
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return snapshot.docs[0].data() as WaitlistEntry;
}

/**
 * Get all waitlist entries for a user
 */
export async function getUserWaitlists(userId: string): Promise<WaitlistEntry[]> {
  if (!db) throw new Error('Firebase not initialized');
  
  const waitlistRef = collection(db, WAITLIST_COLLECTION);
  const q = query(
    waitlistRef,
    where('userId', '==', userId),
    where('status', '==', 'waiting'),
    orderBy('joinedAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as WaitlistEntry);
}

/**
 * Get all waitlist entries for specific equipment
 */
export async function getEquipmentWaitlist(equipmentId: string): Promise<WaitlistEntry[]> {
  if (!db) throw new Error('Firebase not initialized');
  
  const waitlistRef = collection(db, WAITLIST_COLLECTION);
  const q = query(
    waitlistRef,
    where('equipmentId', '==', equipmentId),
    where('status', '==', 'waiting'),
    orderBy('joinedAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as WaitlistEntry);
}

/**
 * Notify next person in waitlist when equipment becomes available
 * This will be called when a session ends
 */
export async function notifyNextInWaitlist(equipmentId: string): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  // Get next person in line
  const waitlist = await getEquipmentWaitlist(equipmentId);
  if (waitlist.length === 0) return;
  
  const nextPerson = waitlist[0];
  
  // Mark as notified and set expiry (5 minutes from now)
  const entryRef = doc(db, WAITLIST_COLLECTION, nextPerson.id);
  await updateDoc(entryRef, {
    status: 'notified',
    notified: true,
    expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
  });
  
  // TODO: Send push notification here when implemented
  console.log(`Notifying ${nextPerson.userName} that ${equipmentId} is available`);
}

/**
 * Claim equipment when notified (user starts session)
 */
export async function claimFromWaitlist(
  equipmentId: string,
  userId: string
): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  const entry = await getUserWaitlistEntry(equipmentId, userId);
  if (!entry) return;
  
  // Mark as claimed
  const entryRef = doc(db, WAITLIST_COLLECTION, entry.id);
  await updateDoc(entryRef, {
    status: 'claimed',
  });
  
  // Update equipment waitlist count
  const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
  await updateDoc(equipmentRef, {
    waitlistCount: increment(-1),
  });
  
  // Delete the entry after claiming
  await deleteDoc(entryRef);
}

/**
 * Reorder waitlist positions after someone leaves
 */
async function reorderWaitlist(equipmentId: string): Promise<void> {
  if (!db) throw new Error('Firebase not initialized');
  
  const waitlist = await getEquipmentWaitlist(equipmentId);
  
  // Update positions
  const updates = waitlist.map((entry, index) => {
    const entryRef = doc(db, WAITLIST_COLLECTION, entry.id);
    return updateDoc(entryRef, { position: index + 1 });
  });
  
  await Promise.all(updates);
}

/**
 * Get estimated wait time based on average session duration
 * Returns time in minutes
 */
export async function getEstimatedWaitTime(
  equipmentId: string,
  position: number
): Promise<number> {
  // Average session time is 20 minutes (you can make this dynamic later)
  const avgSessionMinutes = 20;
  return position * avgSessionMinutes;
}

/**
 * Subscribe to waitlist changes for specific equipment
 * Useful for real-time updates in the UI
 */
export function subscribeToEquipmentWaitlist(
  equipmentId: string,
  callback: (waitlist: WaitlistEntry[]) => void
): () => void {
  if (!db) throw new Error('Firebase not initialized');
  
  const waitlistRef = collection(db, WAITLIST_COLLECTION);
  const q = query(
    waitlistRef,
    where('equipmentId', '==', equipmentId),
    where('status', '==', 'waiting'),
    orderBy('joinedAt', 'asc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const waitlist = snapshot.docs.map(doc => doc.data() as WaitlistEntry);
    callback(waitlist);
  });
  
  return unsubscribe;
}

/**
 * Subscribe to user's waitlist entries
 * Useful for "My Waitlists" view
 */
export function subscribeToUserWaitlists(
  userId: string,
  callback: (waitlists: WaitlistEntry[]) => void
): () => void {
  if (!db) throw new Error('Firebase not initialized');
  
  const waitlistRef = collection(db, WAITLIST_COLLECTION);
  const q = query(
    waitlistRef,
    where('userId', '==', userId),
    where('status', '==', 'waiting'),
    orderBy('joinedAt', 'asc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const waitlists = snapshot.docs.map(doc => doc.data() as WaitlistEntry);
    callback(waitlists);
  });
  
  return unsubscribe;
}
