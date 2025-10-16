
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { getWeekNumber } from '@/utils/choreAssignment';
import { useRouter } from 'expo-router';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  choresList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  choresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  choreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  choreName: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  choreStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completed: {
    backgroundColor: colors.success + '20',
    color: colors.success,
  },
  pending: {
    backgroundColor: colors.warning + '20',
    color: colors.warning,
  },
  timeSlot: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default function AdminScreen() {
  const { people, assignments, chores, getPersonPoints } = useChoreData();
  const { isAdmin } = useAuth();
  const router = useRouter();

  const currentWeek = useMemo(() => getWeekNumber(new Date()), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const personStats = useMemo(() => {
    return people.map((person) => {
      const points = getPersonPoints(person.id);
      const personAssignments = assignments.filter(
        (a) => a.personId === person.id && a.weekNumber === currentWeek && a.year === currentYear
      );

      const completedCount = personAssignments.filter((a) => a.completed).length;
      const totalCount = personAssignments.length;
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      const assignmentsWithDetails = personAssignments.map((assignment) => {
        const chore = chores.find((c) => c.id === assignment.choreId);
        return {
          ...assignment,
          choreName: chore?.name || 'Unknown',
        };
      });

      return {
        person,
        points,
        completedCount,
        totalCount,
        completionRate,
        assignments: assignmentsWithDetails,
      };
    });
  }, [people, assignments, chores, currentWeek, currentYear]);

  // Redirect if not admin
  if (!isAdmin()) {
    router.replace('/(tabs)/(home)/');
    return null;
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Week {currentWeek} Statistics</Text>
        </View>

        {personStats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No people added yet</Text>
          </View>
        ) : (
          personStats.map((stat) => (
            <View key={stat.person.id} style={styles.statsCard}>
              <Text style={styles.personName}>{stat.person.name}</Text>

              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Weekly Points</Text>
                <Text style={styles.statValue}>{stat.points.weeklyPoints}</Text>
              </View>

              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Yearly Points</Text>
                <Text style={styles.statValue}>{stat.points.yearlyPoints}</Text>
              </View>

              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>Completion Rate</Text>
                <Text style={styles.statValue}>
                  {stat.completionRate.toFixed(0)}% ({stat.completedCount}/{stat.totalCount})
                </Text>
              </View>

              {stat.assignments.length > 0 && (
                <View style={styles.choresList}>
                  <Text style={styles.choresTitle}>This Week&apos;s Chores</Text>
                  {stat.assignments.map((assignment) => (
                    <View key={assignment.id}>
                      <View style={styles.choreItem}>
                        <Text style={styles.choreName}>{assignment.choreName}</Text>
                        <Text
                          style={[
                            styles.choreStatus,
                            assignment.completed ? styles.completed : styles.pending,
                          ]}
                        >
                          {assignment.completed ? 'Completed' : 'Pending'}
                        </Text>
                      </View>
                      {assignment.startTime && assignment.endTime && (
                        <Text style={styles.timeSlot}>
                          {formatDate(assignment.startTime)} - {formatDate(assignment.endTime)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
