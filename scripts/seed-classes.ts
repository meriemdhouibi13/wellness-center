// scripts/seed-classes.ts
import { createClass } from '@/services/classes';
import { ClassCategory, ClassLevel, FitnessClass } from '@/services/types';
import { Timestamp } from 'firebase/firestore';

// Helper function to create a date with specific time
const createDateTime = (
  year: number, 
  month: number, // 0-11
  day: number, 
  hour: number, 
  minute: number
): Date => {
  return new Date(year, month, day, hour, minute);
};

// Sample instructors
const instructors = [
  { id: 'inst1', name: 'Alex Johnson' },
  { id: 'inst2', name: 'Sarah Miller' },
  { id: 'inst3', name: 'Michael Chen' },
  { id: 'inst4', name: 'Emma Williams' },
  { id: 'inst5', name: 'David Rodriguez' }
];

// Sample classes
const createSampleClasses = async () => {
  // Get current date
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  
  // Create sample classes for the next 7 days
  const classesToCreate: Omit<FitnessClass, 'id' | 'createdAt' | 'updatedAt' | 'currentRegistrations'>[] = [
    // Day 1: Today
    {
      title: 'Morning Yoga Flow',
      description: 'Start your day with an energizing yoga flow that will awaken your body and mind. This class focuses on linking breath with movement through a sequence of postures designed to build strength, improve flexibility, and promote mindfulness. Suitable for all levels with modifications offered.',
      category: 'yoga' as ClassCategory,
      level: 'all-levels' as ClassLevel,
      instructorId: instructors[0].id,
      instructorName: instructors[0].name,
      location: 'Yoga Studio',
      roomNumber: '101',
      startTime: Timestamp.fromDate(createDateTime(year, month, today, 7, 30)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today, 8, 30)),
      duration: 60,
      capacity: 20,
      waitlistEnabled: true,
      waitlistCapacity: 5,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b'
    },
    {
      title: 'HIIT Challenge',
      description: 'High Intensity Interval Training that combines strength and cardio exercises in short, intense bursts followed by brief recovery periods. This efficient workout maximizes calorie burn, improves cardiovascular fitness, and builds strength in just 45 minutes. Come prepared to sweat!',
      category: 'hiit' as ClassCategory,
      level: 'intermediate' as ClassLevel,
      instructorId: instructors[1].id,
      instructorName: instructors[1].name,
      location: 'Fitness Studio',
      roomNumber: '202',
      startTime: Timestamp.fromDate(createDateTime(year, month, today, 12, 0)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today, 12, 45)),
      duration: 45,
      capacity: 15,
      waitlistEnabled: true,
      waitlistCapacity: 3,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1434596922112-19c563067271'
    },
    {
      title: 'Evening Meditation',
      description: 'Unwind after a long day with this guided meditation session focused on relaxation and stress relief. Learn techniques to quiet the mind, release tension, and develop greater awareness of the present moment. Suitable for beginners and experienced meditators alike.',
      category: 'meditation' as ClassCategory,
      level: 'beginner' as ClassLevel,
      instructorId: instructors[2].id,
      instructorName: instructors[2].name,
      location: 'Mind & Body Room',
      roomNumber: '103',
      startTime: Timestamp.fromDate(createDateTime(year, month, today, 18, 30)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today, 19, 15)),
      duration: 45,
      capacity: 25,
      waitlistEnabled: false,
      waitlistCapacity: 0,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773'
    },
    
    // Day 2: Tomorrow
    {
      title: 'Power Cycling',
      description: 'An immersive indoor cycling experience set to energizing music. This cardio workout simulates outdoor terrain with sprints, climbs, and jumps to build endurance and leg strength while burning major calories. Bikes can be adjusted for all fitness levels.',
      category: 'cycling' as ClassCategory,
      level: 'intermediate' as ClassLevel,
      instructorId: instructors[3].id,
      instructorName: instructors[3].name,
      location: 'Cycling Studio',
      roomNumber: '105',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 1, 6, 45)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 1, 7, 45)),
      duration: 60,
      capacity: 18,
      waitlistEnabled: true,
      waitlistCapacity: 5,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f'
    },
    {
      title: 'Strength Training 101',
      description: 'Learn proper form and technique for fundamental strength training exercises. This class incorporates barbells, dumbbells, and bodyweight movements to build full-body strength. Perfect for beginners or those looking to refine their technique.',
      category: 'strength' as ClassCategory,
      level: 'beginner' as ClassLevel,
      instructorId: instructors[4].id,
      instructorName: instructors[4].name,
      location: 'Weight Room',
      roomNumber: '201',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 1, 10, 0)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 1, 11, 0)),
      duration: 60,
      capacity: 12,
      waitlistEnabled: true,
      waitlistCapacity: 3,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5'
    },
    {
      title: 'Pilates Core Focus',
      description: 'Strengthen your core and improve posture with this mat-based Pilates class. Focusing on controlled movements and proper breathing techniques, this class targets the abdominals, lower back, hips, and glutes to develop a strong, stable center.',
      category: 'pilates' as ClassCategory,
      level: 'all-levels' as ClassLevel,
      instructorId: instructors[0].id,
      instructorName: instructors[0].name,
      location: 'Mind & Body Room',
      roomNumber: '103',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 1, 17, 15)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 1, 18, 15)),
      duration: 60,
      capacity: 15,
      waitlistEnabled: true,
      waitlistCapacity: 5,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a'
    },
    
    // Day 3
    {
      title: 'Cardio Dance Party',
      description: 'Dance your way to fitness with this fun, high-energy workout! Easy-to-follow dance moves set to popular music create an exercise in disguise. No dance experience necessary—just bring your energy and a smile!',
      category: 'dance' as ClassCategory,
      level: 'all-levels' as ClassLevel,
      instructorId: instructors[1].id,
      instructorName: instructors[1].name,
      location: 'Fitness Studio',
      roomNumber: '202',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 2, 9, 30)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 2, 10, 30)),
      duration: 60,
      capacity: 20,
      waitlistEnabled: true,
      waitlistCapacity: 5,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2'
    },
    {
      title: 'Advanced Yoga',
      description: 'Take your practice to the next level with this challenging yoga class designed for experienced yogis. Explore advanced asanas, transitions, and inversions while refining alignment and developing greater body awareness. Previous yoga experience recommended.',
      category: 'yoga' as ClassCategory,
      level: 'advanced' as ClassLevel,
      instructorId: instructors[2].id,
      instructorName: instructors[2].name,
      location: 'Yoga Studio',
      roomNumber: '101',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 2, 12, 15)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 2, 13, 45)),
      duration: 90,
      capacity: 15,
      waitlistEnabled: true,
      waitlistCapacity: 3,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1588286840104-8957b019727f'
    },
    {
      title: 'Circuit Training',
      description: 'Move through a series of strength and cardio stations designed to work every major muscle group. This efficient, full-body workout improves strength, endurance, and overall fitness. Modifications available for all fitness levels.',
      category: 'strength' as ClassCategory,
      level: 'intermediate' as ClassLevel,
      instructorId: instructors[3].id,
      instructorName: instructors[3].name,
      location: 'Fitness Studio',
      roomNumber: '202',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 2, 17, 0)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 2, 18, 0)),
      duration: 60,
      capacity: 16,
      waitlistEnabled: true,
      waitlistCapacity: 4,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b'
    },
    
    // Day 4
    {
      title: 'Sunrise Meditation',
      description: 'Begin your day with clarity and intention through this early morning meditation practice. Learn to quiet the mind and connect with your breath as you set a positive tone for the day ahead. All levels welcome.',
      category: 'meditation' as ClassCategory,
      level: 'all-levels' as ClassLevel,
      instructorId: instructors[4].id,
      instructorName: instructors[4].name,
      location: 'Mind & Body Room',
      roomNumber: '103',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 3, 6, 0)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 3, 6, 30)),
      duration: 30,
      capacity: 25,
      waitlistEnabled: false,
      waitlistCapacity: 0,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1499728603263-13726abce5fd'
    },
    {
      title: 'HIIT & Core',
      description: 'This hybrid class combines High Intensity Interval Training with focused core work for a comprehensive workout that builds strength and burns calories. Expect short bursts of intense activity followed by core exercises that target your midsection.',
      category: 'hiit' as ClassCategory,
      level: 'intermediate' as ClassLevel,
      instructorId: instructors[0].id,
      instructorName: instructors[0].name,
      location: 'Fitness Studio',
      roomNumber: '202',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 3, 12, 30)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 3, 13, 15)),
      duration: 45,
      capacity: 18,
      waitlistEnabled: true,
      waitlistCapacity: 5,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776'
    },
    {
      title: 'Gentle Yoga',
      description: 'A slow-paced, nurturing practice with an emphasis on relaxation and gentle stretching. Perfect for beginners, seniors, or anyone looking for a soothing, low-impact workout to release tension and improve flexibility.',
      category: 'yoga' as ClassCategory,
      level: 'beginner' as ClassLevel,
      instructorId: instructors[1].id,
      instructorName: instructors[1].name,
      location: 'Yoga Studio',
      roomNumber: '101',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 3, 15, 45)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 3, 16, 45)),
      duration: 60,
      capacity: 20,
      waitlistEnabled: true,
      waitlistCapacity: 5,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2'
    },
    
    // Day 5
    {
      title: 'Advanced Strength Training',
      description: 'Push your strength to new levels with this challenging class focused on progressive overload and compound movements. Using barbells, kettlebells, and advanced bodyweight exercises, this class is designed for those with strength training experience.',
      category: 'strength' as ClassCategory,
      level: 'advanced' as ClassLevel,
      instructorId: instructors[2].id,
      instructorName: instructors[2].name,
      location: 'Weight Room',
      roomNumber: '201',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 4, 8, 0)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 4, 9, 0)),
      duration: 60,
      capacity: 10,
      waitlistEnabled: true,
      waitlistCapacity: 3,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e'
    },
    {
      title: 'Rhythm Cycling',
      description: 'A rhythm-based cycling class that combines music, choreography, and motivation for an unforgettable workout experience. Ride to the beat through hills, sprints, and choreographed movement in this immersive cardio experience.',
      category: 'cycling' as ClassCategory,
      level: 'all-levels' as ClassLevel,
      instructorId: instructors[3].id,
      instructorName: instructors[3].name,
      location: 'Cycling Studio',
      roomNumber: '105',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 4, 17, 30)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 4, 18, 30)),
      duration: 60,
      capacity: 20,
      waitlistEnabled: true,
      waitlistCapacity: 5,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1552848031-326eb9a9a1b0'
    },
    {
      title: 'Dance Fitness',
      description: 'A fun and energetic dance class that fuses hip-hop, Latin, and pop dance moves with fitness. This cardio workout feels more like a party than exercise as you move to current hits and classic dance tracks.',
      category: 'dance' as ClassCategory,
      level: 'all-levels' as ClassLevel,
      instructorId: instructors[4].id,
      instructorName: instructors[4].name,
      location: 'Fitness Studio',
      roomNumber: '202',
      startTime: Timestamp.fromDate(createDateTime(year, month, today + 4, 19, 0)),
      endTime: Timestamp.fromDate(createDateTime(year, month, today + 4, 20, 0)),
      duration: 60,
      capacity: 25,
      waitlistEnabled: true,
      waitlistCapacity: 5,
      status: 'scheduled',
      imageUrl: 'https://images.unsplash.com/photo-1590061333202-f14e66461eb4'
    }
  ];
  
  // Create all classes in Firestore
  console.log('Creating sample classes...');
  
  for (const classData of classesToCreate) {
    try {
      await createClass(classData);
      console.log(`Created class: ${classData.title}`);
    } catch (error) {
      console.error(`Error creating class ${classData.title}:`, error);
    }
  }
  
  console.log('Sample classes creation completed!');
};

export default createSampleClasses;