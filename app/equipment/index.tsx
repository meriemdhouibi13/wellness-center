import EquipmentCard from '@/components/EquipmentCard';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Equipment {
  id: string;
  name: string;
  type: string;
  status: 'available' | 'in_use';
}

export default function EquipmentListScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // TODO: Replace with actual Firebase query
    // For now, using mock data
    const mockEquipment: Equipment[] = [
      { id: '1', name: 'Treadmill A', type: 'cardio', status: 'available' },
      { id: '2', name: 'Dumbbell Set', type: 'strength', status: 'in_use' },
      { id: '3', name: 'Yoga Mat', type: 'yoga', status: 'available' },
      { id: '4', name: 'Meditation Cushion', type: 'meditation', status: 'available' },
      { id: '5', name: 'Stationary Bike', type: 'cardio', status: 'in_use' },
      { id: '6', name: 'Barbell', type: 'strength', status: 'available' },
    ];

    // Simulate loading delay
    const timer = setTimeout(() => {
      setEquipment(mockEquipment);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Available Equipment</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : equipment.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No equipment available</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {equipment.map((item) => (
            <EquipmentCard
              key={item.id}
              id={item.id}
              name={item.name}
              type={item.type}
              status={item.status}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 20,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
});
