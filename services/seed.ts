// services/seed.ts
import createSampleClasses from '@/scripts/seed-classes';

/**
 * Seed classes for demo purposes
 */
export async function seedClasses(): Promise<number> {
  try {
    await createSampleClasses();
    return 15; // The number of classes we're creating in the sample
  } catch (error) {
    console.error('Error seeding classes:', error);
    throw error;
  }
}

/**
 * Clear demo data
 */
export async function clearDemoData(): Promise<void> {
  // This would typically connect to Firestore and delete sample data
  // For now this is a placeholder
  console.log('Clearing demo data...');
  throw new Error('Not implemented yet');
}