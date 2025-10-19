# Friends Feature Implementation Plan

## Firebase Collections Structure

### 1. `users/{uid}`
```typescript
{
  id: string;
  name: string;
  email: string;
  role: 'member' | 'coach' | 'admin';
  createdAt: number;
  totalSessions?: number;
  currentStreak?: number;
  longestStreak?: number;
}
```

### 2. `friendRequests/{requestId}`
```typescript
{
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  toUserId: string;
  toUserEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: timestamp;
  respondedAt?: timestamp;
}
```

### 3. `friends/{userId}/friendsList/{friendId}`
Subcollection under each user containing their accepted friends
```typescript
{
  friendId: string;
  friendName: string;
  friendEmail: string;
  addedAt: timestamp;
}
```

### 4. `activities/{activityId}`
Global activity feed
```typescript
{
  id: string;
  userId: string;
  userName: string;
  type: 'workout_completed' | 'achievement_earned' | 'streak_milestone';
  description: string;
  sessionId?: string;
  duration?: number;
  equipmentType?: string;
  createdAt: timestamp;
}
```

## Features Implementation Order

### Phase 1: Basic Friend Management ✅
1. Search for users by email
2. Send friend requests
3. Accept/reject friend requests
4. View friends list
5. Remove friends

### Phase 2: Activity Feed 📊
1. Post activity when workout completes
2. Load friends' recent activities
3. Real-time updates for new activities
4. Filter by friend

### Phase 3: Leaderboard 🏆
1. Calculate weekly stats for user + friends
2. Display ranked leaderboard
3. Show different metrics (sessions, minutes, streak)
4. Monthly/all-time views

### Phase 4: Social Interactions 💬
1. Send kudos/encouragement
2. Create workout challenges
3. Join group workouts
4. Share achievements

## API Functions Needed

### Friend Management
- `searchUserByEmail(email: string): Promise<User | null>`
- `sendFriendRequest(toEmail: string): Promise<void>`
- `respondToFriendRequest(requestId: string, accept: boolean): Promise<void>`
- `getFriendRequests(): Promise<FriendRequest[]>`
- `getFriends(): Promise<Friend[]>`
- `removeFriend(friendId: string): Promise<void>`

### Activity Feed
- `postActivity(type, description, metadata): Promise<void>`
- `getFriendsActivities(limit?: number): Promise<Activity[]>`
- `listenToFriendsActivities(callback): Unsubscribe`

### Leaderboard
- `getWeeklyLeaderboard(): Promise<LeaderboardEntry[]>`
- `getMonthlyLeaderboard(): Promise<LeaderboardEntry[]>`

### Social
- `sendKudos(toUserId: string, message: string): Promise<void>`
- `createChallenge(friendId: string, challengeData): Promise<void>`

## Dev Console Updates Needed

Add sections for:
- Create fake friend requests
- Generate activity feed entries
- Test leaderboard calculations
- Clear friend data
