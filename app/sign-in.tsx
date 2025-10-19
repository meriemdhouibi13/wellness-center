import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { reloadProfile } from '@/services/auth';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [roleDetail, setRoleDetail] = useState<'community' | 'student' | 'athlete'>('community');
  const [isSignUp, setIsSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setBusy(true);
    setError(null);
    try {
      const apiKey = (Constants.expoConfig?.extra?.firebaseApiKey as string) || '';
      
      if (isSignUp) {
        // Sign up with Firebase Auth REST API
        const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Sign up failed');
        
        const uid = json.localId as string;
        
        // Create user profile in Firestore
        if (db) {
          await setDoc(doc(db, 'users', uid), {
            id: uid,
            name: name.trim(),
            email: email.trim(),
            role: 'member',
            roleDetail: roleDetail,
            bio: '',
            avatarUrl: '',
            createdAt: Date.now(),
          });
        }
        
        // Save session
        await AsyncStorage.setItem('auth:session', JSON.stringify({
          uid,
          email,
          displayName: name.trim(),
          idToken: json.idToken,
          refreshToken: json.refreshToken,
          expiresIn: Number(json.expiresIn || 3600),
          createdAt: Date.now()
        }));
        await AsyncStorage.setItem('username', name.trim());

        // Notify app about new profile so AuthContext and header update
        try { await reloadProfile(uid); } catch (e) {}

        router.replace('/(tabs)');
      } else {
        // Sign in with Firebase Auth REST API
        const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.error?.message || 'Sign in failed');
        
        const uid = json.localId as string;
        
        // Get user profile from Firestore
        let displayName = email.split('@')[0];
        if (db) {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            displayName = snap.data().name || displayName;
          }
        }
        
        // Save session
        await AsyncStorage.setItem('auth:session', JSON.stringify({
          uid,
          email,
          displayName,
          idToken: json.idToken,
          refreshToken: json.refreshToken,
          expiresIn: Number(json.expiresIn || 3600),
          createdAt: Date.now()
        }));
        await AsyncStorage.setItem('username', displayName);

        // Notify app about new profile so AuthContext and header update
        try { await reloadProfile(uid); } catch (e) {}

        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Create account' : 'Welcome back'}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.form}>
        {isSignUp && (
          <TextInput 
            value={name} 
            onChangeText={setName} 
            placeholder="Name" 
            style={styles.input}
            autoCapitalize="words"
          />
        )}
        {isSignUp && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {([
              { key: 'community', label: 'Community' },
              { key: 'student', label: 'Student' },
              { key: 'athlete', label: 'Athlete' },
            ] as const).map((r) => (
              <TouchableOpacity
                key={r.key}
                onPress={() => setRoleDetail(r.key as any)}
                style={[styles.roleOption, roleDetail === r.key ? styles.roleSelected : null]}
              >
                <Text style={roleDetail === r.key ? styles.roleTextSelected : styles.roleText}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TextInput 
          value={email} 
          onChangeText={setEmail} 
          placeholder="Email" 
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input} 
        />
        <TextInput 
          value={password} 
          onChangeText={setPassword} 
          placeholder="Password" 
          secureTextEntry 
          style={styles.input} 
        />
        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isSignUp ? 'Sign up' : 'Log In'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.link}>{isSignUp ? 'Have an account? Log In' : "New here? Create an account"}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => router.push('/(tabs)')}>
        <Text style={styles.skip}>Skip for now →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  error: { color: '#c0392b', textAlign: 'center' },
  form: { gap: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
  button: { backgroundColor: '#0a7ea4', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#0a7ea4', textAlign: 'center', marginTop: 12 },
  skip: { color: '#7f8c8d', textAlign: 'center', marginTop: 20 },
  roleOption: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', marginHorizontal: 4 },
  roleSelected: { backgroundColor: '#0a7ea4', borderColor: '#0a7ea4' },
  roleText: { color: '#111' },
  roleTextSelected: { color: '#fff', fontWeight: '700' },
});
