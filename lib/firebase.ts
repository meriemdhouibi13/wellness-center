import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
  measurementId: extra.firebaseMeasurementId,
};

// Initialize Firebase only once
let app: any = null;
let db: any = null;
let auth: any = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    
    // Initialize Firestore with long polling for React Native/Expo compatibility
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    
    auth = getAuth(app);
  } else {
    console.warn('Firebase config not found, running without Firebase');
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
  // Continue without Firebase
}

export { db, auth };