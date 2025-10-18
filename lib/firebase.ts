import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with long polling for React Native/Expo compatibility
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Lazy getter for Auth to avoid importing firebase/auth on native at startup
export async function getAuthClient() {
  if (Platform.OS !== 'web') return null;
  const { getAuth } = await import('firebase/auth');
  return getAuth(app);
}

export { db };