import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Friend {
  id: string;
  name: string;
  email: string;
  totalSessions?: number;
}

export default function FriendsScreen() {
  const [user, setUser] = useState<{ uid: string; displayName?: string; email?: string } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Load user from session
    AsyncStorage.getItem('auth:session').then((sessionStr) => {
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        setUser({ 
          uid: session.uid, 
          displayName: session.displayName,
          email: session.email 
        });
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadFriends();
    }
  }, [user?.uid]);

  async function loadFriends() {
    if (!user?.uid || !db) return;
    
    try {
      // Get friends from Firestore (this would need a friends collection)
      // For now, no dummy data - shows empty state
      setFriends([]);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }

  async function handleAddFriend() {
    if (!searchEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (searchEmail.toLowerCase() === user?.email?.toLowerCase()) {
      Alert.alert('Error', 'You cannot add yourself as a friend');
      return;
    }

    setSearching(true);
    try {
      // In a real app, you'd search for the user in Firestore
      // and add them to a friends collection
      Alert.alert('Coming Soon', 'Friend requests will be available in the next update!');
      setSearchEmail('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add friend');
    } finally {
      setSearching(false);
    }
  }

  if (!user?.uid) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>Connect with Friends</Text>
          <Text style={styles.emptyText}>
            Sign in to add friends and see their workout progress!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <Text style={styles.headerSubtitle}>
          Stay motivated together
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
          {/* Add Friend Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Friends</Text>
            <View style={styles.addFriendContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter email address"
                value={searchEmail}
                onChangeText={setSearchEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddFriend}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.addButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Friends List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              My Friends ({friends.length})
            </Text>
            
            {friends.length === 0 ? (
              <View style={styles.noFriendsCard}>
                <Text style={styles.noFriendsIcon}>🤝</Text>
                <Text style={styles.noFriendsText}>
                  No friends yet. Add some to see their progress!
                </Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.id} style={styles.friendCard}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {friend.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendStats}>
                      {friend.totalSessions || 0} sessions
                    </Text>
                  </View>
                  <View style={styles.friendBadge}>
                    <Text style={styles.friendBadgeIcon}>🏆</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Leaderboard */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week's Leaderboard</Text>
            
            <View style={styles.leaderboardCard}>
              <View style={styles.noFriendsCard}>
                <Text style={styles.noFriendsIcon}>🏆</Text>
                <Text style={styles.noFriendsText}>
                  Add friends to see weekly rankings!
                </Text>
              </View>
            </View>
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
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  addFriendContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  friendStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  friendBadge: {
    marginLeft: 8,
  },
  friendBadgeIcon: {
    fontSize: 24,
  },
  noFriendsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noFriendsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noFriendsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  leaderboardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leaderboardRank: {
    fontSize: 24,
    width: 40,
  },
  leaderboardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  leaderboardSessions: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
