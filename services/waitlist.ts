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
      notifiedAt: null,
      claimedAt: null,
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
      notifiedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)) // 5 minutes to claim
    });

    // TODO: Send push notification to user
    // This would require expo-notifications and storing user notification tokens
    console.log(`Notified user ${firstInLine.data().userName} that equipment ${equipmentId} is available`);
    
    // For now, send a local notification (user would need to be in the app)
    // In a real app, you'd send a push notification to the user's device
    try {
      // Import dynamically to avoid circular dependency
      const { sendLocalNotification } = await import('./notifications');
      await sendLocalNotification(
        'Equipment Available! 🎉',
        `${firstInLine.data().equipmentName || 'Equipment'} is now available. You have 5 minutes to claim it!`,
        {
          type: 'waitlist_notification',
          equipmentId,
          waitlistEntryId: firstInLine.id,
        }
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }
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

    // Mark as claimed before removing (for analytics)
    await updateDoc(doc(db, WAITLIST_COLLECTION, entry.id), {
      status: 'claimed',
      claimedAt: Timestamp.now()
    });

    // Remove from waitlist after a short delay to preserve analytics data
    setTimeout(async () => {
      try {
        await deleteDoc(doc(db, WAITLIST_COLLECTION, entry.id));
      } catch (error) {
        console.error('Error cleaning up claimed waitlist entry:', error);
      }
    }, 1000);

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

/**
 * Calculate estimated wait time for equipment based on historical data
 */
export async function getEstimatedWaitTime(equipmentId: string): Promise<number | null> {
  try {
    // Get completed waitlist entries for this equipment (last 30 days)
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('equipmentId', '==', equipmentId),
      where('status', '==', 'claimed'),
      where('joinedAt', '>=', thirtyDaysAgo),
      orderBy('joinedAt', 'desc'),
      limit(50) // Last 50 completed waits
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null; // No historical data
    }

    // Calculate average wait time in minutes
    let totalWaitTime = 0;
    let validEntries = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.joinedAt && data.claimedAt) {
        const waitTimeMs = data.claimedAt.toDate().getTime() - data.joinedAt.toDate().getTime();
        const waitTimeMinutes = waitTimeMs / (1000 * 60);
        totalWaitTime += waitTimeMinutes;
        validEntries++;
      }
    });
    
    if (validEntries === 0) {
      return null;
    }
    
    const averageWaitTime = totalWaitTime / validEntries;
    return Math.round(averageWaitTime);
  } catch (error) {
    console.error('Error calculating estimated wait time:', error);
    return null;
  }
}

/**
 * Get waitlist analytics for equipment
 */
export async function getWaitlistAnalytics(equipmentId: string): Promise<{
  averageWaitTime: number | null;
  totalWaitsCompleted: number;
  currentWaitlistLength: number;
}> {
  try {
    const [averageWaitTime, currentWaitlist] = await Promise.all([
      getEstimatedWaitTime(equipmentId),
      getEquipmentWaitlist(equipmentId)
    ]);

    // Count completed waits (this is approximate since we clean up entries)
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('equipmentId', '==', equipmentId),
      where('status', '==', 'claimed'),
      where('joinedAt', '>=', thirtyDaysAgo)
    );
    
    const completedSnapshot = await getDocs(q);
    
    return {
      averageWaitTime,
      totalWaitsCompleted: completedSnapshot.size,
      currentWaitlistLength: currentWaitlist.length
    };
  } catch (error) {
    console.error('Error getting waitlist analytics:', error);
    return {
      averageWaitTime: null,
      totalWaitsCompleted: 0,
      currentWaitlistLength: 0
    };
  }
}

/**
 * Clean up expired waitlist entries (call this periodically)
 */
export async function cleanupExpiredWaitlistEntries(): Promise<void> {
  try {
    const now = Timestamp.now();
    
    // Find expired entries
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('status', '==', 'notified'),
      where('expiresAt', '<', now)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return;
    }
    
    // Mark as expired and remove
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { status: 'expired' })
    );
    
    await Promise.all(updates);
    
    // Remove after a delay to preserve analytics
    setTimeout(async () => {
      try {
        const deletions = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletions);
        
        // Update equipment waitlist counts
        const equipmentUpdates = new Map<string, number>();
        snapshot.docs.forEach(doc => {
          const equipmentId = doc.data().equipmentId;
          equipmentUpdates.set(equipmentId, (equipmentUpdates.get(equipmentId) || 0) + 1);
        });
        
        const equipmentUpdatePromises = Array.from(equipmentUpdates.entries()).map(
          ([equipmentId, decrement]) => 
            updateDoc(doc(db, EQUIPMENT_COLLECTION, equipmentId), {
              waitlistCount: increment(-decrement)
            })
        );
        
        await Promise.all(equipmentUpdatePromises);
      } catch (error) {
        console.error('Error cleaning up expired entries:', error);
      }
    }, 2000);
    
    console.log(`Cleaned up ${snapshot.size} expired waitlist entries`);
  } catch (error) {
    console.error('Error cleaning up expired waitlist entries:', error);
  }
}
