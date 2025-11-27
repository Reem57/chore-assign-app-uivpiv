import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';
import { getWeekNumber } from '@/utils/choreAssignment';

export default function LeaderboardScreen() {
  const { people, assignments, chores, loading, getPersonPoints } = useChoreData() as any;
  const [sortBy, setSortBy] = useState<'weekly' | 'yearly'>('weekly');

  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  // Compute totals without applying rating penalties: sum base chore.points for completed assignments
  const totals = useMemo(() => {
    const map: { [id: string]: { weekly: number; yearly: number; name: string } } = {};
    people.forEach((p: any) => {
      map[p.id] = { weekly: 0, yearly: 0, name: p.name };
    });

    assignments.forEach((a: any) => {
      if (!a.completed) return;
      const chore = chores.find((c: any) => c.id === a.choreId);
      const base = chore?.points || 10;
      // yearly
      if (a.year === currentYear) {
        map[a.personId] = map[a.personId] || { weekly: 0, yearly: 0, name: 'Unknown' };
        map[a.personId].yearly += base;
      }
      // weekly
      if (a.weekNumber === currentWeek && a.year === currentYear) {
        map[a.personId] = map[a.personId] || { weekly: 0, yearly: 0, name: 'Unknown' };
        map[a.personId].weekly += base;
      }
    });

    // Convert to array and include people who have zero points
    const arr: Array<{ id: string; name: string; weekly: number; yearly: number }> = people.map((p: any) => ({
      id: p.id,
      name: p.name,
      weekly: map[p.id]?.weekly || 0,
      yearly: map[p.id]?.yearly || 0,
    }));

    // sort
    arr.sort((a, b) => (sortBy === 'weekly' ? b.weekly - a.weekly : b.yearly - a.yearly));
    return arr;
  }, [people, assignments, chores, currentWeek, currentYear, sortBy]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Leaderboard' }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Leaderboard</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, sortBy === 'weekly' && styles.toggleButtonActive]}
              onPress={() => setSortBy('weekly')}
            >
              <Text style={[styles.toggleText, sortBy === 'weekly' && styles.toggleTextActive]}>This Week</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, sortBy === 'yearly' && styles.toggleButtonActive]}
              onPress={() => setSortBy('yearly')}
            >
              <Text style={[styles.toggleText, sortBy === 'yearly' && styles.toggleTextActive]}>This Year</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {totals.map((p: any, idx: number) => (
            <View key={p.id} style={styles.row}>
              <View style={styles.rankCircle}>
                <Text style={styles.rankText}>{idx + 1}</Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{p.name}</Text>
                <Text style={styles.personSub}>{p.weekly} pts this week • {p.yearly} pts this year</Text>
              </View>
              <View style={styles.pointsBox}>
                <Text style={styles.pointsValue}>{sortBy === 'weekly' ? p.weekly : p.yearly}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: { justifyContent: 'center', alignItems: 'center' },
  loading: { color: colors.text, fontSize: 16 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.accent, backgroundColor: colors.card, marginTop: 50 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  toggleRow: { flexDirection: 'row', marginTop: 12 },
  toggleButton: { padding: 8, borderRadius: 10, marginRight: 8, backgroundColor: colors.background },
  toggleButtonActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textSecondary, fontWeight: '700' },
  toggleTextActive: { color: colors.card },
  list: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: 12 },
  rankCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.highlight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankText: { fontWeight: '800', color: colors.primary },
  personInfo: { flex: 1 },
  personName: { fontSize: 16, fontWeight: '700', color: colors.text },
  personSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  pointsBox: { minWidth: 64, alignItems: 'flex-end' },
  pointsValue: { fontSize: 16, fontWeight: '800', color: colors.warning },
});
