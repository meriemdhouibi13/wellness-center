// Supported app roles. Keep legacy values for forward-compat, add 'member' for this app.
export type UserRole = 'member' | 'admin' | 'patient' | 'provider';

export interface UserProfile {
  id: string; // uid or custom id
  name: string;
  email: string;
  role: UserRole;
  createdAt: number; // Date.now()
}

export interface ProviderProfile {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
  rating?: number; // 0-5
  createdAt: number;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'canceled';

export interface Appointment {
  id: string;
  patientId: string; // UserProfile.id
  providerId: string; // ProviderProfile.id
  startTime: number; // ms since epoch
  endTime: number; // ms since epoch
  notes?: string;
  status: AppointmentStatus;
  createdAt: number;
}

export type EquipmentStatus = 'available' | 'in_use' | 'broken';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: EquipmentStatus;
  description?: string;
  location?: string;
  hasMalfunction?: boolean;
  createdAt: number;
  updatedAt?: number;
  waitlistCount?: number;
  waitlistEnabled?: boolean;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number; // ms since epoch
  endTime: number | null; // null when active
  durationMinutes?: number; // set on end
  equipmentId?: string;
  equipmentName?: string;
  createdAt: number;
}

export interface EquipmentUsage {
  id: string;
  equipmentId: string;
  userId?: string | null;
  startTime: number; // ms since epoch
  endTime: number | null; // null when active
  durationMinutes?: number; // set when ended
  createdAt: number;
}

// Friends feature types
export interface Friend {
  id: string;
  name: string;
  email: string;
  totalSessions?: number;
  currentStreak?: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  sentAt: any; // Firestore Timestamp
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  type: 'workout_completed' | 'achievement_earned' | 'streak_milestone';
  description: string;
  sessionId?: string;
  duration?: number;
  equipmentType?: string;
  achievementName?: string;
  streakDays?: number;
  createdAt: any; // Firestore Timestamp
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalSessions: number;
  totalMinutes: number;
  rank: number;
}

// Workout Template types
export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  equipment?: string;
  duration?: number; // in minutes (for cardio/timed exercises)
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  exercises: WorkoutExercise[];
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  createdAt: any; // Firestore Timestamp
  isPublic: boolean;
  likes: number;
  usageCount: number;
}

// Progress Sharing types
export interface ProgressUpdate {
  id: string;
  userId: string;
  userName: string;
  type: 'before_after' | 'milestone' | 'achievement' | 'weight' | 'measurement';
  title: string;
  description: string;
  mediaUrls?: string[]; // URLs to photos/videos
  metrics?: {
    [key: string]: number | string; // For weights, measurements, etc.
  };
  createdAt: any; // Firestore Timestamp
  isPublic: boolean;
  likes: string[]; // Array of userIds who liked
  comments: ProgressComment[];
}

export interface ProgressComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any; // Firestore Timestamp
}

// Waitlist feature types
export type WaitlistStatus = 'waiting' | 'notified' | 'claimed' | 'expired';

export interface WaitlistEntry {
  id: string;
  equipmentId: string;
  userId: string;
  userName: string;
  joinedAt: any; // Firestore Timestamp
  position: number;
  status: WaitlistStatus;
  notified: boolean;
  notifiedAt: any | null; // Firestore Timestamp
  claimedAt: any | null; // Firestore Timestamp
  expiresAt: any | null; // Firestore Timestamp
}

// Classes feature types
export type ClassCategory = 'yoga' | 'cardio' | 'strength' | 'hiit' | 'pilates' | 'dance' | 'meditation' | 'cycling' | 'other';

export type ClassStatus = 'scheduled' | 'active' | 'completed' | 'canceled';

export type ClassLevel = 'beginner' | 'intermediate' | 'advanced' | 'all-levels';

export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'canceled';

export interface FitnessClass {
  id: string;
  title: string;
  description: string;
  category: ClassCategory;
  level: ClassLevel;
  instructorId: string;
  instructorName: string;
  location: string;
  roomNumber?: string;
  startTime: any; // Firestore Timestamp
  endTime: any; // Firestore Timestamp
  duration: number; // in minutes
  capacity: number;
  currentRegistrations: number;
  waitlistEnabled: boolean;
  waitlistCapacity: number;
  status: ClassStatus;
  imageUrl?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface ClassRegistration {
  id: string;
  classId: string;
  userId: string;
  userName: string;
  registrationTime: any; // Firestore Timestamp
  status: RegistrationStatus;
  position?: number; // For waitlist
  checkedIn: boolean;
  checkinTime?: any; // Firestore Timestamp
  notificationSent: boolean;
  reminderSent: boolean;
}
