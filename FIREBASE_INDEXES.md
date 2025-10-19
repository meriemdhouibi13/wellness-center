# Firebase Indexes for Wellness Center

## Required Firestore Indexes

To make the class filtering and calendar view work correctly, you need to create the following compound indexes in your Firebase project:

### 1. For filtered views by category
- Collection: `classes`
- Fields:
  - `category` (Ascending)
  - `status` (Ascending)
  - `startTime` (Ascending)

### 2. For date-based views
- Collection: `classes`
- Fields:
  - `status` (Ascending)
  - `startTime` (Ascending)

## Creating the Indexes

1. Go to the Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Firestore Database → Indexes tab
4. Click "Add Index"
5. Fill in the details for each index as described above
6. Click "Create index"

## Error Messages and Automatic Index Creation

If you see an error message like:

```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/...
```

You can click on the URL in the error message to directly create the required index.

## Index Types Added

These changes add support for:
- Viewing classes by category
- Viewing classes for a specific date
- Viewing classes for a specific date and category
- Calendar view showing green dots for days with available classes