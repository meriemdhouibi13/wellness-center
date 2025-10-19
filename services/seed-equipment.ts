// services/seed-equipment.ts
import { upsertEquipment } from './equipment';
import type { Equipment } from './types';

export async function seedTestEquipment() {
  const equipment: Equipment[] = [
    {
      id: 'test001',
      name: 'Treadmill A',
      type: 'cardio',
      status: 'available',
      location: 'North Wing',
      description: 'High-performance treadmill with incline settings',
      createdAt: Date.now(),
    },
    {
      id: 'test002',
      name: 'Weight Bench B',
      type: 'strength',
      status: 'available',
      location: 'Weight Room',
      description: 'Adjustable weight bench with leg extension',
      createdAt: Date.now(),
    },
    {
      id: 'test003',
      name: 'Yoga Mat C',
      type: 'yoga',
      status: 'in_use',
      location: 'Yoga Studio',
      description: 'Premium non-slip yoga mat',
      createdAt: Date.now(),
    },
  ];

  console.log('Seeding test equipment...');
  try {
    // Create all equipment items
    await Promise.all(equipment.map(item => upsertEquipment(item)));
    console.log('Successfully added test equipment');
    return equipment;
  } catch (error) {
    console.error('Error seeding equipment:', error);
    throw error;
  }
}

// Example QR code data format:
// equipment:test001
// equipment:test002
// equipment:test003