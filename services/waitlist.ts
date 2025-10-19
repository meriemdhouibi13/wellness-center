// services/waitlist.ts
import { db } from '@/lib/firebase';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import type { WaitlistEntry, WaitlistStatus } from './types';

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
  try {
    // Check if user is already on this waitlist
    const existingEntry = await getUserWaitlistEntry(equipmentId, userId);
    if (existingEntry) {
      throw new Error('You are already on this waitlist');
    }

    // Get current waitlist to determine position
    const waitlist = await getEquipmentWaitlist(equipmentId);
    const position = waitlist.length + 1;

    // Create waitlist entry
    const waitlistData = {
      equipmentId,
      userId,
      userName,
      joinedAt: Timestamp.now(),
      position,
      status: 'waiting' as WaitlistStatus,
      notified: false,
      expiresAt: null
    };

    const docRef = await addDoc(collection(db, WAITLIST_COLLECTION), waitlistData);

    // Update equipment waitlist count
    const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
    await updateDoc(equipmentRef, {
      waitlistCount: increment(1)
    });

    return {
      id: docRef.id,
      ...waitlistData
    };
  } catch (error: any) {
    console.error('Error joining waitlist:', error);
    throw error;
  }
}

/**
 * Leave the waitlist for a specific equipment
 */
export async function leaveWaitlist(equipmentId: string, userId: string): Promise<void> {
  try {
    // Find the user's waitlist entry
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('equipmentId', '==', equipmentId),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('You are not on this waitlist');
    }

    const userDoc = snapshot.docs[0];
    const userPosition = userDoc.data().position;

    // Delete the waitlist entry
    await deleteDoc(userDoc.ref);

    // Update equipment waitlist count
    const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
    await updateDoc(equipmentRef, {
      waitlistCount: increment(-1)
    });

    // Reorder remaining positions
    await reorderWaitlist(equipmentId, userPosition);
  } catch (error: any) {
    console.error('Error leaving waitlist:', error);
    throw error;
  }
}

/**
 * Get user's waitlist entry for specific equipment
 */
export async function getUserWaitlistEntry(
  equipmentId: string,
  userId: string
): Promise<WaitlistEntry | null> {
  try {
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('equipmentId', '==', equipmentId),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as WaitlistEntry;
  } catch (error) {
    console.error('Error getting user waitlist entry:', error);
    return null;
  }
}

/**
 * Get all waitlist entries for specific equipment
 */
export async function getEquipmentWaitlist(equipmentId: string): Promise<WaitlistEntry[]> {
  try {
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('equipmentId', '==', equipmentId),
      orderBy('position', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WaitlistEntry[];
  } catch (error) {
    console.error('Error getting equipment waitlist:', error);
    return [];
  }
}

/**
 * Notify the next person in the waitlist when equipment becomes available
 */
export async function notifyNextInWaitlist(equipmentId: string): Promise<void> {
  try {
    // Get the first person in the waitlist
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('equipmentId', '==', equipmentId),
      where('status', '==', 'waiting'),
      orderBy('position', 'asc'),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return; // No one waiting
    }

    const firstInLine = snapshot.docs[0];
    
    // Update their status to notified
    await updateDoc(firstInLine.ref, {
      status: 'notified',
      notified: true,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)) // 10 minutes to claim
    });

    // TODO: Send push notification to user
    // This would require expo-notifications and storing user notification tokens
    console.log(`Notified user ${firstInLine.data().userName} that equipment ${equipmentId} is available`);
  } catch (error) {
    console.error('Error notifying next in waitlist:', error);
  }
}

/**
 * Claim a spot from the waitlist (when user starts using equipment)
 */
export async function claimFromWaitlist(equipmentId: string, userId: string): Promise<void> {
  try {
    const entry = await getUserWaitlistEntry(equipmentId, userId);
    
    if (!entry) {
      throw new Error('You are not on this waitlist');
    }

    if (entry.status !== 'notified') {
      throw new Error('You have not been notified yet');
    }

    // Remove from waitlist
    await deleteDoc(doc(db, WAITLIST_COLLECTION, entry.id));

    // Update equipment waitlist count
    const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
    await updateDoc(equipmentRef, {
      waitlistCount: increment(-1)
    });

    // Reorder remaining positions
    await reorderWaitlist(equipmentId, entry.position);
  } catch (error: any) {
    console.error('Error claiming from waitlist:', error);
    throw error;
  }
}

/**
 * Reorder waitlist positions after someone leaves
 */
async function reorderWaitlist(equipmentId: string, removedPosition: number): Promise<void> {
  try {
    // Get all entries with position greater than the removed one
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('equipmentId', '==', equipmentId),
      where('position', '>', removedPosition)
    );
    
    const snapshot = await getDocs(q);
    
    // Update each position
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        position: increment(-1)
      })
    );
    
    await Promise.all(updates);
  } catch (error) {
    console.error('Error reordering waitlist:', error);
  }
}

/**
 * Subscribe to real-time updates for equipment waitlist
 */
export function subscribeToEquipmentWaitlist(
  equipmentId: string,
  callback: (waitlist: WaitlistEntry[]) => void
): () => void {
  const q = query(
    collection(db, WAITLIST_COLLECTION),
    where('equipmentId', '==', equipmentId),
    orderBy('position', 'asc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const waitlist = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WaitlistEntry[];
    
    callback(waitlist);
  });
  
  return unsubscribe;
}

/**
 * Subscribe to real-time updates for user's waitlist entries
 */
export function subscribeToUserWaitlists(
  userId: string,
  callback: (entries: WaitlistEntry[]) => void
): () => void {
  const q = query(
    collection(db, WAITLIST_COLLECTION),
    where('userId', '==', userId),
    orderBy('joinedAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WaitlistEntry[];
    
    callback(entries);
  });
  
  return unsubscribe;
}
