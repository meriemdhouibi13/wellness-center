// app/(tabs)/index.tsx
import EquipmentCard from '@/components/EquipmentCard';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listEquipment } from '@/services/equipment';
import type { Equipment } from '@/services/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentDate] = useState(new Date());
  const [username, setUsername] = useState('Guest');
  
  // Format date as "Saturday, Oct 18"
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  
  // Equipment availability summary
  const [centerStatus, setCenterStatus] = useState({
    cardio: { available: 0, total: 0 },
    strength: { available: 0, total: 0 },
    yoga: { available: 0, total: 0 },
    meditation: { available: 0, total: 0 },
  });
  
  // Sample recommended items
  const recommendations = [
    { id: '1', name: 'Treadmill', reason: 'Usually available now' },
    { id: '2', name: 'Yoga Studio', reason: 'Low usage now' },
  ];
  
  useEffect(() => {
    // Load username from storage
    AsyncStorage.getItem('username').then((name) => {
      if (name) setUsername(name);
    });

    // Load equipment data
    loadEquipmentData();
    
    // Auto-refresh every 5 seconds to show real-time updates
    const interval = setInterval(() => {
      loadEquipmentData();
    }, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  async function loadEquipmentData() {
    try {
      // Fetch equipment from Firebase (no loading state changes during auto-refresh)
      const equipmentData = await listEquipment();
      setEquipment(equipmentData);
      
      // Calculate equipment availability by type
      const status = {
        cardio: { available: 0, total: 0 },
        strength: { available: 0, total: 0 },
        yoga: { available: 0, total: 0 },
        meditation: { available: 0, total: 0 },
      };
      
      equipmentData.forEach(item => {
        const type = item.type as keyof typeof status;
        if (status[type]) {
          status[type].total += 1;
          if (item.status === 'available') {
            status[type].available += 1;
          }
        }
      });
      
      setCenterStatus({
        cardio: status.cardio || { available: 0, total: 0 },
        strength: status.strength || { available: 0, total: 0 },
        yoga: status.yoga || { available: 0, total: 0 },
        meditation: status.meditation || { available: 0, total: 0 },
      });
      
      // Only change loading state on initial load
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  }

  // Handle quick action button presses
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        // Navigate to QR scanner
        router.push('/scan' as any);
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

  // Get first name from username for personalized greeting
  const getFirstName = () => {
    // Check if username has numeric suffix and remove it
    const nameWithoutNumbers = username.replace(/\d+$/, '');
    
    // Capitalize the first letter
    return nameWithoutNumbers.charAt(0).toUpperCase() + nameWithoutNumbers.slice(1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userContainer}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {getFirstName().charAt(0)}
            </Text>
          </View>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Hi, {getFirstName()}
          </Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={async () => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.removeItem('username');
                    await AsyncStorage.removeItem('auth:session');
                    setUsername('Guest');
                    router.push('/sign-in' as any);
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.signOutIcon}>←</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          </View>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('scan')}
            >
              <Text style={styles.actionIcon}>📱</Text>
              <Text style={styles.actionText}>Scan QR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('find')}
            >
              <Text style={styles.actionIcon}>🔍</Text>
              <Text style={styles.actionText}>Find Space</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleQuickAction('stats')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>My Stats</Text>
            </TouchableOpacity>
          </View>
          
          {/* Current Activity */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Activity</Text>
          </View>
          
          <View style={styles.activityCard}>
            <Text style={styles.noActivityText}>No active sessions</Text>
            <TouchableOpacity 
              style={styles.startSessionButton}
              onPress={() => router.push('/scan' as any)}
            >
              <Text style={styles.startSessionText}>➕ Start a session by scanning a QR</Text>
            </TouchableOpacity>
          </View>
          
          {/* Center Status */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Center Status</Text>
            <TouchableOpacity onPress={() => router.push('/equipment' as any)}>
              <Text style={styles.moreLink}>📊 More</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusCard}>
            <View style={styles.statusItem}>
              <Text style={styles.statusText}>
                <Text style={styles.statusDot}>●</Text> {centerStatus.cardio.available}/{centerStatus.cardio.total} Cardio Machines Available
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusText}>
                <Text style={styles.statusDot}>●</Text> {centerStatus.strength.available}/{centerStatus.strength.total} Weight Machines Available
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusText}>
                <Text style={styles.statusDot}>●</Text> {centerStatus.yoga.available}/{centerStatus.yoga.total} Yoga Spaces Available
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusText}>
                <Text style={styles.statusDot}>●</Text> {centerStatus.meditation.available}/{centerStatus.meditation.total} Meditation Rooms Available
              </Text>
            </View>
          </View>
          
          {/* Recommendations */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
          </View>
          
          <View style={styles.recommendationsContainer}>
            {recommendations.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.recommendationCard}
                onPress={() => router.push(`/equipment/${item.id}` as any)}
              >
                <Text style={styles.recommendationTitle}>{item.name}</Text>
                <Text style={styles.recommendationReason}>{item.reason}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Equipment List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Equipment</Text>
          </View>
          
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 16,
  },
  userContainer: {
    marginRight: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0a7ea4',
  },
  avatarText: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#11181C',
  },
  dateText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  signOutButton: {
    padding: 5,
  },
  signOutIcon: {
    fontSize: 28,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  infoButton: {
    padding: 5,
  },
  infoIcon: {
    fontSize: 22,
    color: '#7f8c8d',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#11181C',
    marginBottom: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
  },
  moreLink: {
    fontSize: 14,
    color: '#0a7ea4',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#ffffff',
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
    color: '#11181C',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    color: '#7f8c8d',
  },
  startSessionButton: {
    alignItems: 'center',
  },
  startSessionText: {
    fontSize: 14,
    color: '#0a7ea4',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    color: '#11181C',
  },
  statusDot: {
    color: '#2ecc71',
    fontSize: 16,
  },
  recommendationsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    width: '48%',
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
    color: '#11181C',
  },
  recommendationReason: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});