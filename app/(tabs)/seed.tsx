import { ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from 'react-native';
import { upsertUser } from '@/services/users';
import { upsertProvider } from '@/services/providers';
import { createAppointment } from '@/services/appointments';
import { upsertEquipment } from '@/services/equipment';
import type { Appointment, Equipment, ProviderProfile, UserProfile } from '@/services/types';

function nowPlus(hours: number) {
  return Date.now() + hours * 60 * 60 * 1000;
}

export default function SeedScreen() {
  const handleSeed = async () => {
    try {
      console.log('Starting seed...');
      
      const users: UserProfile[] = [
        { id: 'u_alex', name: 'Alex Patient', email: 'alex@example.com', role: 'patient', createdAt: Date.now() },
        { id: 'u_jamie', name: 'Jamie Patient', email: 'jamie@example.com', role: 'patient', createdAt: Date.now() },
      ];
      const providers: ProviderProfile[] = [
        { id: 'p_sam', name: 'Sam Therapist', specialty: 'Therapy', bio: 'Licensed therapist', rating: 4.8, createdAt: Date.now() },
        { id: 'p_taylor', name: 'Taylor Nutritionist', specialty: 'Nutrition', bio: 'Registered dietitian', rating: 4.6, createdAt: Date.now() },
      ];

      const appts: Appointment[] = [
        {
          id: 'a1',
          patientId: 'u_alex',
          providerId: 'p_sam',
          startTime: nowPlus(4),
          endTime: nowPlus(5),
          status: 'scheduled',
          notes: 'Initial consultation',
          createdAt: Date.now(),
        },
        {
          id: 'a2',
          patientId: 'u_jamie',
          providerId: 'p_taylor',
          startTime: nowPlus(6),
          endTime: nowPlus(7),
          status: 'scheduled',
          notes: 'Meal planning',
          createdAt: Date.now(),
        },
      ];

      const equipment: Equipment[] = [
        { id: 'eq1', name: 'Treadmill A', type: 'cardio', status: 'available', description: 'High-speed treadmill with incline', location: 'Room 101', createdAt: Date.now() },
        { id: 'eq2', name: 'Dumbbell Set', type: 'strength', status: 'in_use', description: '5lb - 50lb dumbbells', location: 'Room 102', createdAt: Date.now() },
        { id: 'eq3', name: 'Yoga Mat', type: 'yoga', status: 'available', description: 'Non-slip yoga mat', location: 'Studio A', createdAt: Date.now() },
        { id: 'eq4', name: 'Meditation Cushion', type: 'meditation', status: 'available', description: 'Comfortable meditation cushion', location: 'Meditation Room', createdAt: Date.now() },
        { id: 'eq5', name: 'Stationary Bike', type: 'cardio', status: 'in_use', description: 'Stationary exercise bike', location: 'Room 101', createdAt: Date.now() },
        { id: 'eq6', name: 'Barbell', type: 'strength', status: 'available', description: '50lb Olympic barbell', location: 'Room 102', createdAt: Date.now() },
      ];

      console.log('Seeding users...');
      await Promise.all(users.map(upsertUser));
      console.log('Seeding providers...');
      await Promise.all(providers.map(upsertProvider));
      console.log('Seeding appointments...');
      for (const a of appts) {
        await createAppointment(a);
      }
      console.log('Seeding equipment...');
      await Promise.all(equipment.map(upsertEquipment));
      console.log('Seed complete!');
      alert('✅ Seeded demo users, providers, appointments, and equipment');
    } catch (error) {
      console.error('Seed error:', error);
      alert('❌ Error seeding data: ' + (error as Error).message);
    }
  };

  return (
    <ScrollView>
      <ThemedView style={{ padding: 16, gap: 12 }}>
        <ThemedText type="title">Seed Demo Data</ThemedText>
        <ThemedText>
          This will create demo patients, providers, appointments, and equipment in your Firestore.
        </ThemedText>
        <Button title="Seed Firestore" onPress={handleSeed} />
      </ThemedView>
    </ScrollView>
  );
}
