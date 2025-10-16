
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';
import { getWeekNumber } from '@/utils/choreAssignment';

export default function ProfileScreen() {
  const { chores, people, assignments } = useChoreData();

  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();

  const currentAssignments = assignments.filter(
    (a) => a.weekNumber === currentWeek && a.year === currentYear
  );

  const completedCount = currentAssignments.filter((a) => a.completed).length;
  const totalCount = currentAssignments.length;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="house.fill" color={colors.card} size={48} />
          </View>
          <Text style={styles.headerTitle}>Household Stats</Text>
          <Text style={styles.headerSubtitle}>Week {currentWeek}, {currentYear}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <IconSymbol name="person.2.fill" color={colors.primary} size={32} />
            <Text style={styles.statValue}>{people.length}</Text>
            <Text style={styles.statLabel}>People</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="list.bullet" color={colors.secondary} size={32} />
            <Text style={styles.statValue}>{chores.length}</Text>
            <Text style={styles.statLabel}>Chores</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="checkmark.circle.fill" color={colors.primary} size={32} />
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="clock.fill" color={colors.secondary} size={32} />
            <Text style={styles.statValue}>{totalCount - completedCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Chore Manager</Text>
          <Text style={styles.infoText}>
            This app helps you manage household chores efficiently. Add people and chores, 
            and the app will automatically assign tasks using a fair round-robin system.
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Features</Text>
          
          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle" color={colors.primary} size={20} />
            <Text style={styles.featureText}>Automatic chore assignment</Text>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle" color={colors.primary} size={20} />
            <Text style={styles.featureText}>Track completion progress</Text>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle" color={colors.primary} size={20} />
            <Text style={styles.featureText}>Weekly chore scheduling</Text>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle" color={colors.primary} size={20} />
            <Text style={styles.featureText}>Fair round-robin distribution</Text>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol name="checkmark.circle" color={colors.primary} size={20} />
            <Text style={styles.featureText}>Easy chore management</Text>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips</Text>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1.</Text>
            <Text style={styles.tipText}>
              Add all household members first before creating chores
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2.</Text>
            <Text style={styles.tipText}>
              Set the frequency for each chore based on how often it needs to be done
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3.</Text>
            <Text style={styles.tipText}>
              Tap on a chore to mark it as completed
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>4.</Text>
            <Text style={styles.tipText}>
              Use the reassign button to redistribute chores if needed
            </Text>
          </View>
        </View>
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
    paddingTop: 24,
    paddingBottom: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featuresCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  tipsCard: {
    backgroundColor: colors.highlight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 8,
    width: 24,
  },
  tipText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    flex: 1,
  },
});
