// app/equipment/[id].tsx - Equipment detail page with waitlist functionality

import EquipmentUsageAnalytics from '@/components/EquipmentUsageAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { logEquipmentUsageEnd, logEquipmentUsageStart, getEquipment } from '@/services/equipment';
import { getUserWaitlistEntry, joinWaitlist, leaveWaitlist, getEstimatedWaitTime } from '@/services/waitlist';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
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
  const { user } = useAuth();
  
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ active: boolean, startTime?: Date }>({ active: false });
  const [sessionTimer, setSessionTimer] = useState(0);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number | null>(null);

  // Load equipment data
  useEffect(() => {
    async function loadEquipmentData() {
      try {
        setLoading(true);
        
        // Try to get real equipment data from the database
        const realData = await getEquipment(equipmentId);
        
        if (realData) {
          console.log("Loaded real equipment data:", realData);
          setEquipment(realData);
        } else {
          // Fallback to mock data if no real data exists
          const mockData = mockEquipmentData[equipmentId as keyof typeof mockEquipmentData];
          
          if (mockData) {
            console.log("Using mock equipment data:", mockData);
            setEquipment(mockData);
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
        }
      } catch (error) {
        console.error('Error loading equipment data:', error);
        
        // If there's an error, try mock data as fallback
        const mockData = mockEquipmentData[equipmentId as keyof typeof mockEquipmentData];
        if (mockData) {
          console.log("Using mock equipment data after error:", mockData);
          setEquipment(mockData);
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadEquipmentData();
  }, [equipmentId]);
  
  // Check if user is on waitlist
  useEffect(() => {
    if (user?.uid && equipment?.id && equipment.status === 'in_use') {
      setIsJoiningWaitlist(true);
      getUserWaitlistEntry(equipment.id, user.uid)
        .then(entry => {
          setIsOnWaitlist(!!entry);
        })
        .catch(error => {
          console.error('Error checking waitlist status:', error);
        })
        .finally(() => {
          setIsJoiningWaitlist(false);
        });
    } else {
      // Reset waitlist state when equipment is not in use
      setIsOnWaitlist(false);
    }
  }, [user?.uid, equipment?.id, equipment?.status]);
  
  // Refresh waitlist status periodically
  useEffect(() => {
    if (user?.uid && equipment?.id && equipment.status === 'in_use') {
      // Set up refresh interval
      const interval = setInterval(() => {
        getUserWaitlistEntry(equipment.id, user.uid)
          .then(entry => {
            setIsOnWaitlist(!!entry);
          })
          .catch(error => {
            console.error('Error refreshing waitlist status:', error);
          });
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user?.uid, equipment?.id, equipment?.status]);
  
  // Fetch estimated wait time when equipment is in use
  useEffect(() => {
    if (equipment?.id && equipment.status === 'in_use') {
      getEstimatedWaitTime(equipment.id)
        .then(waitTime => {
          setEstimatedWaitTime(waitTime);
        })
        .catch(error => {
          console.error('Error getting estimated wait time:', error);
        });
    }
  }, [equipment?.id, equipment?.status]);

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
    // log usage start (fire-and-forget)
    (async () => {
      try {
        const log = await logEquipmentUsageStart(equipment.id, null);
        // attach usage id to session state so we can end it properly
        setSession((s) => ({ ...s, usageId: log.id } as any));
      } catch (e) {
        console.warn('Failed to log usage start', e);
      }
    })();
    
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
    (async () => {
      try {
        const usageId = (session as any).usageId;
        if (usageId) await logEquipmentUsageEnd(equipment.id, usageId);
      } catch (e) {
        console.warn('Failed to log usage end', e);
      }
    })();
    setSession({ active: false });
    
    // Update equipment status locally
    if (equipment) {
      setEquipment({
        ...equipment,
        status: 'available'
      });
    }
  };
  
  // Toggle user's waitlist status
  const handleWaitlistToggle = async (value: boolean) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to join the waitlist');
      return;
    }
    
    if (!equipment) return;
    
    setIsJoiningWaitlist(true);
    
    try {
      if (value) {
        // Join waitlist
        await joinWaitlist(equipment.id, user.uid, user.displayName || 'User');
        Alert.alert('Success', `You've been added to the waitlist for ${equipment.name}`);
        setIsOnWaitlist(true);
      } else {
        // Leave waitlist
        await leaveWaitlist(equipment.id, user.uid);
        Alert.alert('Success', `You've been removed from the waitlist for ${equipment.name}`);
        setIsOnWaitlist(false);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not update waitlist status');
    } finally {
      setIsJoiningWaitlist(false);
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
      
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <View style={styles.equipmentDetails}>
          <Text style={styles.equipmentIcon}>
            {getEquipmentIcon(equipment.type)}
          </Text>
          <Text style={styles.equipmentType}>{equipment.type.toUpperCase()}</Text>
          
          {/* Only show active session UI when user has started a session */}
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
                  equipment.status === 'available' ? styles.availableText : 
                  equipment.status === 'broken' ? styles.brokenText : styles.inUseText
                ]}
              >
                {equipment.status === 'available' ? 'AVAILABLE' : 
                 equipment.status === 'broken' ? 'OUT OF SERVICE' : 'IN USE'}
              </Text>
              
              {/* AVAILABLE EQUIPMENT - Show start session button */}
              {equipment.status === 'available' && !equipment.hasMalfunction && (
                <TouchableOpacity 
                  style={styles.button}
                  onPress={startSession}
                >
                  <Text style={styles.buttonText}>Start Session</Text>
                </TouchableOpacity>
              )}
              
              {/* EQUIPMENT WITH MALFUNCTION */}
              {equipment.hasMalfunction && (
                <View style={styles.malfunctionContainer}>
                  <Text style={styles.malfunctionText}>
                    This equipment has been reported as malfunctioning.
                  </Text>
                </View>
              )}
              
              {/* IN USE EQUIPMENT - Show waitlist options */}
              {equipment.status === 'in_use' && (
                <>
                  <Text style={styles.inUseMessage}>
                    This equipment is currently in use by someone else.
                  </Text>
                  
                  {/* Estimated Wait Time */}
                  {estimatedWaitTime !== null && (
                    <View style={styles.waitTimeBox}>
                      <Text style={styles.waitTimeLabel}>Estimated Wait:</Text>
                      <Text style={styles.waitTimeValue}>
                        {estimatedWaitTime} {estimatedWaitTime === 1 ? 'minute' : 'minutes'}
                      </Text>
                    </View>
                  )}
                  
                  {/* Waitlist Toggle */}
                  <View style={styles.waitlistContainer}>
                    <Text style={styles.waitlistTitle}>Join Waitlist</Text>
                    
                    <View style={styles.waitlistToggle}>
                      <Text style={styles.waitlistToggleText}>
                        {isOnWaitlist ? 'You are on the waitlist' : 'Add me to waitlist'}
                      </Text>
                      
                      <Switch
                        value={isOnWaitlist}
                        onValueChange={handleWaitlistToggle}
                        disabled={isJoiningWaitlist}
                        trackColor={{ false: '#d0d0d0', true: '#a0cfff' }}
                        thumbColor={isOnWaitlist ? '#0a7ea4' : '#f4f3f4'}
                      />
                      
                      {isJoiningWaitlist && (
                        <ActivityIndicator style={styles.toggleSpinner} size="small" color="#0a7ea4" />
                      )}
                    </View>
                    
                    <Text style={styles.waitlistInfo}>
                      {isOnWaitlist 
                        ? 'You will be notified when this equipment becomes available.'
                        : 'Join the waitlist to get notified when this equipment becomes available.'}
                    </Text>
                  </View>
                </>
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

        <EquipmentUsageAnalytics equipmentId={equipment.id} days={14} />
      </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40, // Add extra padding at the bottom
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
  brokenText: {
    color: '#7f8c8d',
  },
  malfunctionContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fee',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffcfcf',
  },
  malfunctionText: {
    color: '#e74c3c',
    textAlign: 'center',
    fontSize: 14,
  },
  waitTimeBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff8e1',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffe082',
    alignItems: 'center',
  },
  waitTimeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  waitTimeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f39c12',
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
  waitlistContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e6ff',
  },
  waitlistTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 12,
  },
  waitlistToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  waitlistToggleText: {
    fontSize: 14,
    color: '#11181C',
    flex: 1,
  },
  toggleSpinner: {
    marginLeft: 8,
  },
  waitlistInfo: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
});