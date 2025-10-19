// Modify app/equipment/[id].tsx to handle starting sessions

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Mock equipment data
const mockEquipmentData = {
  '1': { id: '1', name: 'Treadmill A', type: 'cardio', status: 'available' },
  '2': { id: '2', name: 'Dumbbell Set', type: 'strength', status: 'in_use' },
  '3': { id: '3', name: 'Yoga Mat', type: 'yoga', status: 'available' },
  '4': { id: '4', name: 'Meditation Cushion', type: 'meditation', status: 'available' },
  '5': { id: '5', name: 'Stationary Bike', type: 'cardio', status: 'in_use' },
  '6': { id: '6', name: 'Barbell', type: 'strength', status: 'available' },
  // Add more test equipment for QR codes
  'test1': { id: 'test1', name: 'Test Equipment 1', type: 'cardio', status: 'available' },
  'test2': { id: 'test2', name: 'Test Equipment 2', type: 'strength', status: 'available' },
  'qr1': { id: 'qr1', name: 'QR Code Test Machine', type: 'cardio', status: 'available' },
};

// Get icon based on equipment type
const getEquipmentIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'cardio': return '🏃‍♀️';
    case 'strength': return '🏋️';
    case 'yoga': return '🧘';
    case 'meditation': return '🧠';
    default: return '⚙️';
  }
};

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const equipmentId = Array.isArray(id) ? id[0] : id || '';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ active: boolean, startTime?: Date }>({ active: false });
  const [sessionTimer, setSessionTimer] = useState(0);
  
  // Load equipment data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      try {
        // Try to get equipment data or use fallback if ID doesn't exist
        const data = mockEquipmentData[equipmentId as keyof typeof mockEquipmentData];
        
        if (data) {
          setEquipment(data);
        } else {
          // Set a fallback/default equipment item when ID doesn't exist
          console.warn(`Equipment ID "${equipmentId}" not found in data`);
          setEquipment({
            id: equipmentId || 'unknown',
            name: `Unknown Equipment (${equipmentId || 'N/A'})`,
            type: 'unknown',
            status: 'available'
          });
        }
      } catch (error) {
        console.error('Error loading equipment data:', error);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [equipmentId]);
  
  // Handle timer for active session
  useEffect(() => {
    let interval: number | undefined;
    
    if (session.active && session.startTime) {
      interval = setInterval(() => {
        const seconds = Math.floor((new Date().getTime() - session.startTime!.getTime()) / 1000);
        setSessionTimer(seconds);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [session]);
  
  // Start a session with this equipment
  const startSession = () => {
    // In a real app, you would make an API call here
    setSession({ 
      active: true, 
      startTime: new Date() 
    });
    
    // Update equipment status locally
    if (equipment) {
      setEquipment({
        ...equipment,
        status: 'in_use'
      });
    }
  };
  
  // End the current session
  const endSession = () => {
    // In a real app, you would make an API call here
    setSession({ active: false });
    
    // Update equipment status locally
    if (equipment) {
      setEquipment({
        ...equipment,
        status: 'available'
      });
    }
  };
  
  // Format timer as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Equipment Details</Text>
          <View style={styles.headerRight} />
        </View>
        <ActivityIndicator style={styles.loading} size="large" color="#0a7ea4" />
      </View>
    );
  }
  
  if (!equipment) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#11181C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Equipment Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Equipment not found</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{equipment.name}</Text>
        <View style={styles.headerRight} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.equipmentDetails}>
          <Text style={styles.equipmentIcon}>
            {getEquipmentIcon(equipment.type)}
          </Text>
          <Text style={styles.equipmentType}>{equipment.type.toUpperCase()}</Text>
          
          {session.active ? (
            <View style={styles.sessionContainer}>
              <Text style={styles.sessionTitle}>Session in Progress</Text>
              <Text style={styles.timerText}>{formatTime(sessionTimer)}</Text>
              <TouchableOpacity 
                style={[styles.button, styles.endButton]}
                onPress={endSession}
              >
                <Text style={styles.buttonText}>End Session</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statusContainer}>
              <Text 
                style={[
                  styles.statusText, 
                  equipment.status === 'available' ? styles.availableText : styles.inUseText
                ]}
              >
                {equipment.status === 'available' ? 'AVAILABLE' : 'IN USE'}
              </Text>
              
              {equipment.status === 'available' && (
                <TouchableOpacity 
                  style={styles.button}
                  onPress={startSession}
                >
                  <Text style={styles.buttonText}>Start Session</Text>
                </TouchableOpacity>
              )}
              
              {equipment.status === 'in_use' && (
                <Text style={styles.inUseMessage}>
                  This equipment is currently in use by someone else.
                </Text>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.usageInfo}>
          <Text style={styles.infoTitle}>Usage Information</Text>
          <Text style={styles.infoText}>• Wipe down equipment after use</Text>
          <Text style={styles.infoText}>• 30 minute time limit during peak hours</Text>
          <Text style={styles.infoText}>• Report any equipment issues to staff</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#11181C',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  equipmentDetails: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  equipmentIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  equipmentType: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  availableText: {
    color: '#2ecc71',
  },
  inUseText: {
    color: '#f1c40f',
  },
  inUseMessage: {
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 8,
  },
  sessionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#11181C',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  endButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  usageInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#11181C',
  },
  infoText: {
    fontSize: 16,
    color: '#11181C',
    marginBottom: 8,
    lineHeight: 22,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  notFoundText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 20,
  },
});