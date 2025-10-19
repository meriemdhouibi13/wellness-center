import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
];

/*
  CoachTab is temporarily disabled because this Tab is being replaced.
  Keeping the file here so it can be restored or used as reference.

export default function CoachTab() {
  const router = useRouter();

  const openRoutines = (group: string) => {
    router.push(`/coach/${group.toLowerCase()}` as any);
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title} lightColor="#11181C" darkColor="#11181C">
        Coach & Routines
      </ThemedText>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {MUSCLE_GROUPS.map((g) => (
          <TouchableOpacity key={g} style={styles.card} onPress={() => openRoutines(g)}>
            <ThemedText type="defaultSemiBold" style={styles.groupName} lightColor="#11181C" darkColor="#11181C">
              {g}
            </ThemedText>
            <ThemedText style={styles.levels} lightColor="#7f8c8d" darkColor="#7f8c8d">
              Beginner · Intermediate · Advanced
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
*/

// Temporary stub export to disable the tab while keeping this file in the repo.
export default function CoachTabDisabled() {
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    color: '#11181C',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  groupName: {
    fontSize: 20,
    marginBottom: 4,
  },
  levels: {
    fontSize: 14,
  },
});
