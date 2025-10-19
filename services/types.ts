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
  waitlistCount?: number; // number of people waiting
  waitlistEnabled?: boolean; // can people join waitlist (default: true)
  createdAt: number;
  updatedAt?: number;
}

export interface UserSession {
  id: string;
  equipmentId?: string; // which equipment was used
  equipmentName?: string; // name of equipment
  startTime: number; // ms since epoch
  endTime: number | null; // null when active
  durationMinutes?: number; // set on end
  createdAt: number;
}

export type WaitlistStatus = 'waiting' | 'notified' | 'claimed' | 'expired';

export interface WaitlistEntry {
  id: string;
  equipmentId: string;
  userId: string;
  userName: string;
  joinedAt: number; // ms since epoch
  position: number; // position in line (1-based)
  notified: boolean; // has user been notified?
  expiresAt?: number; // notification expires if not claimed (ms since epoch)
  status: WaitlistStatus;
}
