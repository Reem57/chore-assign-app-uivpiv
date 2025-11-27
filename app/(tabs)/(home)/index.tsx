
import React, { useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, View, Text, Pressable, Platform, Alert, RefreshControl } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekNumber } from '@/utils/choreAssignment';

export default function HomeScreen() {
  const router = useRouter();
  const { chores, people, assignments, loading, toggleChoreCompletion, getPersonPoints, addRating, hasLocallyRated, refreshData } = useChoreData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshData();
    } catch (err) {
      console.error('Refresh failed', err);
    } finally {
      setRefreshing(false);
    }
  };
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

  // Non-admin user stats
  const userPerson = people.find((p) => p.name === currentUser?.username);
  const remainingTasks = userAssignments.filter((a) => !a.completed).length;
  const DEFAULT_MINUTES_PER_TASK = 15; // assumption: average task takes 15 minutes
  const estimatedMinutesRemaining = remainingTasks * DEFAULT_MINUTES_PER_TASK;
  const userPoints = userPerson ? getPersonPoints(userPerson.id) : { weeklyPoints: 0, yearlyPoints: 0 };

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
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

          {/* Non-admin summary: points and remaining time */}
          {!isAdmin() && userPerson && (
            <View style={styles.userSummaryCard}>
              <View style={styles.userSummaryRow}>
                <Text style={styles.userSummaryLabel}>Points this week</Text>
                <Text style={styles.userSummaryValue}>{userPoints.weeklyPoints}</Text>
              </View>
              <View style={styles.userSummaryRow}>
                <Text style={styles.userSummaryLabel}>Tasks remaining</Text>
                <Text style={styles.userSummaryValue}>{remainingTasks}</Text>
              </View>
              <View style={styles.userSummaryRow}>
                <Text style={styles.userSummaryLabel}>Estimated time left</Text>
                <Text style={styles.userSummaryValue}>{estimatedMinutesRemaining} min</Text>
              </View>
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
                const { weeklyPoints, yearlyPoints } = getPersonPoints(personId);

                return (
                  <View key={person.id} style={styles.personCard}>
                    <View style={styles.personHeader}>
                      <View style={styles.personInfo}>
                        <View style={styles.personAvatar}>
                          <IconSymbol name="person.circle.fill" color={colors.primary} size={40} />
                        </View>
                        <View style={styles.personTextContainer}>
                          <Text style={styles.personName}>{person.name}</Text>
                          <Text style={styles.personStats}>
                            {completedPersonChores}/{personAssignments.length} completed
                          </Text>
                        </View>
                      </View>
                      <View style={styles.pointsContainer}>
                        <View style={styles.pointsBadge}>
                          <IconSymbol name="star.fill" color={colors.warning} size={16} />
                          <Text style={styles.pointsText}>{weeklyPoints}</Text>
                        </View>
                        <Text style={styles.pointsLabel}>This Week</Text>
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
                                <View style={styles.choreTextContainer}>
                                  <Text
                                    style={[
                                      styles.choreItemText,
                                      assignment.completed && styles.choreItemTextCompleted,
                                    ]}
                                  >
                                    {chore.name}
                                  </Text>
                                  {/* Details button to view description */}
                                  <Pressable
                                    onPress={() => Alert.alert(chore.name, chore.description || 'No description provided')}
                                    style={{ paddingHorizontal: 8 }}
                                  >
                                    <Text style={styles.detailsButtonText}>Details</Text>
                                  </Pressable>
                                  {typeof assignment.dayOfWeek === 'number' && (
                                    <Text style={styles.choreDay}>
                                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][assignment.dayOfWeek]}
                                    </Text>
                                  )}
                                            <View style={styles.chorePointsBadge}>
                                    <IconSymbol name="star.fill" color={colors.warning} size={12} />
                                    <Text style={styles.chorePointsText}>+{chore.points || 10}</Text>
                                  </View>
                                            {/* Rating button for other users to anonymously rate this completed assignment */}
                                            {assignment.completed && userPerson && userPerson.id !== person.id && !hasLocallyRated(assignment.id) && (
                                              <Pressable
                                                style={{ paddingHorizontal: 8 }}
                                                onPress={() => {
                                                  // present rating choices 1-5
                                                  Alert.alert(
                                                    'Rate this chore',
                                                    `How well was "${chore.name}" done? (anonymous)` ,
                                                    [
                                                      { text: '1', onPress: () => { addRating(assignment.id, 1); Alert.alert('Thanks', 'Your rating was recorded'); } },
                                                      { text: '2', onPress: () => { addRating(assignment.id, 2); Alert.alert('Thanks', 'Your rating was recorded'); } },
                                                      { text: '3', onPress: () => { addRating(assignment.id, 3); Alert.alert('Thanks', 'Your rating was recorded'); } },
                                                      { text: '4', onPress: () => { addRating(assignment.id, 4); Alert.alert('Thanks', 'Your rating was recorded'); } },
                                                      { text: '5', onPress: () => { addRating(assignment.id, 5); Alert.alert('Thanks', 'Your rating was recorded'); } },
                                                      { text: 'Cancel', style: 'cancel' },
                                                    ],
                                                    { cancelable: true }
                                                  );
                                                }}
                                              >
                                                <Text style={[styles.detailsButtonText, { color: colors.danger }]}>Rate</Text>
                                              </Pressable>
                                            )}
                                            {assignment.completed && hasLocallyRated(assignment.id) && (
                                              <Text style={[styles.detailsButtonText, { color: colors.textSecondary }]}>Rated</Text>
                                            )}
                                </View>
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
    backgroundColor: colors.accent,
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
  userSummaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  userSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userSummaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  detailsButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personAvatar: {
    marginRight: 12,
  },
  personTextContainer: {
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
  pointsContainer: {
    alignItems: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  pointsLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
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
    borderColor: colors.success,
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
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  choreTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choreItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  choreDay: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  choreItemTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  chorePointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chorePointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
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
