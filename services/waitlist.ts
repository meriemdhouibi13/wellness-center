// services/waitlist.ts
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import * as Notifications from 'expo-notifications';
import { logEquipmentUsageStart } from './equipment';
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
export async function notifyNextInWaitlist(equipmentId: string, equipmentName?: string): Promise<void> {
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
    const waitlistData = firstInLine.data();
    
    // Update their status to notified
    await updateDoc(firstInLine.ref, {
      status: 'notified',
      notified: true,
      notifiedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)) // 5 minutes to claim
    });

    // Send push notification to user
    const eqName = equipmentName || 'Equipment';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${eqName} Available Now!`,
        body: `The ${eqName} you were waiting for is now available. You have 5 minutes to claim it.`,
        data: {
          type: 'equipment_available',
          equipmentId,
          waitlistEntryId: firstInLine.id,
          expiresAt: Date.now() + 5 * 60 * 1000
        },
        sound: true,
        categoryIdentifier: 'equipment_available'
      },
      trigger: null, // Send immediately
    });
    
    console.log(`Notified user ${waitlistData.userName} that equipment ${equipmentId} is available`);
    
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

    // Mark as claimed (keep for analytics, will be cleaned up later)
    await updateDoc(doc(db, WAITLIST_COLLECTION, entry.id), {
      status: 'claimed',
      claimedAt: Timestamp.now()
    });

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
    // First check if there's an active usage
    const usageQuery = query(
      collection(db, `${EQUIPMENT_COLLECTION}/${equipmentId}/usage`),
      where('endTime', '==', null),
      limit(1)
    );
    
    const usageSnapshot = await getDocs(usageQuery);
    
    // If there's active usage, calculate from current usage pattern
    if (!usageSnapshot.empty) {
      const activeUsage = usageSnapshot.docs[0].data();
      const startTime = activeUsage.startTime;
      
      // Get average usage duration for this equipment
      const avgDuration = await getAverageUsageDuration(equipmentId);
      
      if (avgDuration) {
        // Calculate how long it's been used so far
        const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
        
        // Estimate remaining time
        const estimatedRemaining = Math.max(1, Math.round(avgDuration - elapsedMinutes));
        
        // Get waitlist position to determine total wait
        const waitlist = await getEquipmentWaitlist(equipmentId);
        const waitlistPosition = waitlist.length;
        
        // Add estimated time for each person ahead in line
        return estimatedRemaining + (waitlistPosition * avgDuration);
      }
    }
    
    // Fallback to historical wait time calculation
    const q = query(
      collection(db, WAITLIST_COLLECTION),
      where('equipmentId', '==', equipmentId),
      where('status', '==', 'claimed')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 15; // Default estimate if no historical data
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter by date in memory and sort by joinedAt descending
    const recentDocs = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.joinedAt && data.joinedAt.toDate() >= thirtyDaysAgo;
      })
      .sort((a, b) => b.data().joinedAt.toDate().getTime() - a.data().joinedAt.toDate().getTime())
      .slice(0, 50); // Take most recent 50

    // Calculate average wait time in minutes
    let totalWaitTime = 0;
    let validEntries = 0;
    
    recentDocs.forEach(doc => {
      const data = doc.data();
      if (data.joinedAt && data.claimedAt) {
        const waitTimeMs = data.claimedAt.toDate().getTime() - data.joinedAt.toDate().getTime();
        const waitTimeMinutes = waitTimeMs / (1000 * 60);
        totalWaitTime += waitTimeMinutes;
        validEntries++;
      }
    });
    
    if (validEntries === 0) {
      return 15; // Default estimate if no valid entries
    }
    
    const averageWaitTime = totalWaitTime / validEntries;
    return Math.round(averageWaitTime);
  } catch (error) {
    console.error('Error calculating estimated wait time:', error);
    return 15; // Default estimate on error
  }
}

/**
 * Get average usage duration for equipment
 */
async function getAverageUsageDuration(equipmentId: string): Promise<number | null> {
  try {
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    
    const usageQuery = query(
      collection(db, `${EQUIPMENT_COLLECTION}/${equipmentId}/usage`),
      where('endTime', '!=', null),
      where('startTime', '>=', twoWeeksAgo),
      limit(50)
    );
    
    const usageSnapshot = await getDocs(usageQuery);
    
    if (usageSnapshot.empty) {
      return null;
    }
    
    let totalDuration = 0;
    let count = 0;
    
    usageSnapshot.docs.forEach(doc => {
      const usage = doc.data();
      if (usage.durationMinutes) {
        totalDuration += usage.durationMinutes;
        count++;
      } else if (usage.startTime && usage.endTime) {
        const duration = (usage.endTime - usage.startTime) / (1000 * 60);
        totalDuration += duration;
        count++;
      }
    });
    
    if (count === 0) {
      return null;
    }
    
    return Math.round(totalDuration / count);
  } catch (error) {
    console.error('Error calculating average usage duration:', error);
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
/**
 * Mark equipment as available and notify next person in waitlist
 */
export async function markEquipmentAvailable(equipmentId: string, equipmentName: string): Promise<void> {
  try {
    // Update equipment status
    const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
    await updateDoc(equipmentRef, {
      status: 'available',
      updatedAt: Date.now()
    });
    
    // Notify next person in waitlist
    await notifyNextInWaitlist(equipmentId, equipmentName);
  } catch (error) {
    console.error('Error marking equipment as available:', error);
  }
}

/**
 * Claim equipment from waitlist
 */
export async function claimWaitlistedEquipment(
  equipmentId: string,
  waitlistEntryId: string,
  userId: string
): Promise<boolean> {
  try {
    // Get waitlist entry and verify it's for this user and not expired
    const entryRef = doc(db, WAITLIST_COLLECTION, waitlistEntryId);
    const entrySnap = await getDoc(entryRef);
    
    if (!entrySnap.exists()) {
      return false;
    }
    
    const entryData = entrySnap.data() as WaitlistEntry;
    
    // Check if entry is valid for claiming
    if (entryData.userId !== userId || 
        entryData.status !== 'notified' ||
        (entryData.expiresAt && entryData.expiresAt.toDate() < new Date())) {
      return false;
    }
    
    // Mark as claimed
    await updateDoc(entryRef, {
      status: 'claimed',
      claimedAt: Timestamp.now()
    });
    
    // Update equipment status to in_use
    const equipmentRef = doc(db, EQUIPMENT_COLLECTION, equipmentId);
    await updateDoc(equipmentRef, {
      status: 'in_use',
      updatedAt: Date.now()
    });
    
    // Log equipment usage start
    await logEquipmentUsageStart(equipmentId, userId);
    
    return true;
  } catch (error) {
    console.error('Error claiming waitlisted equipment:', error);
    return false;
  }
}

export async function cleanupExpiredWaitlistEntries(): Promise<void> {
  try {
    const now = Timestamp.now();
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    // Find expired notified entries
    const expiredQuery = query(
      collection(db, WAITLIST_COLLECTION),
      where('status', '==', 'notified'),
      where('expiresAt', '<', now)
    );
    
    // Find old claimed entries (older than 30 days)
    const oldClaimedQuery = query(
      collection(db, WAITLIST_COLLECTION),
      where('status', '==', 'claimed'),
      where('claimedAt', '<', thirtyDaysAgo)
    );
    
    const [expiredSnapshot, oldClaimedSnapshot] = await Promise.all([
      getDocs(expiredQuery),
      getDocs(oldClaimedQuery)
    ]);
    
    const allDocsToDelete = [...expiredSnapshot.docs, ...oldClaimedSnapshot.docs];
    
    if (allDocsToDelete.length === 0) {
      return;
    }
    
    // Mark expired entries as expired first
    const expiredUpdates = expiredSnapshot.docs.map(doc => 
      updateDoc(doc.ref, { status: 'expired' })
    );
    
    await Promise.all(expiredUpdates);
    
    // Remove all entries after a delay to preserve any last-minute analytics
    setTimeout(async () => {
      try {
        const deletions = allDocsToDelete.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletions);
        
        // Update equipment waitlist counts for expired entries only
        const equipmentUpdates = new Map<string, number>();
        expiredSnapshot.docs.forEach(doc => {
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
        console.error('Error cleaning up entries:', error);
      }
    }, 2000);
    
    console.log(`Cleaned up ${expiredSnapshot.size} expired and ${oldClaimedSnapshot.size} old claimed waitlist entries`);
  } catch (error) {
    console.error('Error cleaning up expired waitlist entries:', error);
  }
}
