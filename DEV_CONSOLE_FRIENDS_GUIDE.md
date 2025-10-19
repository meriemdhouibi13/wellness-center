# Dev Console - Friends Testing Guide 🛠️

## 🎯 Purpose
The dev console now has tools to easily test the Friends tab features without manually creating data in Firebase.

## 📂 Location
Open `dev-console/index.html` in your browser

## 🆕 New Features Added

### 1. **Friends Management Card** 👥

#### Create Friend Request
Creates a pending friend request from User 1 to User 2.

**Fields:**
- User 1 ID: Firebase UID of sender
- User 1 Name: Display name of sender
- User 1 Email: Email of sender
- User 2 ID: Firebase UID of recipient
- User 2 Email: Email of recipient

**Button:** "➕ Create Friend Request"

#### Accept All Pending Requests
Automatically accepts all pending friend requests for User 2.

**Button:** "✅ Accept All Pending (User 2)"

#### Make Friends Directly
Skips the request process and makes two users friends immediately.

**Button:** "🤝 Make Friends Directly"

#### Clear All Friend Data
**⚠️ DANGER:** Deletes ALL friend requests and friendships from the database.

**Button:** "🗑️ Clear All Friend Data"

---

### 2. **Activity Feed Card** 📱

#### Post Activity
Create a single activity for the feed.

**Fields:**
- User ID: Firebase UID
- User Name: Display name
- Activity Type: workout_completed / achievement_earned / streak_milestone
- Description: Activity message (e.g., "Completed a 30-min cardio session")
- Duration: Optional minutes for workouts

**Button:** "📢 Post Activity"

#### Generate Sample Activities
Creates 5 sample activities for quick testing.

**Button:** "🎲 Generate Sample Activities"

#### Clear All Activities
**⚠️ DANGER:** Deletes ALL activities from the database.

**Button:** "🗑️ Clear All Activities"

---

## 🧪 Testing Workflow

### Scenario 1: Test Friend Request Flow

1. **Create two users** (if you haven't already):
   - Sign up two accounts in the app
   - Note their Firebase UIDs from the browser console or Firebase Auth

2. **Send Friend Request:**
   ```
   User 1 ID: abc123
   User 1 Name: Alice
   User 1 Email: alice@test.com
   User 2 ID: xyz789
   User 2 Email: bob@test.com
   ```
   Click "➕ Create Friend Request"

3. **Accept Request:**
   - Enter User 2 ID: xyz789
   - Click "✅ Accept All Pending (User 2)"

4. **Verify in App:**
   - Sign in as Bob (User 2)
   - Go to Friends tab
   - See Alice in friends list

---

### Scenario 2: Quick Friends Setup

**For rapid testing without the request flow:**

1. Fill in both users' info
2. Click "🤝 Make Friends Directly"
3. Both users are now friends instantly!

---

### Scenario 3: Test Leaderboard

1. **Add workout sessions** for both users:
   - Use "Workout Sessions" card
   - Add multiple sessions for each user
   
2. **Verify Leaderboard:**
   - Open app as either user
   - Go to Friends tab
   - See "This Week's Leaderboard" with rankings

---

### Scenario 4: Test Activity Feed

1. **Post activities:**
   ```
   User ID: abc123
   User Name: Alice
   Type: workout_completed
   Description: Alice completed a 30-min cardio session
   Duration: 30
   ```

2. **Or use quick generate:**
   - Fill in User ID and Name
   - Click "🎲 Generate Sample Activities"

3. **Verify in App:**
   - Sign in as a friend of Alice
   - Go to Friends tab
   - Scroll to "Recent Activity" section
   - See Alice's activities

---

## 💡 Tips

### Get Firebase UIDs
1. Sign in to the app
2. Open browser dev tools (F12)
3. Check Application > Local Storage > `auth:session`
4. Copy the `uid` field

### Quick Test Setup
```javascript
// User 1
User 1 ID: [Your Firebase UID]
User 1 Name: TestUser1
User 1 Email: test1@example.com

// User 2  
User 2 ID: [Friend's Firebase UID]
User 2 Email: test2@example.com
```

### Clean Start
If you want to reset all friend data:
1. Click "🗑️ Clear All Friend Data"
2. Click "🗑️ Clear All Activities"
3. Start fresh!

---

## ⚠️ Important Notes

- **Friend requests must use real Firebase Auth UIDs** from registered users
- The console validates that users exist before creating friendships
- Activity feed shows activities from friends only (not all users)
- Leaderboard calculates from real workout sessions in `users/{uid}/sessions`

---

## 🐛 Troubleshooting

**"User not found" error:**
- Make sure both users are registered in Firebase Auth
- Verify the UIDs are correct

**Friends not showing in app:**
- Pull to refresh in the Friends tab
- Check Firebase Console > Firestore to verify data exists

**Leaderboard empty:**
- Make sure friends have workout sessions this week
- Use "Add 7 Days of Sessions" in Workout Sessions card

**Activities not appearing:**
- Verify the user posting the activity is friends with the viewing user
- Refresh the Friends tab

---

## 🎮 Example Test Script

```
1. Create two test accounts in the app
2. Get both UIDs
3. Dev Console:
   - Make them friends directly
   - Add 5 sessions for User 1
   - Add 3 sessions for User 2
   - Generate sample activities for User 1
4. App (User 2):
   - Open Friends tab
   - See User 1 in friends list
   - See leaderboard (User 1 is rank 1)
   - See User 1's activities in feed
5. Success! 🎉
```
