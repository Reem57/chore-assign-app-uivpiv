
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Alert } from 'react-native';
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
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
    marginBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  username: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  pointsCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pointsItem: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  choreCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  choreName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  choreStatus: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 5,
  },
  button: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error,
  },
  logoutButtonText: {
    color: colors.error,
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

export default function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const { assignments, chores, getPersonPoints } = useChoreData();

  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();

  const myAssignments = assignments.filter(
    (a) =>
      a.personId === currentUser?.personId &&
      a.weekNumber === currentWeek &&
      a.year === currentYear
  );

  const points = currentUser?.personId ? getPersonPoints(currentUser.personId) : { weeklyPoints: 0, yearlyPoints: 0 };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Profile</Text>
          <Text style={styles.username}>@{currentUser?.username}</Text>
        </View>

        <View style={styles.pointsCard}>
          <View style={styles.pointsRow}>
            <View style={styles.pointsItem}>
              <Text style={styles.pointsValue}>{points.weeklyPoints}</Text>
              <Text style={styles.pointsLabel}>Weekly Points</Text>
            </View>
            <View style={styles.pointsItem}>
              <Text style={styles.pointsValue}>{points.yearlyPoints}</Text>
              <Text style={styles.pointsLabel}>Yearly Points</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Chores This Week</Text>
          {myAssignments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No chores assigned this week</Text>
            </View>
          ) : (
            myAssignments.map((assignment) => {
              const chore = chores.find((c) => c.id === assignment.choreId);
              return (
                <View key={assignment.id} style={styles.choreCard}>
                  <View style={styles.choreHeader}>
                    <Text style={styles.choreName}>{chore?.name || 'Unknown'}</Text>
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
              );
            })
          )}
        </View>

        <Pressable style={styles.button} onPress={handleEditProfile}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Text style={[styles.buttonText, styles.logoutButtonText]}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
