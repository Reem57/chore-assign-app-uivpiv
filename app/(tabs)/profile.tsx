
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Alert } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getWeekNumber } from '@/utils/choreAssignment';

export default function ProfileScreen() {
  const { chores, people, assignments, getPersonPoints } = useChoreData();
  const { currentUser, isAdmin, logout } = useAuth();
  const router = useRouter();

  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();

  const currentAssignments = assignments.filter(
    (a) => a.weekNumber === currentWeek && a.year === currentYear
  );

  const completedCount = currentAssignments.filter((a) => a.completed).length;
  const totalCount = currentAssignments.length;

  // Get current user's person data
  const userPerson = people.find((p) => p.name === currentUser?.username);
  const { weeklyPoints, yearlyPoints } = userPerson ? getPersonPoints(userPerson.id) : { weeklyPoints: 0, yearlyPoints: 0 };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.circle.fill" color={colors.primary} size={80} />
          </View>
          <Text style={styles.username}>{currentUser?.username}</Text>
          {isAdmin() && (
            <View style={styles.adminBadge}>
              <IconSymbol name="star.fill" color={colors.card} size={16} />
              <Text style={styles.adminBadgeText}>Administrator</Text>
            </View>
          )}
        </View>

        {/* Points Section */}
        <View style={styles.pointsSection}>
          <View style={styles.pointsCard}>
            <View style={styles.pointsHeader}>
              <IconSymbol name="star.fill" color={colors.warning} size={32} />
              <Text style={styles.pointsTitle}>Your Points</Text>
            </View>
            <View style={styles.pointsGrid}>
              <View style={styles.pointsItem}>
                <Text style={styles.pointsValue}>{weeklyPoints}</Text>
                <Text style={styles.pointsLabel}>This Week</Text>
                <Text style={styles.pointsSubtext}>Resets weekly</Text>
              </View>
              <View style={styles.pointsDivider} />
              <View style={styles.pointsItem}>
                <Text style={styles.pointsValue}>{yearlyPoints}</Text>
                <Text style={styles.pointsLabel}>This Year</Text>
                <Text style={styles.pointsSubtext}>Total {currentYear}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <IconSymbol name="list.bullet" color={colors.primary} size={32} />
            <Text style={styles.statValue}>{chores.length}</Text>
            <Text style={styles.statLabel}>Total Chores</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="person.2.fill" color={colors.secondary} size={32} />
            <Text style={styles.statValue}>{people.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="checkmark.circle.fill" color={colors.success} size={32} />
            <Text style={styles.statValue}>
              {completedCount}/{totalCount}
            </Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>{currentUser?.username}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>
                {isAdmin() ? 'Administrator' : 'Member'}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>
                {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.permissionRow}>
              <View style={styles.permissionInfo}>
                <IconSymbol name="list.bullet" color={colors.text} size={20} />
                <Text style={styles.permissionLabel}>Manage Chores</Text>
              </View>
              <View style={[styles.permissionBadge, isAdmin() && styles.permissionBadgeActive]}>
                <Text style={[styles.permissionBadgeText, isAdmin() && styles.permissionBadgeTextActive]}>
                  {isAdmin() ? 'Allowed' : 'Denied'}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.permissionRow}>
              <View style={styles.permissionInfo}>
                <IconSymbol name="person.2.fill" color={colors.text} size={20} />
                <Text style={styles.permissionLabel}>Manage People</Text>
              </View>
              <View style={[styles.permissionBadge, isAdmin() && styles.permissionBadgeActive]}>
                <Text style={[styles.permissionBadgeText, isAdmin() && styles.permissionBadgeTextActive]}>
                  {isAdmin() ? 'Allowed' : 'Denied'}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.permissionRow}>
              <View style={styles.permissionInfo}>
                <IconSymbol name="checkmark.circle" color={colors.text} size={20} />
                <Text style={styles.permissionLabel}>Complete Chores</Text>
              </View>
              <View style={[styles.permissionBadge, styles.permissionBadgeActive]}>
                <Text style={[styles.permissionBadgeText, styles.permissionBadgeTextActive]}>
                  Allowed
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        {currentUser?.username === 'Reem' && (
          <Pressable style={styles.logoutButton} onPress={() => router.push('/debug')}>
            <IconSymbol name="wrench.and.screwdriver" color={colors.primary} size={20} />
            <Text style={styles.logoutButtonText}>Show Storage (Debug)</Text>
          </Pressable>
        )}

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" color={colors.danger} size={20} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  adminBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.card,
  },
  pointsSection: {
    marginBottom: 24,
  },
  pointsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  pointsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  pointsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsItem: {
    flex: 1,
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  pointsSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  pointsDivider: {
    width: 2,
    height: 60,
    backgroundColor: colors.accent,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.accent,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionLabel: {
    fontSize: 16,
    color: colors.text,
  },
  permissionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  permissionBadgeActive: {
    backgroundColor: colors.highlight,
  },
  permissionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  permissionBadgeTextActive: {
    color: colors.success,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.danger,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
});
