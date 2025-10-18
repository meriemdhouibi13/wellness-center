# Developer Console

A simple web-based developer console for the Wellness Center app. Use this to manually trigger events and control equipment status for demos and testing.

## How to Use

1. **Open the console**: Simply double-click `index.html` or open it in your browser
2. The console will automatically connect to your Firebase backend
3. Use the buttons to trigger various demo actions

## Features

### 🏃 Equipment Control
- Start/end equipment sessions
- Toggle equipment status between available and in-use
- Select any equipment from the dropdown

### 👤 User Activity
- Log custom user activities
- Specify activity type (cardio, strength, yoga, meditation)
- Set custom duration

### ⚡ Quick Actions
- **Refresh Equipment List**: Reload all equipment from Firebase
- **Seed Mock Data**: Add sample equipment to your database
- **Simulate Busy Period**: Set ~60% of equipment to "in use"
- **Clear All Sessions**: Reset all equipment to available

### 📊 Database Stats
- Live view of total equipment count
- See how many items are currently in use
- Track available equipment

### 📋 Activity Log
- Real-time log of all actions
- Color-coded messages (success/error/info)
- Timestamps for each action

## Demo Workflow

For the best demo experience:

1. **Seed Data First**: Click "Seed Mock Data" to populate your database
2. **Start a Session**: Select equipment and click "Start Session" 
3. **Watch the App**: Open your mobile app to see the changes in real-time
4. **Simulate Busy**: Click "Simulate Busy Period" to show high usage
5. **Clear Sessions**: Reset everything with "Clear All Sessions"

## Technical Details

- Uses Firebase Web SDK (v10.7.1) via CDN
- No build process required - just open and use
- Connects to the same Firebase project as your mobile app
- All changes are reflected in real-time across both apps

## Tips

- Keep the console open in a separate browser window during demos
- Use the activity log to verify actions were successful
- The stats refresh automatically after each action
- Equipment status changes are instant and visible in the mobile app
