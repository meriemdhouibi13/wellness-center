import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { seedClasses, clearDemoData } from '@/services/seed';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminSeedScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const insets = useSafeAreaInsets();

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
    
    setIsLoading(true);
    setResult('');
    
    try {
      const count = await seedClasses();
      setResult(`Successfully generated ${count} sample classes!`);
      Alert.alert('Success', `Generated ${count} sample classes for the next 7 days.`);
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
            style={[styles.button, styles.primaryButton]}
            onPress={handleGenerateSampleClasses}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Generate Sample Classes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
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
                        Alert.alert('Success', 'All demo data has been removed');
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
            <Text style={styles.buttonText}>Clear Demo Data</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}

        {result !== '' && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultText}>{result}</Text>
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
  resultText: {
    fontSize: 14,
    color: '#333',
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
});