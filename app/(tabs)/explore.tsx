import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listSessions } from '@/services/sessions';

export default function StatsScreen() {
  const [user, setUser] = useState<{ uid: string; displayName?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [thisWeekSessions, setThisWeekSessions] = useState(0);
  const [thisWeekMinutes, setThisWeekMinutes] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Load user from session
    AsyncStorage.getItem('auth:session').then((sessionStr) => {
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        setUser({ uid: session.uid, displayName: session.displayName });
      }
    });
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    loadStats();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user?.uid]);

  async function loadStats() {
    if (!user?.uid) return;
    
    try {
      const sessions = await listSessions(user.uid, 200);
      
      // Total stats
      setTotalSessions(sessions.length);
      const minutes = sessions.reduce((acc, s) => 
        acc + (s.durationMinutes ?? (s.endTime ? Math.max(1, Math.round((s.endTime - s.startTime)/60000)) : 0)), 
        0
      );
      setTotalMinutes(minutes);
      setLastDate(sessions[0] ? new Date(sessions[0].startTime).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }) : null);
      
      // This week stats
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weekSessions = sessions.filter(s => s.startTime >= weekAgo);
      setThisWeekSessions(weekSessions.length);
      const weekMinutes = weekSessions.reduce((acc, s) => 
        acc + (s.durationMinutes ?? (s.endTime ? Math.max(1, Math.round((s.endTime - s.startTime)/60000)) : 0)), 
        0
      );
      setThisWeekMinutes(weekMinutes);
      
      // Calculate streak (consecutive days with sessions)
      const uniqueDays = new Set(sessions.map(s => new Date(s.startTime).toDateString()));
      let streak = 0;
      let checkDate = new Date();
      while (uniqueDays.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      setCurrentStreak(streak);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  }

  if (!user?.uid) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Track Your Progress</Text>
          <Text style={styles.emptyText}>Sign in to view your personal statistics and workout history.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Stats</Text>
        <Text style={styles.headerSubtitle}>
          {user.displayName ? `${user.displayName}'s Progress` : 'Your Progress'}
        </Text>
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
          {/* Streak Card */}
          <View style={styles.streakCard}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>

          {/* This Week Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💪</Text>
              <Text style={styles.statValue}>{thisWeekSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>{thisWeekMinutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>

          {/* All Time Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Time</Text>
          </View>
          
          <View style={styles.allTimeCard}>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Total Sessions</Text>
              <Text style={styles.statRowValue}>{totalSessions}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Total Minutes</Text>
              <Text style={styles.statRowValue}>{totalMinutes}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Last Workout</Text>
              <Text style={styles.statRowValue}>{lastDate ?? 'Never'}</Text>
            </View>
          </View>

          {/* Achievement Badges */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          
          <View style={styles.badgesContainer}>
            {totalSessions >= 1 && (
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>🎯</Text>
                <Text style={styles.badgeText}>First Workout</Text>
              </View>
            )}
            {totalSessions >= 10 && (
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>⭐</Text>
                <Text style={styles.badgeText}>10 Sessions</Text>
              </View>
            )}
            {currentStreak >= 3 && (
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>🔥</Text>
                <Text style={styles.badgeText}>3 Day Streak</Text>
              </View>
            )}
            {totalMinutes >= 60 && (
              <View style={styles.badge}>
                <Text style={styles.badgeIcon}>💯</Text>
                <Text style={styles.badgeText}>1 Hour Total</Text>
              </View>
            )}
          </View>
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
    paddingVertical: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#11181C',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#11181C',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  streakCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#ff6b35',
  },
  streakIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#11181C',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0a7ea4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  allTimeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statRowLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#ffd700',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#11181C',
    textAlign: 'center',
  },
});
