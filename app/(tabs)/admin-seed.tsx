import { clearDemoData, seedDemoData } from '@/services/seed';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Helper function to determine icon for class type
const getIconForClass = (className: string) => {
  const name = className.toLowerCase();
  if (name.includes('yoga')) return 'body-outline';
  if (name.includes('meditation')) return 'medical-outline';
  if (name.includes('hiit') || name.includes('cardio')) return 'flame-outline';
  if (name.includes('strength') || name.includes('crossfit')) return 'barbell-outline';
  if (name.includes('cycling') || name.includes('spin')) return 'bicycle-outline';
  if (name.includes('dance') || name.includes('zumba')) return 'musical-notes-outline';
  if (name.includes('pilates') || name.includes('barre')) return 'fitness-outline';
  if (name.includes('stretch')) return 'expand-outline';
  if (name.includes('kickbox')) return 'hand-right-outline';
  return 'calendar-outline';
};

export default function AdminSeedScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [generatedClasses, setGeneratedClasses] = useState<string[]>([]);
  const [lastOperation, setLastOperation] = useState<'generate' | 'clear' | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const sessionStr = await AsyncStorage.getItem('auth:session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          setUser({ uid: session.uid });
        }
      } catch (error) {
        console.log('Error loading user:', error);
      }
    };
    
    loadUser();
  }, []);

  const handleGenerateSampleClasses = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to perform this action');
      return;
    }
    
    // Reset animation
    fadeAnim.setValue(0);
    setIsLoading(true);
    setResult('');
    setGeneratedClasses([]);
    
    try {
      const sampleClassTitles = [
        'Morning Yoga Flow', 'HIIT Challenge', 'Evening Meditation', 'Power Cycling', 
        'Strength Training', 'Pilates Core', 'Zumba', 'Spin Class', 'Meditation',
        'Kickboxing', 'Barre Fitness', 'Gentle Yoga', 'CrossFit', 'Dance Cardio', 'Stretch & Recover'
      ];
      
  const count = await seedDemoData();
  setResult(`Seed completed. (${count} items created)`);
  // classes feature removed; show generated sample titles as informational only
  setGeneratedClasses(sampleClassTitles);
  setLastOperation('generate');
      
      // Animate the generated classes container
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
      
      Alert.alert('Success', `Seed completed. (${count} items created)`);
    } catch (error: any) {
      console.error('Error generating classes:', error);
      setResult(`Error: ${error.message}`);
      Alert.alert('Error', `Failed to generate sample classes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { paddingTop: insets.top }]} 
      contentContainerStyle={styles.contentContainer}
    >
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Admin: Database Seed'
      }} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Management</Text>
        <Text style={styles.description}>
          Use these tools to populate your database with sample data for testing and demo purposes.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button, 
              styles.primaryButton,
              isLoading && { opacity: 0.7 }
            ]}
            onPress={handleGenerateSampleClasses}
            disabled={isLoading}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.buttonText}>Generate Sample Classes</Text>
              {isLoading && lastOperation === 'generate' && (
                <ActivityIndicator size="small" color="white" style={{marginLeft: 8}} />
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button, 
              styles.dangerButton,
              isLoading && { opacity: 0.7 }
            ]}
            onPress={() => {
              Alert.alert(
                'Clear Demo Data',
                'This will remove all sample data from the database. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Yes, Clear Data', 
                    style: 'destructive',
                    onPress: async () => {
                      setIsLoading(true);
                      try {
                        await clearDemoData();
                        setResult('Successfully cleared all demo data');
                        setGeneratedClasses([]);
                        setLastOperation('clear');
                        Alert.alert('Success', 'All demo data has been removed from the database');
                      } catch (error: any) {
                        setResult(`Error: ${error.message}`);
                        Alert.alert('Error', `Failed to clear data: ${error.message}`);
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }
                ]
              );
            }}
            disabled={isLoading}
          >
            <View style={styles.buttonInner}>
              <Text style={styles.buttonText}>Clear Demo Data</Text>
              {isLoading && lastOperation === 'clear' && (
                <ActivityIndicator size="small" color="white" style={{marginLeft: 8}} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>
              {lastOperation === 'generate' ? 'Generating sample classes...' : 
               lastOperation === 'clear' ? 'Clearing demo data...' : 'Processing...'}
            </Text>
          </View>
        )}

        {result !== '' && (
          <View style={styles.resultContainer}>
            <View style={styles.resultRow}>
              {!result.includes('Error') && (
                <Ionicons name="checkmark-circle" size={20} color="#28a745" style={styles.resultIcon} />
              )}
              {result.includes('Error') && (
                <Ionicons name="alert-circle" size={20} color="#dc3545" style={styles.resultIcon} />
              )}
              <Text style={[
                styles.resultText, 
                result.includes('Error') ? styles.errorText : styles.successText
              ]}>
                {result}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>About Test Data</Text>
          <Text style={styles.infoText}>
            The sample classes include various fitness activities spread across the next 7 days,
            including yoga, HIIT, cycling, strength training, meditation, and dance classes.
          </Text>
          <Text style={styles.infoText}>
            Classes have different instructors, capacity limits, and some include waitlist functionality.
          </Text>
        </View>
        
        {generatedClasses.length > 0 && (
          <Animated.View style={[
            styles.classesContainer,
            { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })}] }
          ]}>
            <Text style={styles.classesTitle}>Generated Classes</Text>
            <Text style={styles.classesSubtitle}>The following classes were created successfully:</Text>
            
            {generatedClasses.map((className, index) => (
              <View key={index} style={styles.classItem}>
                <View style={styles.classItemHeader}>
                  <Ionicons 
                    name={getIconForClass(className) as any} 
                    size={18} 
                    color="#28a745" 
                    style={styles.classIcon}
                  />
                  <Text style={styles.classItemText}>{className}</Text>
                </View>
                <Text style={styles.classItemDate}>
                  Available for the next 7 days at various times
                </Text>
              </View>
            ))}
            
            {/* Classes tab removed — navigation to Classes is disabled */}
          </Animated.View>
        )}
      </View>
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
    paddingBottom: 60,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonContainer: {
    marginVertical: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#0066cc',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  resultContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f1f1f1',
    borderRadius: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    marginRight: 8,
  },
  resultText: {
    fontSize: 14,
    flex: 1,
  },
  successText: {
    color: '#28a745',
  },
  errorText: {
    color: '#dc3545',
  },
  infoContainer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#e6f7ff',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0066cc',
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 8,
    lineHeight: 20,
  },
  classesContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  classesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#28a745',
  },
  classesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  classItem: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  classItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  classIcon: {
    marginRight: 8,
  },
  classItemText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  classItemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    marginLeft: 26,
  },
  viewClassesButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  viewClassesButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});