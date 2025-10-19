import { ThemedText } from '@/components/themed-text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const ROUTINES: Record<string, Record<string, string[]>> = {
  chest: {
    beginner: ['Push-ups (knees)', 'Dumbbell Bench Press - light', 'Incline Push-ups'],
    intermediate: ['Bench Press', 'Incline Dumbbell Press', 'Cable Flys'],
    advanced: ['Weighted Dips', 'Barbell Bench Press - heavy', 'Decline Press'],
  },
  back: {
    beginner: ['Bodyweight Rows', 'Lat Pulldown light', 'Seated Row light'],
    intermediate: ['Pull-ups', 'Bent-over Row', 'One-arm Dumbbell Row'],
    advanced: ['Weighted Pull-ups', 'T-bar Row', 'Deadlift variations'],
  },
  legs: {
    beginner: ['Bodyweight Squats', 'Walking Lunges', 'Leg Press light'],
    intermediate: ['Barbell Back Squat', 'Romanian Deadlift', 'Bulgarian Split Squat'],
    advanced: ['Front Squat', 'Pistol Squats', 'Heavy Deadlifts'],
  },
  shoulders: {
    beginner: ['Seated Dumbbell Press light', 'Lateral Raise light', 'Face Pulls'],
    intermediate: ['Overhead Press', 'Arnold Press', 'Dumbbell Lateral Raise'],
    advanced: ['Push Press', 'Handstand Push-ups', 'Heavy Overhead Press'],
  },
  arms: {
    beginner: ['Bicep Curls light', 'Tricep Pushdown light', 'Hammer Curls'],
    intermediate: ['Barbell Curl', 'Skull Crushers', 'Preacher Curl'],
    advanced: ['Weighted Dips', '21s', 'EZ-bar heavy curls'],
  },
  core: {
    beginner: ['Plank 30s', 'Dead Bug', 'Glute Bridge'],
    intermediate: ['Hanging Knee Raise', 'Russian Twist', 'Weighted Plank'],
    advanced: ['Hanging Leg Raise', 'Dragon Flag', 'Ab Wheel Rollouts'],
  },
};

export default function GroupRoutines() {
  const { group } = useLocalSearchParams();
  const router = useRouter();
  const name = Array.isArray(group) ? group[0] : group ?? 'unknown';
  const routines = ROUTINES[name] ?? ROUTINES['chest'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.back} lightColor="#11181C" darkColor="#11181C">←</ThemedText>
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold" style={styles.headerTitle} lightColor="#11181C" darkColor="#11181C">
          {name.toUpperCase()} Routines
        </ThemedText>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
          <View key={level} style={styles.section}>
            <ThemedText type="defaultSemiBold" style={styles.levelTitle} lightColor="#11181C" darkColor="#11181C">
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </ThemedText>
            {routines[level].map((ex) => (
              <View key={ex} style={styles.exerciseRow}>
                <ThemedText style={styles.bullet} lightColor="#11181C" darkColor="#11181C">•</ThemedText>
                <ThemedText lightColor="#11181C" darkColor="#11181C">{ex}</ThemedText>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  back: { 
    fontSize: 24,
    color: '#11181C',
  },
  headerTitle: {
    fontSize: 18,
  },
  content: { padding: 16, paddingBottom: 40 },
  section: { 
    marginBottom: 20, 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  levelTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  bullet: { marginRight: 8 },
});
