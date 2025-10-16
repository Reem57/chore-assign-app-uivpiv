
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getWeekNumber } from '@/utils/choreAssignment';

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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  assignmentCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  assignmentPerson: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  timeSlot: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
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
  logoutButton: {
    padding: 10,
  },
});

export default function HomeScreen() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();
  const { chores, people, assignments, toggleChoreCompletion } = useChoreData();

  const currentWeek = useMemo(() => getWeekNumber(new Date()), []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const currentWeekAssignments = useMemo(() => {
    return assignments.filter(
      (a) => a.weekNumber === currentWeek && a.year === currentYear
    );
  }, [assignments, currentWeek, currentYear]);

  const getChoreById = (choreId: string) => {
    return chores.find((c) => c.id === choreId);
  };

  const getPersonById = (personId: string) => {
    return people.find((p) => p.id === personId);
  };

  const handleManagePeople = () => {
    router.push('/people');
  };

  const handleManageChores = () => {
    router.push('/chores');
  };

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

  const renderHeaderRight = () => {
    if (!isAdmin()) return null;
    
    return (
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Pressable onPress={handleManagePeople} style={styles.logoutButton}>
          <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
        </Pressable>
        <Pressable onPress={handleManageChores} style={styles.logoutButton}>
          <IconSymbol name="list.bullet" size={24} color={colors.primary} />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chores',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerRight: renderHeaderRight,
        }}
      />
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>This Week&apos;s Chores</Text>
          <Text style={styles.subtitle}>Week {currentWeek}</Text>
        </View>

        {isAdmin() && (
          <View style={styles.buttonRow}>
            <Pressable style={styles.button} onPress={handleManagePeople}>
              <Text style={styles.buttonText}>Manage People</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleManageChores}>
              <Text style={styles.buttonText}>Manage Chores</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.section}>
          {currentWeekAssignments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {isAdmin()
                  ? 'No chores assigned yet. Add people and chores to get started!'
                  : 'No chores assigned this week'}
              </Text>
            </View>
          ) : (
            currentWeekAssignments.map((assignment) => {
              const chore = getChoreById(assignment.choreId);
              const person = getPersonById(assignment.personId);
              const canToggle = isAdmin() || assignment.personId === currentUser?.personId;

              return (
                <Pressable
                  key={assignment.id}
                  style={styles.assignmentCard}
                  onPress={() => canToggle && toggleChoreCompletion(assignment.id)}
                  disabled={!canToggle}
                >
                  <View style={styles.assignmentHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assignmentTitle}>{chore?.name || 'Unknown'}</Text>
                      <Text style={styles.assignmentPerson}>
                        Assigned to: {person?.name || 'Unknown'}
                      </Text>
                      {assignment.startTime && assignment.endTime && (
                        <Text style={styles.timeSlot}>
                          {formatDate(assignment.startTime)} - {formatDate(assignment.endTime)}
                        </Text>
                      )}
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        assignment.completed && styles.checkboxChecked,
                      ]}
                    >
                      {assignment.completed && (
                        <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
