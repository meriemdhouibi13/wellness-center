// services/classes.ts
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { ClassRegistration, FitnessClass, RegistrationStatus } from './types';
import { sendLocalNotification } from './notifications';

const CLASSES_COLLECTION = 'classes';
const REGISTRATIONS_COLLECTION = 'class-registrations';

/**
 * Get all upcoming classes
 */
export async function getUpcomingClasses(): Promise<FitnessClass[]> {
  try {
    const now = Timestamp.now();
    
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where('startTime', '>', now),
      where('status', '==', 'scheduled'),
      orderBy('startTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FitnessClass));
  } catch (error) {
    console.error('Error fetching upcoming classes:', error);
    return [];
  }
}

/**
 * Get classes filtered by category
 */
export async function getClassesByCategory(category: string): Promise<FitnessClass[]> {
  try {
    const now = Timestamp.now();
    
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where('startTime', '>', now),
      where('category', '==', category),
      where('status', '==', 'scheduled'),
      orderBy('startTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FitnessClass));
  } catch (error) {
    console.error(`Error fetching ${category} classes:`, error);
    return [];
  }
}

/**
 * Get classes for a specific date
 */
export async function getClassesByDate(date: Date): Promise<FitnessClass[]> {
  try {
    // Start of the selected day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    // End of the selected day
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where('startTime', '>=', Timestamp.fromDate(startOfDay)),
      where('startTime', '<=', Timestamp.fromDate(endOfDay)),
      where('status', '==', 'scheduled'),
      orderBy('startTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FitnessClass));
  } catch (error) {
    console.error('Error fetching classes by date:', error);
    return [];
  }
}

/**
 * Get class by ID
 */
export async function getClassById(classId: string): Promise<FitnessClass | null> {
  try {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as FitnessClass;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching class:', error);
    return null;
  }
}

/**
 * Register for a class
 */
export async function registerForClass(
  classId: string, 
  userId: string,
  userName: string
): Promise<ClassRegistration> {
  try {
    // Get current class data
    const fitnessClass = await getClassById(classId);
    
    if (!fitnessClass) {
      throw new Error('Class not found');
    }
    
    if (fitnessClass.status !== 'scheduled') {
      throw new Error('Class is not available for registration');
    }
    
    // Check if user is already registered
    const existingRegistration = await getUserClassRegistration(classId, userId);
    if (existingRegistration && existingRegistration.status !== 'canceled') {
      throw new Error('You are already registered for this class');
    }
    
    // Determine registration status based on capacity
    const status: RegistrationStatus = 
      fitnessClass.currentRegistrations < fitnessClass.capacity 
        ? 'confirmed' 
        : (fitnessClass.waitlistEnabled ? 'waitlisted' : 'canceled');
    
    if (status === 'canceled' && !fitnessClass.waitlistEnabled) {
      throw new Error('Class is full and waitlist is not enabled');
    }
    
    // Get position if waitlisted
    let position = undefined;
    if (status === 'waitlisted') {
      const waitlistedRegistrations = await getWaitlistedRegistrations(classId);
      position = waitlistedRegistrations.length + 1;
    }
    
    // Create registration
    const registrationData = {
      classId,
      userId,
      userName,
      registrationTime: Timestamp.now(),
      status,
      position,
      checkedIn: false,
      notificationSent: false,
      reminderSent: false
    };
    
    const docRef = await addDoc(collection(db, REGISTRATIONS_COLLECTION), registrationData);
    
    // Update class registration count
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    await updateDoc(classRef, {
      currentRegistrations: increment(status === 'confirmed' ? 1 : 0),
      updatedAt: Timestamp.now()
    });
    
    return {
      id: docRef.id,
      ...registrationData
    };
  } catch (error: any) {
    console.error('Error registering for class:', error);
    throw error;
  }
}

/**
 * Get user's registration for a specific class
 */
export async function getUserClassRegistration(
  classId: string, 
  userId: string
): Promise<ClassRegistration | null> {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('classId', '==', classId),
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
    } as ClassRegistration;
  } catch (error) {
    console.error('Error fetching user registration:', error);
    return null;
  }
}

/**
 * Get all waitlisted registrations for a class
 */
export async function getWaitlistedRegistrations(classId: string): Promise<ClassRegistration[]> {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('classId', '==', classId),
      where('status', '==', 'waitlisted'),
      orderBy('registrationTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClassRegistration));
  } catch (error) {
    console.error('Error fetching waitlisted registrations:', error);
    return [];
  }
}

/**
 * Cancel a class registration
 */
export async function cancelClassRegistration(
  classId: string,
  userId: string
): Promise<void> {
  try {
    // Get user's registration
    const registration = await getUserClassRegistration(classId, userId);
    
    if (!registration) {
      throw new Error('No registration found');
    }
    
    const wasConfirmed = registration.status === 'confirmed';
    
    // Update registration to canceled
    const registrationRef = doc(db, REGISTRATIONS_COLLECTION, registration.id);
    await updateDoc(registrationRef, {
      status: 'canceled',
      updatedAt: Timestamp.now()
    });
    
    // Update class capacity count if was confirmed
    if (wasConfirmed) {
      const classRef = doc(db, CLASSES_COLLECTION, classId);
      await updateDoc(classRef, {
        currentRegistrations: increment(-1),
        updatedAt: Timestamp.now()
      });
      
      // Promote first waitlisted person if exists
      await promoteFromWaitlist(classId);
    }
  } catch (error: any) {
    console.error('Error canceling registration:', error);
    throw error;
  }
}

/**
 * Promote first person from waitlist to confirmed
 */
export async function promoteFromWaitlist(classId: string): Promise<void> {
  try {
    // Get waitlisted registrations
    const waitlisted = await getWaitlistedRegistrations(classId);
    
    if (waitlisted.length === 0) {
      return; // No one on waitlist
    }
    
    // Get first person on waitlist
    const nextRegistration = waitlisted[0];
    
    // Update their status to confirmed
    const registrationRef = doc(db, REGISTRATIONS_COLLECTION, nextRegistration.id);
    await updateDoc(registrationRef, {
      status: 'confirmed',
      position: null,
      updatedAt: Timestamp.now(),
      notificationSent: false
    });
    
    // Update class registration count
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    await updateDoc(classRef, {
      currentRegistrations: increment(1),
      updatedAt: Timestamp.now()
    });
    
    // Send notification
    try {
      await sendLocalNotification(
        'You\'ve been moved from the waitlist!',
        `You are now registered for the class you were waiting for.`,
        { type: 'class_registration', userId: nextRegistration.userId, classId }
      );
      
      // Mark notification as sent
      await updateDoc(registrationRef, {
        notificationSent: true
      });
    } catch (notifError) {
      console.error('Error sending promotion notification:', notifError);
    }
    
    // Reorder remaining waitlist
    await reorderWaitlist(classId, nextRegistration.position || 1);
  } catch (error) {
    console.error('Error promoting from waitlist:', error);
  }
}

/**
 * Reorder waitlist positions
 */
export async function reorderWaitlist(classId: string, fromPosition: number): Promise<void> {
  try {
    // Get waitlisted registrations with position >= fromPosition
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('classId', '==', classId),
      where('status', '==', 'waitlisted'),
      where('position', '>=', fromPosition)
    );
    
    const snapshot = await getDocs(q);
    
    // Update each position
    const updates = snapshot.docs.map(doc => {
      const currentPosition = doc.data().position;
      return updateDoc(doc.ref, {
        position: currentPosition - 1,
        updatedAt: Timestamp.now()
      });
    });
    
    await Promise.all(updates);
  } catch (error) {
    console.error('Error reordering waitlist:', error);
  }
}

/**
 * Get all of a user's upcoming class registrations
 */
export async function getUserUpcomingRegistrations(userId: string): Promise<{
  registration: ClassRegistration;
  fitnessClass: FitnessClass;
}[]> {
  try {
    const now = Timestamp.now();
    
    // Get user's registrations
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('userId', '==', userId),
      where('status', 'in', ['confirmed', 'waitlisted'])
    );
    
    const snapshot = await getDocs(q);
    const registrations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ClassRegistration));
    
    // Fetch class details for each registration
    const results = await Promise.all(
      registrations.map(async (registration) => {
        const fitnessClass = await getClassById(registration.classId);
        return {
          registration,
          fitnessClass: fitnessClass as FitnessClass
        };
      })
    );
    
    // Filter only upcoming classes and sort by start time
    return results
      .filter(item => item.fitnessClass && item.fitnessClass.startTime > now)
      .sort((a, b) => 
        a.fitnessClass.startTime.toDate().getTime() - 
        b.fitnessClass.startTime.toDate().getTime()
      );
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    return [];
  }
}

/**
 * Listen for changes to a specific class
 */
export function subscribeToClass(
  classId: string,
  callback: (fitnessClass: FitnessClass) => void
) {
  const docRef = doc(db, CLASSES_COLLECTION, classId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({
        id: docSnap.id,
        ...docSnap.data()
      } as FitnessClass);
    }
  }, (error) => {
    console.error('Error subscribing to class:', error);
  });
}

/**
 * Listen for changes to a user's registration
 */
export function subscribeToRegistration(
  registrationId: string,
  callback: (registration: ClassRegistration) => void
) {
  const docRef = doc(db, REGISTRATIONS_COLLECTION, registrationId);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({
        id: docSnap.id,
        ...docSnap.data()
      } as ClassRegistration);
    }
  }, (error) => {
    console.error('Error subscribing to registration:', error);
  });
}

/**
 * Check in a user for a class
 */
export async function checkInForClass(
  classId: string,
  userId: string
): Promise<void> {
  try {
    const registration = await getUserClassRegistration(classId, userId);
    
    if (!registration) {
      throw new Error('No registration found');
    }
    
    if (registration.status !== 'confirmed') {
      throw new Error('Only confirmed registrations can check in');
    }
    
    if (registration.checkedIn) {
      throw new Error('Already checked in');
    }
    
    const registrationRef = doc(db, REGISTRATIONS_COLLECTION, registration.id);
    await updateDoc(registrationRef, {
      checkedIn: true,
      checkinTime: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error checking in:', error);
    throw error;
  }
}

/**
 * Send reminders for upcoming classes
 * To be called by a scheduled job
 */
export async function sendClassReminders(): Promise<void> {
  try {
    const now = Timestamp.now();
    const hourFromNow = new Date(now.toMillis() + 60 * 60 * 1000);
    
    // Get classes starting in the next hour
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where('startTime', '>', now),
      where('startTime', '<=', Timestamp.fromDate(hourFromNow)),
      where('status', '==', 'scheduled')
    );
    
    const snapshot = await getDocs(q);
    
    for (const classDoc of snapshot.docs) {
      const fitnessClass = {
        id: classDoc.id,
        ...classDoc.data()
      } as FitnessClass;
      
      // Get confirmed registrations that haven't been sent reminders
      const registrationsQuery = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('classId', '==', fitnessClass.id),
        where('status', '==', 'confirmed'),
        where('reminderSent', '==', false)
      );
      
      const registrations = await getDocs(registrationsQuery);
      
      // Send reminders
      const updates = registrations.docs.map(async (regDoc) => {
        const registration = {
          id: regDoc.id,
          ...regDoc.data()
        } as ClassRegistration;
        
        try {
          await sendLocalNotification(
            'Class Reminder',
            `Your class "${fitnessClass.title}" starts in 1 hour.`,
            { type: 'class_reminder', userId: registration.userId, classId: fitnessClass.id }
          );
          
          // Mark reminder as sent
          return updateDoc(regDoc.ref, {
            reminderSent: true,
            updatedAt: Timestamp.now()
          });
        } catch (notifError) {
          console.error('Error sending class reminder:', notifError);
          return null;
        }
      });
      
      await Promise.all(updates.filter(Boolean));
    }
  } catch (error) {
    console.error('Error sending class reminders:', error);
  }
}

/**
 * Create a new fitness class (admin function)
 */
export async function createClass(classData: Omit<FitnessClass, 'id' | 'createdAt' | 'updatedAt' | 'currentRegistrations'>): Promise<FitnessClass> {
  try {
    const newClass = {
      ...classData,
      currentRegistrations: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'scheduled'
    };
    
    const docRef = await addDoc(collection(db, CLASSES_COLLECTION), newClass);
    
    return {
      id: docRef.id,
      ...newClass
    } as FitnessClass;
  } catch (error: any) {
    console.error('Error creating class:', error);
    throw error;
  }
}

/**
 * Update a fitness class (admin function)
 */
export async function updateClass(
  classId: string, 
  updates: Partial<Omit<FitnessClass, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    
    await updateDoc(classRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Error updating class:', error);
    throw error;
  }
}

/**
 * Cancel a class (admin function)
 */
export async function cancelClass(classId: string): Promise<void> {
  try {
    // Update class status to canceled
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    await updateDoc(classRef, {
      status: 'canceled',
      updatedAt: Timestamp.now()
    });
    
    // Get all registrations
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('classId', '==', classId),
      where('status', 'in', ['confirmed', 'waitlisted'])
    );
    
    const snapshot = await getDocs(q);
    
    // Cancel all registrations and notify users
    const updates = snapshot.docs.map(async (doc) => {
      const registration = {
        id: doc.id,
        ...doc.data()
      } as ClassRegistration;
      
      // Update registration status
      await updateDoc(doc.ref, {
        status: 'canceled',
        updatedAt: Timestamp.now()
      });
      
      // Send notification
      try {
        await sendLocalNotification(
          'Class Canceled',
          `Unfortunately, the class you registered for has been canceled.`,
          { type: 'class_canceled', userId: registration.userId, classId }
        );
      } catch (notifError) {
        console.error('Error sending cancellation notification:', notifError);
      }
    });
    
    await Promise.all(updates);
  } catch (error: any) {
    console.error('Error canceling class:', error);
    throw error;
  }
}