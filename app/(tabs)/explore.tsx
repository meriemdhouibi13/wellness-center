import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listSessions } from '@/services/sessions';

export default function StatsScreen() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [lastDate, setLastDate] = useState<string | null>(null);

  useEffect(() => {
    // Load user from session
    AsyncStorage.getItem('auth:session').then((sessionStr) => {
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        setUser({ uid: session.uid });
      }
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.uid) { setLoading(false); return; }
      const sessions = await listSessions(user.uid, 200);
      if (!mounted) return;
      setTotalSessions(sessions.length);
      const minutes = sessions.reduce((acc, s) => acc + (s.durationMinutes ?? (s.endTime ? Math.max(1, Math.round((s.endTime - s.startTime)/60000)) : 0)), 0);
      setTotalMinutes(minutes);
      setLastDate(sessions[0] ? new Date(sessions[0].startTime).toLocaleString() : null);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
    return () => { mounted = false; };
  }, [user?.uid]);

  if (!user?.uid) {
    return (
      <View style={styles.container}><Text>Please sign in to view your stats.</Text></View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Loading…</Text>
      ) : (
        <>
          <Text style={styles.title}>My Stats</Text>
          <View style={styles.row}><Text style={styles.label}>Total sessions</Text><Text style={styles.value}>{totalSessions}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Total minutes</Text><Text style={styles.value}>{totalMinutes}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Last session</Text><Text style={styles.value}>{lastDate ?? '—'}</Text></View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  label: { color: '#555' },
  value: { fontWeight: '600' },
});
