import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { reloadProfile } from '@/services/auth';
import { uploadUserAvatar } from '@/lib/storage';
import * as ImagePicker from 'expo-image-picker';
import { db } from '@/lib/firebase';

type Session = { uid: string; displayName?: string };

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState('Guest');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [lastRoutine, setLastRoutine] = useState<string | null>(null);
  const [roleDetail, setRoleDetail] = useState<'community' | 'student' | 'athlete'>('community');

  useEffect(() => {
    (async () => {
      try {
        const s = await AsyncStorage.getItem('auth:session');
        if (s) {
          const parsed = JSON.parse(s) as any;
          setSession({ uid: parsed.uid, displayName: parsed.displayName });
          setName(parsed.displayName || 'Guest');
          setEmail(parsed.email || '');

          if (db && parsed.uid) {
            const snap = await getDoc(doc(db, 'users', parsed.uid));
            if (snap.exists()) {
              const data = snap.data() as any;
              setBio(data.bio || '');
              setAvatarUrl(data.avatarUrl || null);
              // roleDetail is immutable after sign-up; just read it for display
              setRoleDetail(data.roleDetail || 'community');
            }
          }
        }
      } catch (e) {}

      const lr = await AsyncStorage.getItem('last:routineGroup');
      if (lr) setLastRoutine(lr);
    })();
  }, []);

  const saveProfile = async () => {
    if (!session?.uid) return;
    setUploading(true);
    setUploadProgress(0);
    if (db) {
      let finalAvatar = avatarUrl;
      // If avatarUrl looks like a local URI (starts with file: or content: or /), upload it
      if (avatarUrl && (avatarUrl.startsWith('file:') || avatarUrl.startsWith('content:') || avatarUrl.startsWith('/'))) {
        try {
          finalAvatar = await uploadUserAvatar(session.uid, avatarUrl, (progress) => {
            setUploadProgress(progress);
          });
          setToast({ type: 'success', text: 'Avatar uploaded' });
        } catch (e) {
          console.warn('Failed to upload avatar, saving local URI instead', e);
          finalAvatar = avatarUrl;
          setToast({ type: 'error', text: 'Failed to upload avatar' });
        }
      }

      await setDoc(doc(db, 'users', session.uid), { name: name.trim(), bio, avatarUrl: finalAvatar }, { merge: true });
      setAvatarUrl(finalAvatar);
    }
    await AsyncStorage.setItem('username', name.trim());
    setUploading(false);
    setToast({ type: 'success', text: 'Profile saved' });
    // Reload profile in AuthContext so the avatarUrl propagates app-wide
    try {
      await reloadProfile(session.uid);
    } catch (e) {}
    router.back();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      // result may use 'canceled' (new) or 'cancelled' (old) and may include assets
      const wasCancelled = (result as any).cancelled ?? (result as any).canceled;
      if (!wasCancelled) {
        const uri = (result as any).assets?.[0]?.uri ?? (result as any).uri;
        if (uri) setAvatarUrl(uri);
      }
    } catch (e) {
      console.warn('Image pick error', e);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth:session');
    await AsyncStorage.removeItem('username');
    router.replace('/sign-in' as any);
  };

  const resetAvatarToDefault = async () => {
    if (!session?.uid || !db) return;
    setUploading(true);
    try {
      // Only clear avatarUrl on the authoritative user document
      await setDoc(doc(db, 'users', session.uid), { avatarUrl: null }, { merge: true });
      setAvatarUrl(null);
  // don't modify other saved fields; reset only affects avatar
      try { await reloadProfile(session.uid); } catch (e) {}
      setToast({ type: 'success', text: 'Avatar reset to default' });
    } catch (e) {
      console.warn('Failed to reset avatar', e);
      setToast({ type: 'error', text: 'Failed to reset avatar' });
    } finally {
      setUploading(false);
    }
  };


  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>
        )}
        <View style={styles.cameraBadge}><Text style={styles.cameraBadgeText}>📷</Text></View>
      </TouchableOpacity>
      <TextInput value={name} onChangeText={setName} style={styles.nameInput} />
      <Text style={styles.email}>{email}</Text>
      <TextInput value={bio} onChangeText={setBio} placeholder="Tell us about yourself" style={styles.bioInput} multiline />
      {/* Avatar URL is not editable here; use image picker. Role is immutable after sign-up. */}
      <View style={{ marginTop: 8, alignItems: 'center' }}>
        <Text style={{ color: '#666' }}>Role</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', marginTop: 4 }}>{roleDetail === 'community' ? 'Community member' : roleDetail === 'student' ? 'Student' : 'Athlete'}</Text>
      </View>

      {/*
      {lastRoutine && (
        <TouchableOpacity style={styles.routineCard} onPress={() => router.push(`/coach/${lastRoutine}` as any)}>
          <Text style={styles.routineTitle}>Resume last routine</Text>
          <Text style={styles.routineSubtitle}>{lastRoutine}</Text>
        </TouchableOpacity>
      )}
      */}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.saveButton, styles.flexButton]} onPress={saveProfile} disabled={uploading}>
        {uploading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.saveText}>Saving... {Math.round(uploadProgress * 100)}%</Text>
          </View>
        ) : (
          <Text style={styles.saveText}>Save</Text>
        )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutButton, styles.flexButton]} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.resetButton]} onPress={resetAvatarToDefault} disabled={uploading}>
        <Text style={styles.resetText}>Reset avatar to default</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 16 },
  avatarWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cameraBadge: { position: 'absolute', right: -2, bottom: -2, backgroundColor: '#fff', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#eee' },
  cameraBadgeText: { fontSize: 12 },
  nameInput: { fontSize: 20, fontWeight: '600', marginBottom: 4, borderBottomWidth: 1, borderColor: '#eee', width: '80%', textAlign: 'center' },
  bioInput: { width: '90%', minHeight: 80, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 8, marginVertical: 12 },
  input: { width: '80%', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 8, marginBottom: 12 },
  roleOptionSmall: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fafafa' },
  roleSelectedSmall: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  roleText: { color: '#333' },
  roleTextSelected: { color: '#fff', fontWeight: '700' },
  routineCard: { width: '90%', backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'flex-start', marginVertical: 12 },
  routineTitle: { fontSize: 16, fontWeight: '700' },
  routineSubtitle: { color: '#666' },
  saveButton: { backgroundColor: '#0a7ea4', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toast: { position: 'absolute', left: 20, right: 20, bottom: 40, padding: 12, borderRadius: 8, alignItems: 'center' },
  toastText: { color: '#fff', fontWeight: '700' },
  buttonRow: { width: '90%', flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 },
  flexButton: { flex: 1 },
  resetButton: { width: '90%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingVertical: 12, borderRadius: 24, alignItems: 'center', marginTop: 12 },
  resetText: { color: '#0a7ea4', fontSize: 16, fontWeight: '700' },
  
});

