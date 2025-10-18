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

export type EquipmentStatus = 'available' | 'in_use';

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: EquipmentStatus;
  description?: string;
  location?: string;
  createdAt: number;
  updatedAt?: number;
}
