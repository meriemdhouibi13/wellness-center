import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { FitnessClass, ClassRegistration } from '@/services/types';
import { 
  getClassById, 
  getUserClassRegistration, 
  registerForClass, 
  cancelClassRegistration 
} from '@/services/classes';
import { useAuth } from '@/contexts/AuthContext';

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [fitnessClass, setFitnessClass] = useState<FitnessClass | null>(null);
  const [registration, setRegistration] = useState<ClassRegistration | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [registering, setRegistering] = useState<boolean>(false);
  
  // Load class data
  useEffect(() => {
    async function loadClass() {
      if (!id) return;
      
      try {
        const fetchedClass = await getClassById(id);
        setFitnessClass(fetchedClass);
        
        // Check if user is registered
        if (fetchedClass && user?.uid) {
          const userRegistration = await getUserClassRegistration(id, user.uid);
          setRegistration(userRegistration);
        }
      } catch (error) {
        console.error('Error loading class:', error);
        Alert.alert('Error', 'Failed to load class details');
      } finally {
        setLoading(false);
      }
    }
    
    loadClass();
  }, [id, user?.uid]);
  
  // Format date and time
  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return format(date, 'EEEE, MMMM d, yyyy • h:mm a');
  };
  
  // Handle class registration
  const handleRegister = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to register for classes');
      return;
    }
    
    if (!fitnessClass) return;
    
    setRegistering(true);
    try {
      const newRegistration = await registerForClass(
        fitnessClass.id,
        user.uid,
        user.displayName || 'User'
      );
      
      setRegistration(newRegistration);
      
      if (newRegistration.status === 'confirmed') {
        Alert.alert('Success!', 'You have successfully registered for this class.');
      } else if (newRegistration.status === 'waitlisted') {
        Alert.alert(
          'Added to Waitlist',
          `The class is currently full. You've been added to the waitlist at position #${newRegistration.position}.`
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register for class');
    } finally {
      setRegistering(false);
    }
  };
  
  // Handle cancellation
  const handleCancel = async () => {
    if (!user || !fitnessClass) return;
    
    Alert.alert(
      'Cancel Registration',
      'Are you sure you want to cancel your registration for this class?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setRegistering(true);
            try {
              await cancelClassRegistration(fitnessClass.id, user.uid);
              setRegistration(null);
              Alert.alert('Canceled', 'Your registration has been canceled.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel registration');
            } finally {
              setRegistering(false);
            }
          }
        }
      ]
    );
  };
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'yoga': return '🧘';
      case 'cardio': return '🏃‍♀️';
      case 'strength': return '🏋️';
      case 'hiit': return '⚡';
      case 'pilates': return '💫';
      case 'dance': return '💃';
      case 'meditation': return '🧠';
      case 'cycling': return '🚴';
      default: return '🏋️‍♀️';
    }
  };
  
  // Get level badge color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#4CAF50'; // Green
      case 'intermediate': return '#FF9800'; // Orange
      case 'advanced': return '#F44336'; // Red
      default: return '#2196F3'; // Blue for all-levels
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Class Details' }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading class details...</Text>
      </View>
    );
  }
  
  if (!fitnessClass) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Class Not Found' }} />
        <Ionicons name="alert-circle-outline" size={64} color="#dc3545" />
        <Text style={styles.errorTitle}>Class Not Found</Text>
        <Text style={styles.errorMessage}>The requested class could not be found.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const isFull = fitnessClass.currentRegistrations >= fitnessClass.capacity;
  const canRegister = !registration && fitnessClass.status === 'scheduled';
  const canCancel = registration && (registration.status === 'confirmed' || registration.status === 'waitlisted');
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: fitnessClass.title }} />
      
      {/* Class Header */}
      <View style={styles.header}>
        <View style={styles.categoryIconContainer}>
          <Text style={styles.categoryIcon}>{getCategoryIcon(fitnessClass.category)}</Text>
        </View>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{fitnessClass.title}</Text>
          
          <View style={styles.categoryAndLevel}>
            <View style={styles.category}>
              <Text style={styles.categoryText}>{fitnessClass.category.toUpperCase()}</Text>
            </View>
            
            <View style={[styles.level, { backgroundColor: getLevelColor(fitnessClass.level) }]}>
              <Text style={styles.levelText}>{fitnessClass.level.toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Status Badge */}
      {fitnessClass.status !== 'scheduled' && (
        <View style={[styles.statusBadge, { 
          backgroundColor: fitnessClass.status === 'canceled' ? '#dc3545' : '#6c757d'
        }]}>
          <Text style={styles.statusText}>{fitnessClass.status.toUpperCase()}</Text>
        </View>
      )}
      
      {/* Class Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={24} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Date & Time</Text>
            <Text style={styles.infoText}>{formatDateTime(fitnessClass.startTime)}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="hourglass-outline" size={24} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoText}>
              {fitnessClass.duration >= 60 
                ? `${Math.floor(fitnessClass.duration / 60)} hour${fitnessClass.duration >= 120 ? 's' : ''} ${fitnessClass.duration % 60 > 0 ? `${fitnessClass.duration % 60} min` : ''}`
                : `${fitnessClass.duration} minutes`
              }
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={24} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoText}>
              {fitnessClass.location}
              {fitnessClass.roomNumber ? `, Room ${fitnessClass.roomNumber}` : ''}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={24} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Instructor</Text>
            <Text style={styles.infoText}>{fitnessClass.instructorName}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={24} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Capacity</Text>
            <Text style={styles.infoText}>
              {fitnessClass.currentRegistrations}/{fitnessClass.capacity} registered
              {isFull && fitnessClass.waitlistEnabled && ' (waitlist available)'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Class Description */}
      <View style={styles.descriptionCard}>
        <Text style={styles.descriptionTitle}>About this Class</Text>
        <Text style={styles.description}>{fitnessClass.description}</Text>
      </View>
      
      {/* Registration Status */}
      {registration && (
        <View style={[
          styles.registrationStatus,
          registration.status === 'waitlisted' ? styles.waitlistedStatus : styles.confirmedStatus
        ]}>
          <Ionicons 
            name={registration.status === 'confirmed' ? 'checkmark-circle' : 'time'}
            size={24} 
            color={registration.status === 'confirmed' ? '#fff' : '#fff'} 
          />
          <Text style={styles.registrationStatusText}>
            {registration.status === 'confirmed' 
              ? 'You are registered for this class' 
              : `You are #${registration.position} on the waitlist`
            }
          </Text>
        </View>
      )}
      
      {/* Action Button */}
      {fitnessClass.status === 'scheduled' && (
        <View style={styles.actionContainer}>
          {canRegister && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                isFull && !fitnessClass.waitlistEnabled ? styles.disabledButton : styles.registerButton
              ]}
              onPress={handleRegister}
              disabled={registering || (isFull && !fitnessClass.waitlistEnabled)}
            >
              {registering ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons 
                    name={isFull && fitnessClass.waitlistEnabled ? "time" : "add-circle"} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.actionButtonText}>
                    {isFull 
                      ? (fitnessClass.waitlistEnabled ? 'Join Waitlist' : 'Class Full') 
                      : 'Register for Class'
                    }
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={registering}
            >
              {registering ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Cancel Registration</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#343a40',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 32,
  },
  titleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  categoryAndLevel: {
    flexDirection: 'row',
  },
  category: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
  },
  level: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 16,
    color: '#212529',
  },
  descriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
  },
  registrationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  confirmedStatus: {
    backgroundColor: '#28a745',
  },
  waitlistedStatus: {
    backgroundColor: '#ffc107',
  },
  registrationStatusText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionContainer: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  registerButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});