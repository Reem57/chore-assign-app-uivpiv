import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemedStyles } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';
import { getWeekNumber } from '@/utils/choreAssignment';

export default function LeaderboardScreen() {
  const { people, assignments, chores, loading } = useChoreData() as any;
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  const [sortBy, setSortBy] = useState<'weekly' | 'yearly'>('weekly');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    // competition ranking: equal points => equal rank, next rank skips
    let lastPoints: number | null = null;
    let lastRank = 0;
    let position = 0;
    return arr.map((item) => {
      position += 1;
      const points = sortBy === 'weekly' ? item.weekly : item.yearly;
      if (lastPoints === null || points !== lastPoints) {
        lastRank = position;
        lastPoints = points;
      }
      return { ...item, rank: lastRank };
    });
  }, [people, assignments, chores, currentWeek, currentYear, sortBy]);

  const getChoreById = (id: string) => chores.find((c: any) => c.id === id);

  const completedChoresForPerson = (personId: string) => {
    // Filter completed assignments for selected timeframe
    return assignments.filter((a: any) => {
      if (a.personId !== personId || !a.completed) return false;
      if (sortBy === 'weekly') {
        return a.year === currentYear && a.weekNumber === currentWeek;
      }
      // yearly
      return a.year === currentYear;
    }).map((a: any) => {
      const chore = getChoreById(a.choreId);
      return {
        id: a.id,
        name: chore?.name || `(Unknown chore ${a.choreId})`,
        points: chore?.points ?? 10,
        dayOfWeek: a.dayOfWeek,
      };
    });
  };

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
          <View style={styles.headerTitleRow}>
            <IconSymbol name="star.fill" color={colors.warning} size={20} />
            <Text style={styles.title}>Leaderboard</Text>
          </View>
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
          {totals.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="list.number" color={colors.textSecondary} size={48} />
              <Text style={styles.emptyTitle}>Nothing yet</Text>
              <Text style={styles.emptyText}>Complete chores to climb the leaderboard!</Text>
            </View>
          ) : (
            totals.map((p: any) => (
              <View key={p.id} style={{ marginBottom: 12 }}>
                <View style={styles.row}>
                  <View style={[styles.rankCircle, p.rank === 1 && styles.gold, p.rank === 2 && styles.silver, p.rank === 3 && styles.bronze]}>
                    <Text style={[styles.rankText, p.rank <= 3 && styles.rankTextTop]}>{p.rank}</Text>
                  </View>
                  <Pressable style={styles.personInfo} onPress={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                    <Text style={styles.personName}>{p.name}</Text>
                    <View style={styles.badgesRow}>
                      <View style={styles.badge}>
                        <IconSymbol name="star.fill" color={colors.warning} size={12} />
                        <Text style={styles.badgeText}>{p.weekly} wk</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: colors.highlight }]}> 
                        <IconSymbol name="calendar" color={colors.primary} size={12} />
                        <Text style={styles.badgeText}>{p.yearly} yr</Text>
                      </View>
                    </View>
                  </Pressable>
                  <View style={styles.pointsBox}>
                    <Text style={styles.pointsValue}>{sortBy === 'weekly' ? p.weekly : p.yearly}</Text>
                  </View>
                </View>
                {expandedId === p.id && (
                  <View style={styles.detailsBoxBelow}>
                    {completedChoresForPerson(p.id).length === 0 ? (
                      <Text style={styles.detailsEmpty}>No completed chores {sortBy === 'weekly' ? 'this week' : 'this year'}.</Text>
                    ) : (
                      completedChoresForPerson(p.id).map((c: any) => (
                        <View key={c.id} style={styles.detailRow}>
                          <Text style={styles.detailName}>{c.name}</Text>
                          <View style={styles.detailRight}>
                            {typeof c.dayOfWeek === 'number' && (
                              <Text style={styles.detailDay}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][c.dayOfWeek]}</Text>
                            )}
                            <View style={styles.detailPointsBadge}>
                              <IconSymbol name="star.fill" color={colors.warning} size={12} />
                              <Text style={styles.detailPointsText}>+{c.points}</Text>
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
  
  function getStyles(colors: any) {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
  center: { justifyContent: 'center', alignItems: 'center' },
  loading: { color: colors.text, fontSize: 16 },
  header: {
    // Add a bit more breathing room above and subtle elevation for appeal
    marginTop: 40,
    paddingTop: 25,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    backgroundColor: colors.card,
    boxShadow: '0px 2px 6px rgba(0,0,0,0.06)',
    elevation: 2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: { fontSize: 25, fontWeight: '800', color: colors.text },
  toggleRow: { flexDirection: 'row', marginTop: 12 },
  toggleButton: { padding: 8, borderRadius: 10, marginRight: 8, backgroundColor: colors.background },
  toggleButtonActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.textSecondary, fontWeight: '700' },
  toggleTextActive: { color: colors.card },
  list: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: 12 },
  rankCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.highlight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankText: { fontWeight: '800', color: colors.primary },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  personInfo: { flex: 1 },
  personName: { fontSize: 16, fontWeight: '700', color: colors.text },
  personSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  pointsBox: { minWidth: 64, alignItems: 'flex-end' },
  pointsValue: { fontSize: 16, fontWeight: '800', color: colors.warning },
  // New UI bits
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  gold: { backgroundColor: '#FFE8A3' },
  silver: { backgroundColor: '#E6E6E6' },
  bronze: { backgroundColor: '#F5C6A5' },
  rankTextTop: { color: colors.text },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.text },
  detailsBox: { marginTop: 12, backgroundColor: colors.background, borderRadius: 8, padding: 10, width: '100%' },
  detailsBoxBelow: { marginTop: 8, marginHorizontal: 16, backgroundColor: colors.background, borderRadius: 8, padding: 10 },
  detailsEmpty: { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  detailName: { fontSize: 14, color: colors.text, fontWeight: '600', flex: 1, marginRight: 8 },
  detailRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailDay: { fontSize: 12, color: colors.textSecondary },
  detailPointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.card, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  detailPointsText: { fontSize: 12, fontWeight: '700', color: colors.warning },
});
  }
}
