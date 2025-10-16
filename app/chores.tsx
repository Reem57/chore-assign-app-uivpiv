
import React, { useState } from 'react';
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
import { colors } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';

export default function ChoresScreen() {
  const router = useRouter();
  const { chores, addChore, updateChore, deleteChore, reassignChores } = useChoreData();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [choreName, setChoreName] = useState('');
  const [timesPerWeek, setTimesPerWeek] = useState('1');

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

    addChore(choreName.trim(), times);
    setChoreName('');
    setTimesPerWeek('1');
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

    updateChore(editingId, choreName.trim(), times);
    setChoreName('');
    setTimesPerWeek('1');
    setEditingId(null);
  };

  const handleEdit = (id: string, name: string, times: number) => {
    setEditingId(id);
    setChoreName(name);
    setTimesPerWeek(times.toString());
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
    setTimesPerWeek('1');
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
          onPress: () => {
            reassignChores();
            Alert.alert('Success', 'Chores have been reassigned!');
          },
        },
      ]
    );
  };

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
                    <Text style={styles.choreFrequency}>
                      {chore.timesPerWeek}x per week
                    </Text>
                  </View>
                  <View style={styles.choreActions}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() => handleEdit(chore.id, chore.name, chore.timesPerWeek)}
                    >
                      <IconSymbol name="pencil" color={colors.primary} size={20} />
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDelete(chore.id, chore.name)}
                    >
                      <IconSymbol name="trash" color="#FF3B30" size={20} />
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
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
    marginBottom: 4,
  },
  choreFrequency: {
    fontSize: 14,
    color: colors.textSecondary,
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
