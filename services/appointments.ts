import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Appointment } from './types';

const APPOINTMENTS = 'appointments';

export async function createAppointment(appt: Appointment): Promise<string> {
  // If an id provided, setDoc; else addDoc to auto-id
  if (appt.id) {
    await setDoc(doc(db, APPOINTMENTS, appt.id), appt);
    return appt.id;
  }
  const { id } = await addDoc(collection(db, APPOINTMENTS), appt);
  return id;
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const snap = await getDoc(doc(db, APPOINTMENTS, id));
  return snap.exists() ? (snap.data() as Appointment) : null;
}

export async function listAppointmentsForPatient(patientId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, APPOINTMENTS),
    where('patientId', '==', patientId),
    orderBy('startTime', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Appointment);
}

export async function listAppointmentsForProvider(providerId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, APPOINTMENTS),
    where('providerId', '==', providerId),
    orderBy('startTime', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Appointment);
}
