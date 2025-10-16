
import React, { useMemo } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekNumber } from '@/utils/choreAssignment';

export default function HomeScreen() {
  const router = useRouter();
  const { chores, people, assignments, loading, toggleChoreCompletion } = useChoreData();
  const { currentUser, isAdmin, logout } = useAuth();

  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();

  // Get current week assignments
  const currentAssignments = useMemo(() => {
    return assignments.filter(
      (a) => a.weekNumber === currentWeek && a.year === currentYear
    );
  }, [assignments, currentWeek, currentYear]);

  // Filter assignments for current user if not admin
  const userAssignments = useMemo(() => {
    if (isAdmin()) {
      return currentAssignments;
    }
    // Find the person associated with current user
    const userPerson = people.find((p) => p.name === currentUser?.username);
    if (!userPerson) return [];
    return currentAssignments.filter((a) => a.personId === userPerson.id);
  }, [currentAssignments, currentUser, people, isAdmin]);

  // Group assignments by person
  const assignmentsByPerson = useMemo(() => {
    const grouped: { [key: string]: typeof currentAssignments } = {};
    
    if (isAdmin()) {
      people.forEach((person) => {
        grouped[person.id] = currentAssignments.filter(
          (a) => a.personId === person.id
        );
      });
    } else {
      // For regular users, only show their own assignments
      const userPerson = people.find((p) => p.name === currentUser?.username);
      if (userPerson) {
        grouped[userPerson.id] = userAssignments;
      }
    }

    return grouped;
  }, [currentAssignments, people, isAdmin, currentUser, userAssignments]);

  const getChoreById = (choreId: string) => {
    return chores.find((c) => c.id === choreId);
  };

  const getPersonById = (personId: string) => {
    return people.find((p) => p.id === personId);
  };

  const completedCount = userAssignments.filter((a) => a.completed).length;
  const totalCount = userAssignments.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleManagePeople = () => {
    console.log('Manage People button pressed');
    if (isAdmin()) {
      router.push('/people');
    }
  };

  const handleManageChores = () => {
    console.log('Manage Chores button pressed');
    if (isAdmin()) {
      router.push('/chores');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const renderHeaderRight = () => (
    <Pressable
      onPress={handleLogout}
      style={styles.headerButtonContainer}
    >
      <IconSymbol name="rectangle.portrait.and.arrow.right" color={colors.primary} size={24} />
    </Pressable>
  );

  const renderHeaderLeft = () => (
    <View style={styles.headerButtonContainer}>
      <Text style={styles.headerUsername}>{currentUser?.username}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Chore Manager',
            headerRight: renderHeaderRight,
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.headerTitle}>
                {isAdmin() ? "This Week's Chores" : 'Your Chores'}
              </Text>
              {isAdmin() && (
                <View style={styles.adminBadge}>
                  <IconSymbol name="star.fill" color={colors.card} size={12} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitle}>Week {currentWeek}, {currentYear}</Text>
            
            {/* Progress Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>
                  {isAdmin() ? 'Overall Progress' : 'Your Progress'}
                </Text>
                <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {completedCount} of {totalCount} chores completed
              </Text>
            </View>
          </View>

          {/* Quick Actions - Only for Admin */}
          {isAdmin() && (
            <View style={styles.quickActions}>
              <Pressable
                style={styles.actionButton}
                onPress={handleManagePeople}
              >
                <IconSymbol name="person.2.fill" color={colors.card} size={24} />
                <Text style={styles.actionButtonText}>Manage People</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={handleManageChores}
              >
                <IconSymbol name="list.bullet" color={colors.card} size={24} />
                <Text style={styles.actionButtonText}>Manage Chores</Text>
              </Pressable>
            </View>
          )}

          {/* Empty State */}
          {people.length === 0 || chores.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="exclamationmark.triangle" color={colors.textSecondary} size={48} />
              <Text style={styles.emptyStateTitle}>
                {isAdmin() ? 'Get Started!' : 'No Chores Yet'}
              </Text>
              <Text style={styles.emptyStateText}>
                {isAdmin()
                  ? people.length === 0 && chores.length === 0
                    ? 'Add people and chores to start managing your household tasks.'
                    : people.length === 0
                    ? 'Add people to your household to assign chores.'
                    : 'Add chores to start assigning tasks.'
                  : 'The admin hasn\'t assigned any chores yet. Check back later!'}
              </Text>
            </View>
          ) : (
            <>
              {/* Assignments by Person */}
              {Object.keys(assignmentsByPerson).map((personId) => {
                const person = getPersonById(personId);
                if (!person) return null;

                const personAssignments = assignmentsByPerson[personId] || [];
                const completedPersonChores = personAssignments.filter((a) => a.completed).length;

                return (
                  <View key={person.id} style={styles.personCard}>
                    <View style={styles.personHeader}>
                      <View style={styles.personInfo}>
                        <IconSymbol name="person.circle.fill" color={colors.primary} size={32} />
                        <View style={styles.personTextContainer}>
                          <Text style={styles.personName}>{person.name}</Text>
                          <Text style={styles.personStats}>
                            {completedPersonChores}/{personAssignments.length} completed
                          </Text>
                        </View>
                      </View>
                    </View>

                    {personAssignments.length === 0 ? (
                      <Text style={styles.noChoresText}>No chores assigned this week</Text>
                    ) : (
                      <View style={styles.choresList}>
                        {personAssignments.map((assignment) => {
                          const chore = getChoreById(assignment.choreId);
                          if (!chore) return null;

                          return (
                            <Pressable
                              key={assignment.id}
                              style={[
                                styles.choreItem,
                                assignment.completed && styles.choreItemCompleted,
                              ]}
                              onPress={() => toggleChoreCompletion(assignment.id)}
                            >
                              <View style={styles.choreItemContent}>
                                <View
                                  style={[
                                    styles.checkbox,
                                    assignment.completed && styles.checkboxChecked,
                                  ]}
                                >
                                  {assignment.completed && (
                                    <IconSymbol name="checkmark" color={colors.card} size={16} />
                                  )}
                                </View>
                                <Text
                                  style={[
                                    styles.choreItemText,
                                    assignment.completed && styles.choreItemTextCompleted,
                                  ]}
                                >
                                  {chore.name}
                                </Text>
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginRight: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.card,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  actionButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  personCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  personHeader: {
    marginBottom: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  personName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  personStats: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  noChoresText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  choresList: {
    gap: 8,
  },
  choreItem: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  choreItemCompleted: {
    backgroundColor: colors.highlight,
    borderColor: colors.secondary,
  },
  choreItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choreItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  choreItemTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  headerButtonContainer: {
    padding: 8,
  },
  headerUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
