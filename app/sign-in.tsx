import { useAuth } from '@/contexts/AuthContext';
import { Link, Redirect } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignInScreen() {
  const { signIn, signUp, user, loading } = useAuth();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Demo User');
  const [isSignUp, setIsSignUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && !loading) {
    return <Redirect href="/(tabs)" />;
  }

  const onSubmit = async () => {
    setBusy(true); setError(null);
    try {
      if (isSignUp) await signUp(email, password, name, 'member');
      else await signIn(email, password);
    } catch (e: any) {
      setError(e?.message ?? 'Failed');
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{isSignUp ? 'Create account' : 'Welcome back'}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.form}>
        {isSignUp && (
          <TextInput value={name} onChangeText={setName} placeholder="Name" style={styles.input} />
        )}
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />
        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isSignUp ? 'Sign up' : 'Sign in'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.link}>{isSignUp ? 'Have an account? Sign in' : "New here? Create an account"}</Text>
        </TouchableOpacity>
      </View>
      <Link href="/(tabs)" style={styles.skip}>Skip for now →</Link>
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
});
