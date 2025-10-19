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
}

export interface UserSession {
  id: string;
  startTime: number; // ms since epoch
  endTime: number | null; // null when active
  durationMinutes?: number; // set on end
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
