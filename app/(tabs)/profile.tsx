
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Alert, TextInput } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemedStyles } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getWeekNumber } from '@/utils/choreAssignment';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ProfileScreen() {
  const { chores, people, assignments, getPersonPoints, getPersonForUser, updatePersonPreferences } = useChoreData();
  const { currentUser, isAdmin, logout, setUserPassword } = useAuth();
  const router = useRouter();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  
  // Get current user's person data directly via personId
  const userPerson = getPersonForUser() || null;
  
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dayPreferences, setDayPreferences] = useState<{ [key: number]: 'preferred' | 'available' | 'unavailable' }>(
    {}
  );

  // Update day preferences when userPerson loads
  useEffect(() => {
    if (userPerson?.dayPreferences) {
      setDayPreferences(userPerson.dayPreferences);
    }
  }, [userPerson?.id, userPerson?.dayPreferences]);

  const currentWeek = getWeekNumber(new Date());
  const currentYear = new Date().getFullYear();

  const currentAssignments = assignments.filter(
    (a) => a.weekNumber === currentWeek && a.year === currentYear
  );

  const completedCount = currentAssignments.filter((a) => a.completed).length;
  const totalCount = currentAssignments.length;

  const { weeklyPoints, yearlyPoints } = userPerson ? getPersonPoints(userPerson.id) : { weeklyPoints: 0, yearlyPoints: 0 };

  const handleLogout = async () => {
    console.log('Logout button pressed');
    
    // Use confirm for web compatibility
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        try {
          console.log('User confirmed logout');
          await logout();
          console.log('Logout successful, navigating to login');
          router.replace('/login');
        } catch (error) {
          console.error('Logout failed:', error);
          window.alert('Failed to logout. Please try again.');
        }
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('User confirmed logout');
                await logout();
                console.log('Logout successful, navigating to login');
                router.replace('/login');
              } catch (error) {
                console.error('Logout failed:', error);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!currentUser?.id) return;

    const success = await setUserPassword(currentUser.id, newPassword);
    
    if (success) {
      Alert.alert('Success', 'Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } else {
      Alert.alert('Error', 'Failed to update password');
    }
  };

  const handleDayPreferenceChange = async (day: number, preference: 'preferred' | 'available' | 'unavailable' | null) => {
    if (!userPerson) return;

    const newPreferences = { ...dayPreferences };
    
    if (preference === null) {
      delete newPreferences[day];
    } else {
      newPreferences[day] = preference;
    }

    setDayPreferences(newPreferences);
    
    try {
      await updatePersonPreferences(userPerson.id, newPreferences);
      if (Platform.OS === 'web') {
        // Silent update on web
      } else {
        Alert.alert('Success', 'Day preferences updated');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      Alert.alert('Error', 'Failed to update preferences');
      // Revert on error
      setDayPreferences(userPerson?.dayPreferences || {});
    }
  };

  const getPreferenceColor = (preference: 'preferred' | 'available' | 'unavailable' | undefined) => {
    switch (preference) {
      case 'preferred':
        return colors.success;
      case 'available':
        return colors.primary;
      case 'unavailable':
        return colors.danger;
      default:
        return colors.accent;
    }
  };

  const getPreferenceLabel = (preference: 'preferred' | 'available' | 'unavailable' | undefined) => {
    switch (preference) {
      case 'preferred':
        return '✓ Preferred';
      case 'available':
        return '○ Available';
      case 'unavailable':
        return '✗ Unavailable';
      default:
        return 'No Preference';
    }
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
            <Text style={styles.statValue}>{userPerson ? currentAssignments.filter((a) => a.personId === userPerson.id).length : 0}</Text>
            <Text style={styles.statLabel}>Chores</Text>
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
            
            <Pressable 
              style={styles.infoRow}
              onPress={() => setShowPasswordChange(!showPasswordChange)}
            >
              <Text style={styles.infoLabel}>Password</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.infoValue}>••••••••</Text>
                <IconSymbol name="pencil" color={colors.primary} size={16} />
              </View>
            </Pressable>
            
            {showPasswordChange && (
              <>
                <View style={styles.divider} />
                <View style={styles.passwordChangeContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="New Password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <View style={styles.passwordButtonRow}>
                    <Pressable 
                      style={[styles.passwordButton, styles.cancelButton]}
                      onPress={() => {
                        setShowPasswordChange(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.passwordButton, styles.saveButton]}
                      onPress={handleChangePassword}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Day Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Day Preferences</Text>
          <Text style={styles.sectionDescription}>
            Set your availability for each day. The system will try to assign chores on your preferred days when possible.
          </Text>
          
          <View style={styles.infoCard}>
            {DAYS_OF_WEEK.map((day, index) => (
              <React.Fragment key={index}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.dayPreferenceRow}>
                  <Text style={styles.dayLabel}>{day}</Text>
                  <View style={styles.preferenceButtons}>
                    <Pressable
                      style={[
                        styles.preferenceButton,
                        { borderColor: colors.success },
                        dayPreferences[index] === 'preferred' && { backgroundColor: colors.success },
                      ]}
                      onPress={() => 
                        handleDayPreferenceChange(
                          index, 
                          dayPreferences[index] === 'preferred' ? null : 'preferred'
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.preferenceButtonText,
                          { color: dayPreferences[index] === 'preferred' ? colors.card : colors.textSecondary },
                        ]}
                      >
                        ✓
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      style={[
                        styles.preferenceButton,
                        { borderColor: colors.primary },
                        dayPreferences[index] === 'available' && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => 
                        handleDayPreferenceChange(
                          index, 
                          dayPreferences[index] === 'available' ? null : 'available'
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.preferenceButtonText,
                          { color: dayPreferences[index] === 'available' ? colors.card : colors.textSecondary },
                        ]}
                      >
                        ○
                      </Text>
                    </Pressable>
                    
                    <Pressable
                      style={[
                        styles.preferenceButton,
                        { borderColor: colors.danger },
                        dayPreferences[index] === 'unavailable' && { backgroundColor: colors.danger },
                      ]}
                      onPress={() => 
                        handleDayPreferenceChange(
                          index, 
                          dayPreferences[index] === 'unavailable' ? null : 'unavailable'
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.preferenceButtonText,
                          { color: dayPreferences[index] === 'unavailable' ? colors.card : colors.textSecondary },
                        ]}
                      >
                        ✗
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
          
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Preferred</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendText}>Unavailable</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" color={colors.danger} size={20} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
  
  function getStyles(colors: any) {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 100,
  },
  scrollContentWithTabBar: {
    paddingBottom: 120,
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
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
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
  passwordChangeContainer: {
    paddingTop: 12,
    gap: 12,
  },
  passwordInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  passwordButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  passwordButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.accent,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonText: {
    color: colors.card,
    fontSize: 14,
    fontWeight: '600',
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
  dayPreferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  preferenceButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  preferenceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  preferenceButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
  }
}
