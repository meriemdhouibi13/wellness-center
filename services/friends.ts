// services/friends.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  onSnapshot,
  increment as firestoreInc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { 
  Friend, 
  FriendRequest, 
  Activity, 
  LeaderboardEntry, 
  WorkoutTemplate,
  ProgressUpdate,
  ProgressComment 
} from './types';

/**
 * Search for a user by email address
 */
export async function searchUserByEmail(email: string): Promise<{ id: string; name: string; email: string } | null> {
  if (!db) throw new Error('Firestore not initialized');
  
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email.toLowerCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const userData = snapshot.docs[0].data();
  return {
    id: snapshot.docs[0].id,
    name: userData.name || 'Unknown',
    email: userData.email,
  };
}

/**
 * Send a friend request to another user
 */
export async function sendFriendRequest(
  fromUserId: string,
  fromUserName: string,
  fromUserEmail: string,
  toEmail: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  // First, find the target user
  const targetUser = await searchUserByEmail(toEmail);
  if (!targetUser) {
    throw new Error('User not found with that email');
  }
  
  if (targetUser.id === fromUserId) {
    throw new Error('Cannot send friend request to yourself');
  }
  
  // Check if they're already friends
  const friendsRef = collection(db, `users/${fromUserId}/Friends`);
  const friendDoc = await getDoc(doc(friendsRef, targetUser.id));
  if (friendDoc.exists()) {
    throw new Error('Already friends with this user');
  }
  
  // Check if request already exists in their incoming requests
  const incomingRequestsRef = collection(db, `users/${targetUser.id}/FriendRequestsIncoming`);
  const existingDoc = await getDoc(doc(incomingRequestsRef, fromUserId));
  
  if (existingDoc.exists()) {
    throw new Error('Friend request already sent');
  }
  
  // Create friend request in target user's incoming requests
  await setDoc(doc(db, `users/${targetUser.id}/FriendRequestsIncoming`, fromUserId), {
    fromUserId,
    fromUserName,
    fromUserEmail,
    sentAt: Timestamp.now(),
  });
}

/**
 * Get all pending friend requests for the current user
 */
export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const requestsRef = collection(db, `users/${userId}/FriendRequestsIncoming`);
  const snapshot = await getDocs(requestsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    fromUserId: doc.id, // Document ID is the sender's user ID
    ...doc.data(),
  })) as FriendRequest[];
}

/**
 * Get all sent friend requests (that are still pending)
 */
export async function getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  // To get sent requests, we need to check all users' incoming requests for this userId
  // For now, return empty array - this is expensive to query
  // Alternative: maintain a separate SentRequests collection under each user
  return [];
}

/**
 * Accept or reject a friend request
 */
export async function respondToFriendRequest(
  fromUserId: string,
  accept: boolean,
  currentUserId: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  // Get the friend request from incoming requests
  const requestRef = doc(db, `users/${currentUserId}/FriendRequestsIncoming`, fromUserId);
  const requestSnap = await getDoc(requestRef);
  
  if (!requestSnap.exists()) {
    throw new Error('Friend request not found');
  }
  
  const requestData = requestSnap.data();
  
  if (accept) {
    // Get both users' info
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const toUserDoc = await getDoc(doc(db, 'users', currentUserId));
    
    if (!fromUserDoc.exists() || !toUserDoc.exists()) {
      throw new Error('User not found');
    }
    
    const fromUserData = fromUserDoc.data();
    const toUserData = toUserDoc.data();
    
    // Add to both users' Friends collections
    await Promise.all([
      // Add to sender's Friends
      setDoc(doc(db, `users/${fromUserId}/Friends`, currentUserId), {
        friendId: currentUserId,
        friendName: toUserData.name,
        friendEmail: toUserData.email,
        addedAt: Timestamp.now(),
      }),
      // Add to receiver's Friends
      setDoc(doc(db, `users/${currentUserId}/Friends`, fromUserId), {
        friendId: fromUserId,
        friendName: fromUserData.name,
        friendEmail: fromUserData.email,
        addedAt: Timestamp.now(),
      }),
      // Delete the friend request
      deleteDoc(requestRef),
    ]);
  } else {
    // Just delete the request (deny)
    await deleteDoc(requestRef);
    
    // Optionally: Create a notification for the sender that their request was denied
    // For now, we'll skip this
  }
}

/**
 * Get the current user's friends list
 */
export async function getFriends(userId: string): Promise<Friend[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const friendsRef = collection(db, `users/${userId}/Friends`);
  const snapshot = await getDocs(friendsRef);
  
  const friends: Friend[] = [];
  
  for (const friendDoc of snapshot.docs) {
    const friendData = friendDoc.data();
    
    // Get additional stats from user's sessions
    const sessionsRef = collection(db, `users/${friendDoc.id}/sessions`);
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    friends.push({
      id: friendDoc.id,
      name: friendData.friendName,
      email: friendData.friendEmail,
      totalSessions: sessionsSnapshot.size,
    });
  }
  
  return friends;
}

/**
 * Remove a friend
 */
export async function removeFriend(userId: string, friendId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  // Remove from both users' Friends collections
  await Promise.all([
    deleteDoc(doc(db, `users/${userId}/Friends`, friendId)),
    deleteDoc(doc(db, `users/${friendId}/Friends`, userId)),
  ]);
}

/**
 * Post an activity to the feed
 */
export async function postActivity(
  userId: string,
  userName: string,
  type: 'workout_completed' | 'achievement_earned' | 'streak_milestone',
  description: string,
  metadata?: {
    sessionId?: string;
    duration?: number;
    equipmentType?: string;
    achievementName?: string;
    streakDays?: number;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const activitiesRef = collection(db, 'activities');
  await addDoc(activitiesRef, {
    userId,
    userName,
    type,
    description,
    ...metadata,
    createdAt: Timestamp.now(),
  });
}

/**
 * Get recent activities from friends
 */
export async function getFriendsActivities(userId: string, limitCount: number = 20): Promise<Activity[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  // Get user's friends
  const friends = await getFriends(userId);
  const friendIds = friends.map(f => f.id);
  
  if (friendIds.length === 0) {
    return [];
  }
  
  // Get all recent activities (without where clause to avoid index requirement)
  const activitiesRef = collection(db, 'activities');
  const q = query(
    activitiesRef,
    orderBy('createdAt', 'desc'),
    firestoreLimit(100) // Get more to filter client-side
  );
  
  const snapshot = await getDocs(q);
  
  // Filter to only friend activities client-side
  const friendActivities = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }) as Activity)
    .filter(activity => friendIds.includes(activity.userId))
    .slice(0, limitCount);
  
  return friendActivities;
}

/**
 * Listen to real-time updates for friends' activities
 */
export function listenToFriendsActivities(
  userId: string,
  callback: (activities: Activity[]) => void
): () => void {
  if (!db) throw new Error('Firestore not initialized');
  
  // This is a simplified version - in production you'd want to handle the friends list dynamically
  const activitiesRef = collection(db, 'activities');
  const q = query(
    activitiesRef,
    orderBy('createdAt', 'desc'),
    firestoreLimit(20)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const activities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Activity[];
    callback(activities);
  });
  
  return unsubscribe;
}

/**
 * Get weekly leaderboard (current week)
 */
export async function getWeeklyLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  // Get user's friends
  const friends = await getFriends(userId);
  const userIds = [userId, ...friends.map(f => f.id)];
  
  // Get start of current week (Sunday)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekMs = startOfWeek.getTime();
  
  const leaderboard: LeaderboardEntry[] = [];
  
  // Get sessions for each user this week
  for (const uid of userIds) {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    const userName = userDoc.exists() ? userDoc.data().name : 'Unknown';
    
    const sessionsRef = collection(db, `users/${uid}/sessions`);
    // Get all sessions and filter client-side to avoid index requirement
    const sessionsSnapshot = await getDocs(sessionsRef);
    
    // Filter to this week only
    const thisWeekSessions = sessionsSnapshot.docs.filter(doc => {
      const sessionData = doc.data();
      const createdAt = sessionData.createdAt || 0;
      return createdAt >= startOfWeekMs;
    });
    
    const totalMinutes = thisWeekSessions.reduce((sum, doc) => {
      return sum + (doc.data().durationMinutes || doc.data().duration || 0);
    }, 0);
    
    leaderboard.push({
      userId: uid,
      userName,
      totalSessions: thisWeekSessions.length,
      totalMinutes,
      rank: 0, // Will be set after sorting
    });
  }
  
  // Sort by total sessions (primary) and total minutes (secondary)
  leaderboard.sort((a, b) => {
    if (b.totalSessions !== a.totalSessions) {
      return b.totalSessions - a.totalSessions;
    }
    return b.totalMinutes - a.totalMinutes;
  });
  
  // Assign ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return leaderboard;
}

/**
 * Workout Template Functions
 */

/**
 * Create a new workout template
 */
export async function createWorkoutTemplate(
  userId: string,
  userName: string,
  templateData: Omit<WorkoutTemplate, 'id' | 'userId' | 'userName' | 'createdAt' | 'likes' | 'usageCount'>
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  
  const templatesRef = collection(db, 'workoutTemplates');
  
  const newTemplate: Omit<WorkoutTemplate, 'id'> = {
    ...templateData,
    userId,
    userName,
    createdAt: Timestamp.now(),
    likes: 0,
    usageCount: 0
  };
  
  const docRef = await addDoc(templatesRef, newTemplate);
  return docRef.id;
}

/**
 * Get workout templates created by a specific user
 */
export async function getUserWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const templatesRef = collection(db, 'workoutTemplates');
  const q = query(
    templatesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as WorkoutTemplate[];
}

/**
 * Get workout templates shared by friends
 */
export async function getFriendsWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  // First, get the user's friends
  const friendsIds = await getFriendIds(userId);
  
  if (friendsIds.length === 0) {
    return [];
  }
  
  // Get templates from friends that are public
  const templatesRef = collection(db, 'workoutTemplates');
  const q = query(
    templatesRef,
    where('userId', 'in', friendsIds),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as WorkoutTemplate[];
}

/**
 * Get a single workout template by ID
 */
export async function getWorkoutTemplate(templateId: string): Promise<WorkoutTemplate | null> {
  if (!db) throw new Error('Firestore not initialized');
  
  const templateRef = doc(db, 'workoutTemplates', templateId);
  const templateDoc = await getDoc(templateRef);
  
  if (!templateDoc.exists()) {
    return null;
  }
  
  return {
    id: templateDoc.id,
    ...templateDoc.data()
  } as WorkoutTemplate;
}

/**
 * Update an existing workout template
 */
export async function updateWorkoutTemplate(
  templateId: string,
  userId: string,
  updates: Partial<Omit<WorkoutTemplate, 'id' | 'userId' | 'createdAt' | 'likes' | 'usageCount'>>
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  // Verify the user owns this template
  const templateRef = doc(db, 'workoutTemplates', templateId);
  const templateDoc = await getDoc(templateRef);
  
  if (!templateDoc.exists()) {
    throw new Error('Template not found');
  }
  
  if (templateDoc.data().userId !== userId) {
    throw new Error('You can only update your own templates');
  }
  
  await updateDoc(templateRef, updates);
}

/**
 * Delete a workout template
 */
export async function deleteWorkoutTemplate(templateId: string, userId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  // Verify the user owns this template
  const templateRef = doc(db, 'workoutTemplates', templateId);
  const templateDoc = await getDoc(templateRef);
  
  if (!templateDoc.exists()) {
    throw new Error('Template not found');
  }
  
  if (templateDoc.data().userId !== userId) {
    throw new Error('You can only delete your own templates');
  }
  
  await deleteDoc(templateRef);
}

/**
 * Like a workout template
 */
export async function likeWorkoutTemplate(templateId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const templateRef = doc(db, 'workoutTemplates', templateId);
  await updateDoc(templateRef, {
    likes: firestoreInc(1)
  });
}

/**
 * Track usage of a workout template
 */
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const templateRef = doc(db, 'workoutTemplates', templateId);
  await updateDoc(templateRef, {
    usageCount: firestoreInc(1)
  });
}

// Helper function to get just the friend IDs
async function getFriendIds(userId: string): Promise<string[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const friendsRef = collection(db, `users/${userId}/Friends`);
  const snapshot = await getDocs(friendsRef);
  
  return snapshot.docs.map(doc => doc.id);
}

/**
 * Progress Sharing Functions
 */

/**
 * Create a new progress update
 */
export async function createProgressUpdate(
  userId: string,
  userName: string,
  updateData: Omit<ProgressUpdate, 'id' | 'userId' | 'userName' | 'createdAt' | 'likes' | 'comments'>
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  
  const progressRef = collection(db, 'progressUpdates');
  
  const newProgressUpdate: Omit<ProgressUpdate, 'id'> = {
    ...updateData,
    userId,
    userName,
    createdAt: Timestamp.now(),
    likes: [],
    comments: []
  };
  
  const docRef = await addDoc(progressRef, newProgressUpdate);
  
  // Add to activity feed
  await addToActivityFeed(userId, userName, 'achievement', updateData.title, undefined, undefined, updateData.type);
  
  return docRef.id;
}

/**
 * Get progress updates by a specific user
 */
export async function getUserProgressUpdates(userId: string): Promise<ProgressUpdate[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  const progressRef = collection(db, 'progressUpdates');
  const q = query(
    progressRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ProgressUpdate[];
}

/**
 * Get progress updates from friends
 */
export async function getFriendsProgressUpdates(userId: string, limit: number = 10): Promise<ProgressUpdate[]> {
  if (!db) throw new Error('Firestore not initialized');
  
  // First, get the user's friends
  const friendsIds = await getFriendIds(userId);
  
  if (friendsIds.length === 0) {
    return [];
  }
  
  // Get progress updates from friends that are public
  const progressRef = collection(db, 'progressUpdates');
  const q = query(
    progressRef,
    where('userId', 'in', friendsIds),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limit)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as ProgressUpdate[];
}

/**
 * Get a single progress update by ID
 */
export async function getProgressUpdate(updateId: string): Promise<ProgressUpdate | null> {
  if (!db) throw new Error('Firestore not initialized');
  
  const updateRef = doc(db, 'progressUpdates', updateId);
  const updateDoc = await getDoc(updateRef);
  
  if (!updateDoc.exists()) {
    return null;
  }
  
  return {
    id: updateDoc.id,
    ...updateDoc.data()
  } as ProgressUpdate;
}

/**
 * Like or unlike a progress update
 */
export async function toggleLikeProgressUpdate(updateId: string, userId: string): Promise<boolean> {
  if (!db) throw new Error('Firestore not initialized');
  
  const updateRef = doc(db, 'progressUpdates', updateId);
  const updateDoc = await getDoc(updateRef);
  
  if (!updateDoc.exists()) {
    throw new Error('Progress update not found');
  }
  
  const updateData = updateDoc.data() as ProgressUpdate;
  const hasLiked = updateData.likes.includes(userId);
  
  await updateDoc(updateRef, {
    likes: hasLiked 
      ? arrayRemove(userId) 
      : arrayUnion(userId)
  });
  
  return !hasLiked; // Return true if now liked, false if now unliked
}

/**
 * Add a comment to a progress update
 */
export async function addCommentToProgressUpdate(
  updateId: string,
  userId: string,
  userName: string,
  content: string
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  
  const updateRef = doc(db, 'progressUpdates', updateId);
  const updateDoc = await getDoc(updateRef);
  
  if (!updateDoc.exists()) {
    throw new Error('Progress update not found');
  }
  
  const commentId = `comment_${Date.now()}`;
  const newComment: ProgressComment = {
    id: commentId,
    userId,
    userName,
    content,
    createdAt: Timestamp.now()
  };
  
  await updateDoc(updateRef, {
    comments: arrayUnion(newComment)
  });
  
  return commentId;
}

/**
 * Delete a comment from a progress update
 */
export async function deleteCommentFromProgressUpdate(
  updateId: string,
  commentId: string,
  userId: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  
  const updateRef = doc(db, 'progressUpdates', updateId);
  const updateDoc = await getDoc(updateRef);
  
  if (!updateDoc.exists()) {
    throw new Error('Progress update not found');
  }
  
  const updateData = updateDoc.data() as ProgressUpdate;
  const commentToDelete = updateData.comments.find(comment => comment.id === commentId);
  
  if (!commentToDelete) {
    throw new Error('Comment not found');
  }
  
  // Ensure the user is the comment author
  if (commentToDelete.userId !== userId) {
    throw new Error('You can only delete your own comments');
  }
  
  await updateDoc(updateRef, {
    comments: arrayRemove(commentToDelete)
  });
}
