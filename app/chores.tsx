
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemedStyles } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';

export default function ChoresScreen() {
  const router = useRouter();
  const { chores, people, assignments, addChore, updateChore, deleteChore, reassignChores } = useChoreData();
  const { isAdmin } = useAuth();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [choreName, setChoreName] = useState('');
  const [choreDescription, setChoreDescription] = useState('');
  const [timesPerWeek, setTimesPerWeek] = useState('1');
  const [points, setPoints] = useState('10');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  
  const floors = ['Floor 1', 'Floor 2'];

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert('Access Denied', 'Only admins can manage chores');
      router.back();
    }
  }, [isAdmin]);

  const handleAdd = () => {
    if (!choreName.trim()) {
      Alert.alert('Error', 'Please enter a chore name');
      return;
    }

    const times = parseInt(timesPerWeek, 10);
    if (isNaN(times) || times < 1 || times > 7) {
      Alert.alert('Error', 'Times per week must be between 1 and 7');
      return;
    }

    const pointsValue = parseInt(points, 10);
    if (isNaN(pointsValue) || pointsValue < 1) {
      Alert.alert('Error', 'Points must be at least 1');
      return;
    }

    addChore(choreName.trim(), times, pointsValue, choreDescription.trim(), selectedFloor);
    setChoreName('');
    setChoreDescription('');
    setTimesPerWeek('1');
    setPoints('10');
    setSelectedFloor('');
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editingId || !choreName.trim()) {
      Alert.alert('Error', 'Please enter a chore name');
      return;
    }

    const times = parseInt(timesPerWeek, 10);
    if (isNaN(times) || times < 1 || times > 7) {
      Alert.alert('Error', 'Times per week must be between 1 and 7');
      return;
    }

    const pointsValue = parseInt(points, 10);
    if (isNaN(pointsValue) || pointsValue < 1) {
      Alert.alert('Error', 'Points must be at least 1');
      return;
    }

    updateChore(editingId, choreName.trim(), times, pointsValue, choreDescription.trim(), selectedFloor);
    setChoreName('');
    setChoreDescription('');
    setTimesPerWeek('1');
    setPoints('10');
    setSelectedFloor('');
    setEditingId(null);
  };

  const handleEdit = (id: string, name: string, times: number, chorePoints: number, description: string = '', floor: string = '') => {
    setEditingId(id);
    setChoreName(name);
    setChoreDescription(description);
    setSelectedFloor(floor);
    setTimesPerWeek(times.toString());
    setPoints((chorePoints || 10).toString());
    setIsAdding(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Chore',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteChore(id),
        },
      ]
    );
  };

  const handleCancel = () => {
    setChoreName('');
    setChoreDescription('');
    setTimesPerWeek('1');
    setPoints('10');
    setSelectedFloor('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleReassign = () => {
    Alert.alert(
      'Reassign Chores',
      'This will create new assignments for this week. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reassign',
          onPress: async () => {
            try {
              console.log('Before reassign - People:', people.length, 'Chores:', chores.length);
              console.log('Chores details:', chores.map(c => ({ name: c.name, timesPerWeek: c.timesPerWeek })));
              const count = await reassignChores();
              console.log('After reassign - new assignments for current week:', count);
              Alert.alert('Success', `Chores have been reassigned (${count} assignments created)`);
            } catch (err) {
              console.error('Reassign failed', err);
              Alert.alert('Error', 'Failed to reassign chores. Check logs for details.');
            }
          },
        },
      ]
    );
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Manage Chores',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          presentation: 'modal',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <IconSymbol name="chevron.left" color={colors.primary} size={24} />
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chores</Text>
            <Text style={styles.headerSubtitle}>
              Manage your household chores and their frequency
            </Text>
          </View>

          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingId ? 'Edit Chore' : 'Add New Chore'}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Chore Name</Text>
                <TextInput
                  style={styles.input}
                  value={choreName}
                  onChangeText={setChoreName}
                  placeholder="e.g., Wash dishes"
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Times per Week</Text>
                <TextInput
                  style={styles.input}
                  value={timesPerWeek}
                  onChangeText={setTimesPerWeek}
                  placeholder="1-7"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Points per Completion</Text>
                <TextInput
                  style={styles.input}
                  value={points}
                  onChangeText={setPoints}
                  placeholder="10"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.descriptionInput]}
                  value={choreDescription}
                  onChangeText={setChoreDescription}
                  placeholder="e.g., Clean kitchen counters, sink, and stove"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Floor (Optional)</Text>
                <View style={styles.floorButtonsContainer}>
                  {floors.map((floor) => (
                    <Pressable
                      key={floor}
                      style={[
                        styles.floorButton,
                        selectedFloor === floor && styles.floorButtonSelected,
                      ]}
                      onPress={() => setSelectedFloor(selectedFloor === floor ? '' : floor)}
                    >
                      <Text
                        style={[
                          styles.floorButtonText,
                          selectedFloor === floor && styles.floorButtonTextSelected,
                        ]}
                      >
                        {floor}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formButtons}>
                <Pressable style={styles.cancelButton} onPress={handleCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.saveButton}
                  onPress={editingId ? handleUpdate : handleAdd}
                >
                  <Text style={styles.saveButtonText}>
                    {editingId ? 'Update' : 'Add'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Add Button */}
          {!isAdding && !editingId && (
            <Pressable style={styles.addButton} onPress={() => setIsAdding(true)}>
              <IconSymbol name="plus.circle.fill" color={colors.card} size={24} />
              <Text style={styles.addButtonText}>Add New Chore</Text>
            </Pressable>
          )}

          {/* Reassign Button */}
          {chores.length > 0 && (
            <Pressable style={styles.reassignButton} onPress={handleReassign}>
              <IconSymbol name="arrow.triangle.2.circlepath" color={colors.primary} size={20} />
              <Text style={styles.reassignButtonText}>Reassign All Chores</Text>
            </Pressable>
          )}

          {/* Chores List */}
          {chores.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="list.bullet" color={colors.textSecondary} size={48} />
              <Text style={styles.emptyStateTitle}>No Chores Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first chore to get started!
              </Text>
            </View>
          ) : (
            <View style={styles.choresList}>
              {chores.map((chore) => (
                <View key={chore.id} style={styles.choreCard}>
                  <View style={styles.choreInfo}>
                    <Text style={styles.choreName}>{chore.name}</Text>
                    {chore.floor && (
                      <Text style={styles.choreFloor}>{chore.floor}</Text>
                    )}
                    <View style={styles.choreDetails}>
                      <View style={styles.choreDetailItem}>
                        <IconSymbol name="calendar" color={colors.textSecondary} size={14} />
                        <Text style={styles.choreFrequency}>
                          {chore.timesPerWeek}x/week
                        </Text>
                      </View>
                      <View style={styles.choreDetailItem}>
                        <IconSymbol name="star.fill" color={colors.warning} size={14} />
                        <Text style={styles.chorePoints}>
                          {chore.points || 10} pts
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.choreActions}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() => handleEdit(chore.id, chore.name, chore.timesPerWeek, chore.points || 10, chore.description || '', chore.floor || '')}
                    >
                      <IconSymbol name="pencil" color={colors.primary} size={20} />
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDelete(chore.id, chore.name)}
                    >
                      <IconSymbol name="trash" color={colors.danger} size={20} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  header: {
    marginBottom: 24,
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
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  floorButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  floorButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  floorButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  floorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  floorButtonTextSelected: {
    color: colors.card,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
    marginLeft: 8,
  },
  reassignButton: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  reassignButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
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
  choresList: {
    gap: 12,
  },
  choreCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  choreInfo: {
    flex: 1,
  },
  choreName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  choreFloor: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  choreDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  choreDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  choreFrequency: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chorePoints: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  choreActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
});
  }
}
