import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { FitnessClass, ClassCategory } from '@/services/types';
import { getUpcomingClasses, getClassesByCategory, getClassesByDate } from '@/services/classes';
import { useAuth } from '@/contexts/AuthContext';

// Categories with icons for filtering
const CATEGORIES: { label: string; value: ClassCategory; icon: string }[] = [
  { label: 'All', value: 'other', icon: '🗓️' },
  { label: 'Yoga', value: 'yoga', icon: '🧘' },
  { label: 'Cardio', value: 'cardio', icon: '🏃‍♀️' },
  { label: 'Strength', value: 'strength', icon: '🏋️' },
  { label: 'HIIT', value: 'hiit', icon: '⚡' },
  { label: 'Pilates', value: 'pilates', icon: '💫' },
  { label: 'Dance', value: 'dance', icon: '💃' },
  { label: 'Meditation', value: 'meditation', icon: '🧠' },
  { label: 'Cycling', value: 'cycling', icon: '🚴' },
];

export default function ClassesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<ClassCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'upcoming' | 'calendar'>('upcoming');
  
  // Format selected date for display
  const formattedDate = useMemo(() => {
    return format(selectedDate, 'EEEE, MMMM d, yyyy');
  }, [selectedDate]);
  
  // Fetch classes based on filters
  useEffect(() => {
    async function fetchClasses() {
      setLoading(true);
      try {
        let fetchedClasses: FitnessClass[] = [];
        
        if (viewMode === 'upcoming') {
          if (selectedCategory === 'all') {
            fetchedClasses = await getUpcomingClasses();
          } else {
            fetchedClasses = await getClassesByCategory(selectedCategory);
          }
        } else {
          fetchedClasses = await getClassesByDate(selectedDate);
          
          // Apply category filter if not "all"
          if (selectedCategory !== 'all') {
            fetchedClasses = fetchedClasses.filter(
              c => c.category === selectedCategory
            );
          }
        }
        
        setClasses(fetchedClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchClasses();
  }, [selectedDate, selectedCategory, viewMode]);
  
  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setViewMode('calendar');
    }
  };
  
  // Group classes by time for better organization
  const classesByTime = useMemo(() => {
    const grouped: { [time: string]: FitnessClass[] } = {};
    
    classes.forEach(fitnessClass => {
      const startTime = fitnessClass.startTime.toDate();
      const timeKey = format(startTime, 'h:mm a');
      
      if (!grouped[timeKey]) {
        grouped[timeKey] = [];
      }
      
      grouped[timeKey].push(fitnessClass);
    });
    
    return Object.entries(grouped).sort((a, b) => {
      const timeA = new Date(`01/01/2000 ${a[0]}`).getTime();
      const timeB = new Date(`01/01/2000 ${b[0]}`).getTime();
      return timeA - timeB;
    });
  }, [classes]);
  
  // Render a class card
  const renderClassCard = (fitnessClass: FitnessClass) => {
    // Get appropriate icon for category
    const categoryInfo = CATEGORIES.find(c => c.value === fitnessClass.category) || CATEGORIES[0];
    
    // Format duration
    const durationText = fitnessClass.duration >= 60 
      ? `${Math.floor(fitnessClass.duration / 60)}h ${fitnessClass.duration % 60}m`
      : `${fitnessClass.duration}m`;
      
    // Check if class is full
    const isFull = fitnessClass.currentRegistrations >= fitnessClass.capacity;
    
    return (
      <TouchableOpacity
        key={fitnessClass.id}
        style={styles.classCard}
        onPress={() => router.push(`/class/${fitnessClass.id}` as any)}
      >
        <View style={styles.classHeader}>
          <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
          <Text style={styles.classTitle}>{fitnessClass.title}</Text>
          
          {isFull && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullText}>FULL</Text>
            </View>
          )}
          
          {fitnessClass.waitlistEnabled && isFull && (
            <View style={styles.waitlistBadge}>
              <Text style={styles.waitlistText}>Waitlist Available</Text>
            </View>
          )}
        </View>
        
        <View style={styles.classDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{durationText}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {fitnessClass.location}{fitnessClass.roomNumber ? `, Room ${fitnessClass.roomNumber}` : ''}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{fitnessClass.instructorName}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {fitnessClass.currentRegistrations}/{fitnessClass.capacity} registered
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="fitness-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{fitnessClass.level}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Mode Toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            viewMode === 'upcoming' ? styles.modeButtonActive : {}
          ]}
          onPress={() => setViewMode('upcoming')}
        >
          <Text 
            style={[
              styles.modeButtonText,
              viewMode === 'upcoming' ? styles.modeButtonTextActive : {}
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.modeButton,
            viewMode === 'calendar' ? styles.modeButtonActive : {}
          ]}
          onPress={() => setViewMode('calendar')}
        >
          <Text
            style={[
              styles.modeButtonText,
              viewMode === 'calendar' ? styles.modeButtonTextActive : {}
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Date Selector (for Calendar view) */}
      {viewMode === 'calendar' && (
        <View style={styles.dateSelector}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Ionicons name="chevron-down" size={20} color="#007AFF" />
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </View>
      )}
      
      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' ? styles.categoryButtonActive : {}
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={styles.categoryIcon}>🗓️</Text>
          <Text
            style={[
              styles.categoryText,
              selectedCategory === 'all' ? styles.categoryTextActive : {}
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        {CATEGORIES.slice(1).map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryButton,
              selectedCategory === category.value ? styles.categoryButtonActive : {}
            ]}
            onPress={() => setSelectedCategory(category.value)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.value ? styles.categoryTextActive : {}
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* My Classes Button */}
      {user && (
        <TouchableOpacity
          style={styles.myClassesButton}
          onPress={() => router.push('/my-classes' as any)}
        >
          <Ionicons name="bookmark" size={18} color="#fff" />
          <Text style={styles.myClassesButtonText}>My Classes</Text>
        </TouchableOpacity>
      )}
      
      {/* Class List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading classes...</Text>
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Classes Found</Text>
          <Text style={styles.emptyMessage}>
            {viewMode === 'upcoming' 
              ? 'There are no upcoming classes matching your filters.'
              : `No classes scheduled for ${formattedDate}.`
            }
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.classList}>
          {classesByTime.map(([timeSlot, classesInSlot]) => (
            <View key={timeSlot} style={styles.timeSlot}>
              <Text style={styles.timeSlotText}>{timeSlot}</Text>
              {classesInSlot.map(renderClassCard)}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 60,
  },
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6c757d',
  },
  modeButtonTextActive: {
    color: '#007AFF',
  },
  dateSelector: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#343a40',
  },
  categoryScroll: {
    maxHeight: 90,
  },
  categoryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryButton: {
    alignItems: 'center',
    marginHorizontal: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#495057',
  },
  categoryTextActive: {
    color: '#fff',
  },
  myClassesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'center',
  },
  myClassesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  },
  classList: {
    flex: 1,
  },
  timeSlot: {
    marginBottom: 16,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#6c757d',
    backgroundColor: '#f1f3f5',
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
    marginLeft: 10,
  },
  fullBadge: {
    backgroundColor: '#dc3545',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fullText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  waitlistBadge: {
    backgroundColor: '#ffc107',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  waitlistText: {
    color: '#212529',
    fontSize: 10,
    fontWeight: 'bold',
  },
  classDetails: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
  },
});