import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useAuth } from '@/contexts/AuthContext';
import { getUserUpcomingRegistrations, cancelClassRegistration } from '@/services/classes';
import { ClassRegistration, FitnessClass } from '@/services/types';

type RegistrationWithClass = {
  registration: ClassRegistration;
  fitnessClass: FitnessClass;
};

export default function MyClassesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [registrations, setRegistrations] = useState<RegistrationWithClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  
  // Load user's class registrations
  useEffect(() => {
    async function loadRegistrations() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const userRegistrations = await getUserUpcomingRegistrations(user.uid);
        setRegistrations(userRegistrations);
      } catch (error) {
        console.error('Error loading registrations:', error);
        Alert.alert('Error', 'Failed to load your class registrations');
      } finally {
        setLoading(false);
      }
    }
    
    loadRegistrations();
  }, [user]);
  
  // Handle registration cancellation
  const handleCancel = (classId: string, className: string) => {
    if (!user) return;
    
    Alert.alert(
      'Cancel Registration',
      `Are you sure you want to cancel your registration for "${className}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelingId(classId);
            try {
              await cancelClassRegistration(classId, user.uid);
              
              // Update the list
              setRegistrations(prev => prev.filter(item => item.fitnessClass.id !== classId));
              
              Alert.alert('Canceled', 'Your class registration has been canceled.');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel registration');
            } finally {
              setCancelingId(null);
            }
          }
        }
      ]
    );
  };
  
  // Format date and time
  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return format(date, 'EEE, MMM d • h:mm a');
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
  
  // Sign in prompt if not logged in
  if (!user && !loading) {
    return (
      <View style={styles.signInContainer}>
        <Stack.Screen options={{ title: 'My Classes' }} />
        <Ionicons name="log-in-outline" size={64} color="#6c757d" />
        <Text style={styles.signInTitle}>Sign In Required</Text>
        <Text style={styles.signInMessage}>Please sign in to view your registered classes.</Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push('/sign-in' as any)}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'My Classes' }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your classes...</Text>
      </View>
    );
  }
  
  // Empty state
  if (registrations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Stack.Screen options={{ title: 'My Classes' }} />
        <Ionicons name="calendar-outline" size={64} color="#6c757d" />
        <Text style={styles.emptyTitle}>No Classes Found</Text>
        <Text style={styles.emptyMessage}>You have not registered for any upcoming classes.</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push('/classes' as any)}
        >
          <Text style={styles.browseButtonText}>Browse Classes</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Group registrations by confirmed vs waitlisted
  const confirmed = registrations.filter(item => item.registration.status === 'confirmed');
  const waitlisted = registrations.filter(item => item.registration.status === 'waitlisted');
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: 'My Classes' }} />
      
      {/* Confirmed Registrations */}
      {confirmed.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Classes</Text>
          
          {confirmed.map(({ registration, fitnessClass }) => (
            <View key={registration.id} style={styles.classCard}>
              <TouchableOpacity 
                style={styles.classContent}
                onPress={() => router.push(`/class/${fitnessClass.id}` as any)}
              >
                <View style={styles.classHeader}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(fitnessClass.category)}</Text>
                  <Text style={styles.className}>{fitnessClass.title}</Text>
                </View>
                
                <View style={styles.classDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#6c757d" />
                    <Text style={styles.detailText}>{formatDateTime(fitnessClass.startTime)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#6c757d" />
                    <Text style={styles.detailText}>{fitnessClass.location}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#6c757d" />
                    <Text style={styles.detailText}>{fitnessClass.instructorName}</Text>
                  </View>
                </View>
                
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>CONFIRMED</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  cancelingId === fitnessClass.id && styles.cancelingButton
                ]}
                onPress={() => handleCancel(fitnessClass.id, fitnessClass.title)}
                disabled={cancelingId === fitnessClass.id}
              >
                {cancelingId === fitnessClass.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.cancelText}>Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      {/* Waitlisted Registrations */}
      {waitlisted.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waitlisted Classes</Text>
          
          {waitlisted.map(({ registration, fitnessClass }) => (
            <View key={registration.id} style={styles.classCard}>
              <TouchableOpacity 
                style={styles.classContent}
                onPress={() => router.push(`/class/${fitnessClass.id}` as any)}
              >
                <View style={styles.classHeader}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(fitnessClass.category)}</Text>
                  <Text style={styles.className}>{fitnessClass.title}</Text>
                </View>
                
                <View style={styles.classDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#6c757d" />
                    <Text style={styles.detailText}>{formatDateTime(fitnessClass.startTime)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#6c757d" />
                    <Text style={styles.detailText}>{fitnessClass.location}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color="#6c757d" />
                    <Text style={styles.detailText}>{fitnessClass.instructorName}</Text>
                  </View>
                </View>
                
                <View style={styles.waitlistBadge}>
                  <Text style={styles.waitlistText}>
                    WAITLIST #{registration.position}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  cancelingId === fitnessClass.id && styles.cancelingButton
                ]}
                onPress={() => handleCancel(fitnessClass.id, fitnessClass.title)}
                disabled={cancelingId === fitnessClass.id}
              >
                {cancelingId === fitnessClass.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.cancelText}>Leave Waitlist</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      
      <TouchableOpacity
        style={styles.browseMoreButton}
        onPress={() => router.push('/classes' as any)}
      >
        <Ionicons name="search" size={18} color="#fff" />
        <Text style={styles.browseMoreText}>Browse More Classes</Text>
      </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#343a40',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 24,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  signInTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#343a40',
  },
  signInMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 24,
  },
  signInButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  browseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#343a40',
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  classContent: {
    padding: 16,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  classDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waitlistBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffc107',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  waitlistText: {
    color: '#212529',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    alignItems: 'center',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cancelingButton: {
    backgroundColor: '#6c757d',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  browseMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  browseMoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});