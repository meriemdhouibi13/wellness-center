import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Equipment } from '@/services/types';
import { getEquipment } from '@/services/equipment';

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!id) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const item = await getEquipment(id as string);
        if (isMounted) setEquipment(item);
      } catch (e) {
        console.error('Failed to load equipment', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [id]);

  const getEquipmentIcon = () => {
    switch (equipment?.type.toLowerCase()) {
      case 'cardio': return '🏃‍♀️';
      case 'strength': return '🏋️';
      case 'yoga': return '🧘';
      case 'meditation': return '🧠';
      default: return '⚙️';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      </View>
    );
  }

  if (!equipment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Equipment not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.icon}>{getEquipmentIcon()}</Text>
          <Text style={styles.name}>{equipment.name}</Text>
          <Text style={styles.type}>{equipment.type.toUpperCase()}</Text>
        </View>

        <View style={[
          styles.statusBadge,
          equipment.status === 'available' ? styles.availableBadge : styles.inUseBadge
        ]}>
          <Text style={[
            styles.statusText,
            equipment.status === 'available' ? styles.availableText : styles.inUseText
          ]}>
            {equipment.status === 'available' ? '✓ AVAILABLE' : '⏱ IN USE'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          {equipment.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{equipment.description}</Text>
            </View>
          )}

          {equipment.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{equipment.location}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[
              styles.detailValue,
              equipment.status === 'available' ? { color: '#2ecc71' } : { color: '#f1c40f' }
            ]}>
              {equipment.status === 'available' ? 'Available' : 'In Use'}
            </Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              equipment.status === 'available' ? styles.primaryButton : styles.disabledButton
            ]}
            disabled={equipment.status !== 'available'}
          >
            <Text style={styles.actionButtonText}>
              {equipment.status === 'available' ? 'Start Session' : 'Currently In Use'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 8,
  },
  type: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  availableBadge: {
    backgroundColor: '#d5f4e6',
  },
  inUseBadge: {
    backgroundColor: '#fef5e7',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  availableText: {
    color: '#2ecc71',
  },
  inUseText: {
    color: '#f1c40f',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 16,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#11181C',
    fontWeight: '500',
  },
  actionSection: {
    marginBottom: 32,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
});
