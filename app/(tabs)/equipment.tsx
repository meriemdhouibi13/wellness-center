import EquipmentCard from '@/components/EquipmentCard';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Equipment } from '@/services/types';
import { listEquipment } from '@/services/equipment';

export default function EquipmentTab() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchEquipment = async () => {
      try {
        console.log('Fetching equipment...');
        const items = await listEquipment();
        console.log('Equipment loaded:', items.length, 'items');
        if (isMounted) setEquipment(items);
      } catch (e) {
        console.error('Failed to load equipment', e);
        if (isMounted) setError((e as Error).message);
      } finally {
        // Only change loading state on initial load
        if (isMounted && isInitialLoad) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };
    
    // Initial fetch
    fetchEquipment();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchEquipment, 5000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Equipment</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Error: {error}</Text>
        </View>
      ) : equipment.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No equipment available. Run the Seed screen!</Text>
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
              hasMalfunction={item.hasMalfunction}
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
    paddingTop: 60,
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
