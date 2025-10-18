// src/app/index.tsx (or src/app/(tabs)/index.tsx depending on your structure)
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import EquipmentCard from './EquipmentCard';

// Sample data for testing
const sampleEquipment = [
  { id: '1', name: 'Treadmill 1', type: 'Cardio', status: 'available' as const },
  { id: '2', name: 'Bench Press', type: 'Strength', status: 'in_use' as const },
  { id: '3', name: 'Yoga Mat 1', type: 'Yoga', status: 'available' as const },
  { id: '4', name: 'Meditation Cushion', type: 'Meditation', status: 'available' as const },
  { id: '5', name: 'Rowing Machine', type: 'Cardio', status: 'in_use' as const },
  { id: '6', name: 'Squat Rack', type: 'Strength', status: 'available' as const },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wellness Center</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.equipmentGrid}>
          {sampleEquipment.map((item) => (
            <View key={item.id} style={styles.cardContainer}>
              <EquipmentCard
                id={item.id}
                name={item.name}
                type={item.type}
                status={item.status}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: '48%', // Almost half the screen width with some spacing
    marginBottom: 16,
  },
});