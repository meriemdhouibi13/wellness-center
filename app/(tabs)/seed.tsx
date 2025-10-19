import {
  addCommentToProgressUpdate,
  getFriendRequests,
  getFriends,
  getFriendsActivities,
  getFriendsProgressUpdates,
  getFriendsWorkoutTemplates,
  getUserProgressUpdates,
  getUserWorkoutTemplates,
  getWeeklyLeaderboard,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
  toggleLikeProgressUpdate,
} from '@/services/friends';
import type {
  Activity,
  Friend,
  FriendRequest,
  LeaderboardEntry,
  ProgressUpdate,
  WorkoutTemplate,
} from '@/services/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FriendsScreen() {
  const [user, setUser] = useState<{ uid: string; displayName?: string; email?: string } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userWorkoutTemplates, setUserWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [friendsWorkoutTemplates, setFriendsWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [userProgressUpdates, setUserProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [friendsProgressUpdates, setFriendsProgressUpdates] = useState<ProgressUpdate[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'workouts' | 'progress'>('friends');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedProgressUpdate, setSelectedProgressUpdate] = useState<ProgressUpdate | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const router = useRouter();
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
      loadAllData();
    }
  }, [user?.uid]);

  // Auto-refresh when screen comes into focus
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.uid) {
        loadAllData();
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [user?.uid]);

  async function loadAllData() {
    if (!user?.uid) return;
    
    try {
      const [
        friendsData, 
        requestsData, 
        leaderboardData, 
        activitiesData, 
        userTemplatesData, 
        friendsTemplatesData,
        userProgressData,
        friendsProgressData
      ] = await Promise.all([
        getFriends(user.uid),
        getFriendRequests(user.uid),
        getWeeklyLeaderboard(user.uid),
        getFriendsActivities(user.uid, 10),
        getUserWorkoutTemplates(user.uid),
        getFriendsWorkoutTemplates(user.uid),
        getUserProgressUpdates(user.uid),
        getFriendsProgressUpdates(user.uid, 10),
      ]);
      
      setFriends(friendsData);
      setFriendRequests(requestsData);
      setLeaderboard(leaderboardData);
      setActivities(activitiesData);
      setUserWorkoutTemplates(userTemplatesData);
      setFriendsWorkoutTemplates(friendsTemplatesData);
      setUserProgressUpdates(userProgressData);
      setFriendsProgressUpdates(friendsProgressData);
    } catch (error) {
      console.error('Error loading friends data:', error);
      Alert.alert('Error', 'Failed to load friends data');
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
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
      await sendFriendRequest(
        user.uid,
        user.displayName || 'Unknown User',
        user.email || '',
        searchEmail.trim()
      );
      Alert.alert('Success', `Friend request sent to ${searchEmail}`);
      setSearchEmail('');
    } catch (error: any) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', error.message || 'Failed to send friend request');
    } finally {
      setSearching(false);
    }
  }

  async function handleRespondToRequest(fromUserId: string, accept: boolean) {
    if (!user?.uid) return;
    
    try {
      await respondToFriendRequest(fromUserId, accept, user.uid);
      Alert.alert('Success', accept ? 'Friend request accepted!' : 'Friend request declined');
      await loadAllData();
    } catch (error: any) {
      console.error('Error responding to friend request:', error);
      Alert.alert('Error', error.message || 'Failed to respond to friend request');
    }
  }

  async function handleRemoveFriend(friendId: string, friendName: string) {
    if (!user?.uid) return;
    
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(user.uid, friendId);
              Alert.alert('Success', `${friendName} has been removed from your friends`);
              await loadAllData();
            } catch (error: any) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', error.message || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  }

  function formatActivityTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  function getActivityIcon(type: string): string {
    switch (type) {
      case 'workout_completed': return '💪';
      case 'new_friend': return '👋';
      case 'streak_milestone': return '🔥';
      case 'achievement': return '🏆';
      default: return '📝';
    }
  }
  
  // Handle viewing workout template details
  function handleViewTemplate(template: WorkoutTemplate) {
    // This would typically navigate to a detailed view
    Alert.alert(
      template.title,
      `${template.description}\n\nDifficulty: ${template.difficulty}\nEstimated Time: ${template.estimatedDuration} min\n\nExercises: ${template.exercises.length}`,
      [
        { text: 'Close', style: 'cancel' },
        { 
          text: 'Use Template', 
          onPress: () => {
            // Here you would navigate to workout screen with this template
            Alert.alert('Success', 'Template added to your workout plan!');
          } 
        }
      ]
    );
  }
  
  // Handle toggling like on a progress update
  async function handleLikeProgress(updateId: string) {
    if (!user?.uid) return;
    
    try {
      await toggleLikeProgressUpdate(updateId, user.uid);
      await loadAllData(); // Refresh to get updated data
    } catch (error) {
      console.error('Error liking update:', error);
    }
  }
  
  // Handle opening the comment modal for a progress update
  function handleOpenComments(update: ProgressUpdate) {
    setSelectedProgressUpdate(update);
    setCommentModalVisible(true);
  }
  
  // Handle adding a comment to a progress update
  async function handleAddComment() {
    if (!user?.uid || !selectedProgressUpdate || !commentText.trim()) return;
    
    try {
      await addCommentToProgressUpdate(
        selectedProgressUpdate.id,
        user.uid,
        user.displayName || 'Unknown User',
        commentText.trim()
      );
      
      // Clear and close
      setCommentText('');
      setCommentModalVisible(false);
      await loadAllData(); // Refresh to get updated comments
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
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

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'friends' && styles.activeTabButton]} 
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'workouts' && styles.activeTabButton]} 
          onPress={() => setActiveTab('workouts')}
        >
          <Text style={[styles.tabText, activeTab === 'workouts' && styles.activeTabText]}>
            Workouts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'progress' && styles.activeTabButton]} 
          onPress={() => setActiveTab('progress')}
        >
          <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>
            Progress
          </Text>
        </TouchableOpacity>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0a7ea4']} />
          }
        >
          {/* Content based on active tab */}
          {activeTab === 'friends' && (
            <>
              {/* Friend Requests Section */}
              {friendRequests.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Friend Requests ({friendRequests.length})</Text>
                  {friendRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                      {request.fromUserName.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.friendInfo}>
                    <Text style={styles.friendName}>{request.fromUserName}</Text>
                    <Text style={styles.friendEmail}>{request.fromUserEmail}</Text>
                  </View>
                  <View style={styles.requestButtons}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleRespondToRequest(request.fromUserId, true)}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => handleRespondToRequest(request.fromUserId, false)}
                    >
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

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
                      {friend.totalSessions || 0} sessions • {friend.currentStreak || 0} day streak 🔥
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeFriendButton}
                    onPress={() => handleRemoveFriend(friend.id, friend.name)}
                  >
                    <Text style={styles.removeFriendButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Leaderboard */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Week's Leaderboard</Text>
            
            {leaderboard.length === 0 ? (
              <View style={styles.leaderboardCard}>
                <View style={styles.noFriendsCard}>
                  <Text style={styles.noFriendsIcon}>🏆</Text>
                  <Text style={styles.noFriendsText}>
                    Add friends to see weekly rankings!
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.leaderboardCard}>
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = entry.userId === user?.uid;
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
                  
                  return (
                    <View
                      key={entry.userId}
                      style={[
                        styles.leaderboardEntry,
                        isCurrentUser && styles.currentUserEntry,
                      ]}
                    >
                      <View style={styles.leaderboardRank}>
                        {medal ? (
                          <Text style={styles.medal}>{medal}</Text>
                        ) : (
                          <Text style={styles.rankNumber}>{entry.rank}</Text>
                        )}
                      </View>
                      <View style={styles.leaderboardInfo}>
                        <Text style={[
                          styles.leaderboardName,
                          isCurrentUser && styles.currentUserName,
                        ]}>
                          {entry.userName}{isCurrentUser ? ' (You)' : ''}
                        </Text>
                        <Text style={styles.leaderboardStats}>
                          {entry.totalSessions} sessions • {Math.round(entry.totalMinutes)} mins
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Activity Feed */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            
            {activities.length === 0 ? (
              <View style={styles.noFriendsCard}>
                <Text style={styles.noFriendsIcon}>📝</Text>
                <Text style={styles.noFriendsText}>
                  No recent activities from friends
                </Text>
              </View>
            ) : (
              activities.map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityText}>
                      <Text style={styles.activityUserName}>{activity.userName}</Text>
                      {' '}{activity.description}
                    </Text>
                    <Text style={styles.activityTime}>
                      {formatActivityTime(activity.createdAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
            </>
          )}

          {/* Workout Templates Tab */}
          {activeTab === 'workouts' && (
            <>
              {/* My Workout Templates */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Workout Templates</Text>
                {userWorkoutTemplates.length === 0 ? (
                  <View style={styles.noFriendsCard}>
                    <Text style={styles.noFriendsIcon}>💪</Text>
                    <Text style={styles.noFriendsText}>
                      You haven't created any workout templates yet.
                    </Text>
                  </View>
                ) : (
                  userWorkoutTemplates.map(template => (
                    <TouchableOpacity
                      key={template.id}
                      style={styles.workoutCard}
                      onPress={() => handleViewTemplate(template)}
                    >
                      <View style={styles.workoutHeader}>
                        <Text style={styles.workoutTitle}>{template.title}</Text>
                        <Text style={styles.workoutDifficulty}>{template.difficulty}</Text>
                      </View>
                      <Text style={styles.workoutDescription} numberOfLines={2}>
                        {template.description}
                      </Text>
                      <View style={styles.workoutFooter}>
                        <Text style={styles.workoutExercises}>
                          {template.exercises.length} exercises • {template.estimatedDuration} min
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
                
                <TouchableOpacity style={styles.createButton} onPress={() => Alert.alert('Create Template', 'Create a new workout template to share with friends')}>
                  <Text style={styles.createButtonText}>Create New Template</Text>
                </TouchableOpacity>
              </View>
              
              {/* Friends' Workout Templates */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Friends' Templates</Text>
                {friendsWorkoutTemplates.length === 0 ? (
                  <View style={styles.noFriendsCard}>
                    <Text style={styles.noFriendsIcon}>👥</Text>
                    <Text style={styles.noFriendsText}>
                      No shared templates from friends yet.
                    </Text>
                  </View>
                ) : (
                  friendsWorkoutTemplates.map(template => (
                    <TouchableOpacity
                      key={template.id}
                      style={styles.workoutCard}
                      onPress={() => handleViewTemplate(template)}
                    >
                      <View style={styles.workoutHeader}>
                        <Text style={styles.workoutTitle}>{template.title}</Text>
                        <Text style={styles.workoutCreator}>By {template.userName}</Text>
                      </View>
                      <Text style={styles.workoutDescription} numberOfLines={2}>
                        {template.description}
                      </Text>
                      <View style={styles.workoutFooter}>
                        <Text style={styles.workoutExercises}>
                          {template.exercises.length} exercises • {template.estimatedDuration} min
                        </Text>
                        <Text style={styles.workoutLikes}>❤️ {template.likes}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          )}

          {/* Progress Sharing Tab */}
          {activeTab === 'progress' && (
            <>
              {/* Share Progress */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Share Progress</Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => Alert.alert('Share Progress', 'Share your fitness progress with friends')}
                >
                  <Text style={styles.createButtonText}>Share New Update</Text>
                </TouchableOpacity>
              </View>

              {/* My Progress Updates */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Progress</Text>
                {userProgressUpdates.length === 0 ? (
                  <View style={styles.noFriendsCard}>
                    <Text style={styles.noFriendsIcon}>📈</Text>
                    <Text style={styles.noFriendsText}>
                      You haven't shared any progress updates yet.
                    </Text>
                  </View>
                ) : (
                  userProgressUpdates.map(update => (
                    <View key={update.id} style={styles.progressCard}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>{update.title}</Text>
                        <Text style={styles.progressDate}>
                          {formatActivityTime(update.createdAt.toMillis())}
                        </Text>
                      </View>
                      <Text style={styles.progressDescription}>
                        {update.description}
                      </Text>
                      {update.mediaUrls && update.mediaUrls.length > 0 && (
                        <Image 
                          source={{ uri: update.mediaUrls[0] }} 
                          style={styles.progressImage} 
                          resizeMode="cover" 
                        />
                      )}
                      <View style={styles.progressFooter}>
                        <TouchableOpacity 
                          style={styles.progressAction}
                          onPress={() => handleLikeProgress(update.id)}
                        >
                          <Text>❤️ {update.likes.length}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.progressAction}
                          onPress={() => handleOpenComments(update)}
                        >
                          <Text>💬 {update.comments.length}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
              
              {/* Friends' Progress Updates */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Friends' Progress</Text>
                {friendsProgressUpdates.length === 0 ? (
                  <View style={styles.noFriendsCard}>
                    <Text style={styles.noFriendsIcon}>👥</Text>
                    <Text style={styles.noFriendsText}>
                      No progress updates from friends yet.
                    </Text>
                  </View>
                ) : (
                  friendsProgressUpdates.map(update => (
                    <View key={update.id} style={styles.progressCard}>
                      <View style={styles.progressHeader}>
                        <View style={styles.progressUser}>
                          <Text style={styles.progressUserLetter}>
                            {update.userName.charAt(0)}
                          </Text>
                          <Text style={styles.progressUserName}>{update.userName}</Text>
                        </View>
                        <Text style={styles.progressDate}>
                          {formatActivityTime(update.createdAt.toMillis())}
                        </Text>
                      </View>
                      <Text style={styles.progressTitle}>{update.title}</Text>
                      <Text style={styles.progressDescription}>
                        {update.description}
                      </Text>
                      {update.mediaUrls && update.mediaUrls.length > 0 && (
                        <Image 
                          source={{ uri: update.mediaUrls[0] }} 
                          style={styles.progressImage} 
                          resizeMode="cover" 
                        />
                      )}
                      <View style={styles.progressFooter}>
                        <TouchableOpacity 
                          style={styles.progressAction}
                          onPress={() => handleLikeProgress(update.id)}
                        >
                          <Text>❤️ {update.likes.length}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.progressAction}
                          onPress={() => handleOpenComments(update)}
                        >
                          <Text>💬 {update.comments.length}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Comment Modal */}
      <Modal
        visible={commentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Comments</Text>
            
            <FlatList
              data={selectedProgressUpdate?.comments || []}
              keyExtractor={item => item.id}
              style={styles.commentsList}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentUser}>{item.userName}</Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={styles.noCommentsText}>No comments yet</Text>
              )}
            />
            
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={styles.commentButton}
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Text style={styles.commentButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCommentModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentUserEntry: {
    backgroundColor: '#f0f8ff',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  medal: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  currentUserName: {
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  leaderboardStats: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  requestCard: {
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
  friendEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeFriendButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeFriendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  activityUserName: {
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 3,
    borderBottomColor: '#0a7ea4',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#0a7ea4',
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  workoutDifficulty: {
    fontSize: 14,
    color: '#0a7ea4',
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'capitalize',
  },
  workoutCreator: {
    fontSize: 14,
    color: '#666',
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  workoutExercises: {
    fontSize: 14,
    color: '#666',
  },
  workoutLikes: {
    fontSize: 14,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressUserLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#0a7ea4',
    width: 30,
    height: 30,
    borderRadius: 15,
    textAlign: 'center',
    lineHeight: 30,
    marginRight: 8,
  },
  progressUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressDate: {
    fontSize: 14,
    color: '#999',
  },
  progressDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
  },
  progressImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  progressFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  progressAction: {
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 30,
    minHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  commentsList: {
    maxHeight: 300,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentUser: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  noCommentsText: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
  },
  addCommentContainer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  commentButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  commentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
});
