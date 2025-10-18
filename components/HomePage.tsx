// components/HomePage.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function HomePage() {
  const router = useRouter();
  const [currentDate] = useState(new Date());
  
  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'background');
  const secondaryText = useThemeColor({}, 'icon');
  
  // Format date as "Saturday, Oct 18"
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  
  // Sample equipment availability data
  const availabilityData = {
    cardio: { available: 23, total: 30 },
    weights: { available: 12, total: 15 },
    yoga: { available: 5, total: 8 },
    meditation: { available: 2, total: 4 },
  };
  
  // Sample recommended items
  const recommendations = [
    { id: '1', name: 'Treadmill', reason: 'Usually available now' },
    { id: '2', name: 'Yoga Studio', reason: 'Low usage now' },
  ];
  
  // Handle navigation for quick action buttons
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        router.push('/equipment' as any);
        break;
      case 'find':
        router.push('/equipment' as any);
        break;
      case 'stats':
        router.push('/(tabs)/explore' as any);
        break;
      default:
        break;
    }
  };
  
  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userContainer}>
          <View style={[styles.userAvatar, { borderColor: secondaryText }]}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        </View>
        <View style={styles.headerTextContainer}>
          <ThemedText style={styles.headerTitle}>Wellness Center</ThemedText>
          <ThemedText style={[styles.dateText, { color: secondaryText }]}>{formattedDate}</ThemedText>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <ThemedText style={styles.infoIcon}>ⓘ</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>⚡ Quick Actions</ThemedText>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: cardBackground }]}
            onPress={() => handleQuickAction('scan')}
          >
            <Text style={styles.actionIcon}>📱</Text>
            <ThemedText style={styles.actionText}>Scan QR</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: cardBackground }]}
            onPress={() => handleQuickAction('find')}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <ThemedText style={styles.actionText}>Find Space</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: cardBackground }]}
            onPress={() => handleQuickAction('stats')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <ThemedText style={styles.actionText}>My Stats</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Current Activity */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Current Activity</ThemedText>
        </View>

        <View style={[styles.activityCard, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.noActivityText, { color: secondaryText }]}>No active sessions</ThemedText>
          <TouchableOpacity
            style={styles.startSessionButton}
            onPress={() => handleQuickAction('scan')}
          >
            <ThemedText style={[styles.startSessionText, { color: tintColor }]}>➕ Start a session by scanning a QR</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Center Status */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Center Status</ThemedText>
          <TouchableOpacity onPress={() => router.push('/equipment' as any)}>
            <ThemedText style={[styles.moreLink, { color: tintColor }]}>📊 More</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={[styles.statusCard, { backgroundColor: cardBackground }]}>
          <View style={styles.statusItem}>
            <ThemedText style={styles.statusText}>
              <Text style={styles.statusDot}>●</Text> {availabilityData.cardio.available}/{availabilityData.cardio.total} Cardio Machines Available
            </ThemedText>
          </View>
          <View style={styles.statusItem}>
            <ThemedText style={styles.statusText}>
              <Text style={styles.statusDot}>●</Text> {availabilityData.weights.available}/{availabilityData.weights.total} Weight Machines Available
            </ThemedText>
          </View>
          <View style={styles.statusItem}>
            <ThemedText style={styles.statusText}>
              <Text style={styles.statusDot}>●</Text> {availabilityData.yoga.available}/{availabilityData.yoga.total} Yoga Spaces Available
            </ThemedText>
          </View>
          <View style={styles.statusItem}>
            <ThemedText style={styles.statusText}>
              <Text style={styles.statusDot}>●</Text> {availabilityData.meditation.available}/{availabilityData.meditation.total} Meditation Rooms Available
            </ThemedText>
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recommended For You</ThemedText>
        </View>

        <View style={styles.recommendationsContainer}>
          {recommendations.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.recommendationCard, { backgroundColor: cardBackground }]}
              onPress={() => router.push(`/equipment/${item.id}` as any)}
            >
              <ThemedText style={styles.recommendationTitle}>{item.name}</ThemedText>
              <ThemedText style={[styles.recommendationReason, { color: secondaryText }]}>{item.reason}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 22,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    marginTop: 2,
  },
  infoButton: {
    padding: 5,
  },
  infoIcon: {
    fontSize: 22,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  moreLink: {
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noActivityText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  startSessionButton: {
    alignItems: 'center',
  },
  startSessionText: {
    fontSize: 14,
  },
  statusCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusItem: {
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
  },
  statusDot: {
    color: '#2ecc71',
    fontSize: 16,
  },
  recommendationsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  recommendationCard: {
    borderRadius: 12,
    padding: 14,
    width: '48%',
    marginRight: '4%',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  recommendationReason: {
    fontSize: 14,
  },
});