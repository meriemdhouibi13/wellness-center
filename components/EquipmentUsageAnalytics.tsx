import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useThemeColor } from '../hooks/use-theme-color';
import { listEquipmentUsage } from '../services/equipment';
import type { EquipmentUsage } from '../services/types';

type Props = {
  equipmentId: string;
  days?: number; // how many past days to include
};

function getHourBuckets(): number[] {
  return Array.from({ length: 24 }).map((_, i) => i);
}

// Convert timestamp ms to local hour (0-23)
function hourFromTs(ts: number) {
  return new Date(ts).getHours();
}

export default function EquipmentUsageAnalytics({ equipmentId, days = 7 }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<EquipmentUsage[]>([]);
  // Force the card background to white to match the rest of the app UI
  const cardBackground = useThemeColor({ light: '#ffffff', dark: '#ffffff' }, 'background');
  // Use a dark text color on the white card so it's readable in all themes
  const cardTextColor = useThemeColor({ light: '#11181C', dark: '#11181C' }, 'text');
  const cardMutedColor = useThemeColor({ light: '#7f8c8d', dark: '#7f8c8d' }, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  useEffect(() => {
    let mounted = true;
    async function fetch() {
      setLoading(true);
      setError(null);
      try {
        const items = await listEquipmentUsage(equipmentId, 1000);
        if (!mounted) return;
        setUsage(items);
      } catch (err: any) {
        console.warn('Failed to load usage logs', err);
        if (!mounted) return;
        setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetch();
    return () => { mounted = false; };
  }, [equipmentId, days]);

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const hourlyAvailability = useMemo(() => {
    // For each hour 0-23 compute percent of time available in that hour across days
    const buckets = getHourBuckets();
    // For each bucket keep total minutes occupied across days and total possible minutes (days*60)
    const occupiedMinutes: number[] = Array(24).fill(0);
    const totalMinutes = days * 60; // per hour across days (minutes)

    for (const u of usage) {
      // ignore logs older than cutoff
      if (u.startTime < cutoff && (u.endTime ?? u.startTime) < cutoff) continue;
      const start = Math.max(u.startTime, cutoff);
      const end = (u.endTime ?? Date.now());
      // iterate each minute (coarse but simple) - we will do per-hour sums
      let cur = start;
      while (cur < end) {
        const h = hourFromTs(cur);
        occupiedMinutes[h] += 1; // count minutes
        cur += 60 * 1000; // step one minute
        // safety guard to avoid huge loops
        if (occupiedMinutes.reduce((a, b) => a + b, 0) > days * 24 * 60 * 1000) break;
      }
    }

    // compute availability percentage per hour
    const pct: number[] = buckets.map((h) => {
      // total possible minutes for this hour across days
      const possible = days * 60;
      const occ = Math.min(occupiedMinutes[h], possible);
      const avail = possible - occ;
      return Math.round((avail / possible) * 100);
    });

    return pct;
  }, [usage, days, cutoff]);

  if (loading)
    return (
      <View style={[styles.card, { backgroundColor: cardBackground }]}> 
        <ActivityIndicator color={tintColor} />
      </View>
    );

  if (error)
    return (
      <View style={[styles.card, { backgroundColor: cardBackground }]}> 
        <Text style={[styles.error, { color: '#e74c3c' }]}>{error}</Text>
      </View>
    );

  // Show a small hourly summary: morning (8-11), midday (12-17), evening (18-20)
  const summary = {
    morning: averageRange(hourlyAvailability, 8, 11),
    midday: averageRange(hourlyAvailability, 12, 17),
    evening: averageRange(hourlyAvailability, 18, 20),
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}> 
      <Text style={[styles.title, { color: cardTextColor }]}>Availability (last {days}d)</Text>
      <View style={styles.row}>
        <Text style={[styles.label, { color: cardMutedColor }]}>Morning (8–11)</Text>
        <Text style={[styles.value, { color: cardTextColor }]}>{summary.morning}%</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: cardMutedColor }]}>Midday (12–17)</Text>
        <Text style={[styles.value, { color: cardTextColor }]}>{summary.midday}%</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: cardMutedColor }]}>Evening (18–20)</Text>
        <Text style={[styles.value, { color: cardTextColor }]}>{summary.evening}%</Text>
      </View>
    </View>
  );
}

function averageRange(arr: number[], start: number, end: number) {
  const slice = arr.slice(start, end + 1);
  if (!slice.length) return 0;
  return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    color: '#7f8c8d',
  },
  value: {
    fontWeight: '700',
  },
  error: {
    color: '#e74c3c',
  },
});
