
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';

export default function PeopleScreen() {
  const router = useRouter();
  const { people, addPerson, updatePerson, deletePerson } = useChoreData();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');

  const handleAdd = () => {
    if (!personName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    addPerson(personName.trim());
    setPersonName('');
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editingId || !personName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    updatePerson(editingId, personName.trim());
    setPersonName('');
    setEditingId(null);
  };

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setPersonName(name);
    setIsAdding(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Remove Person',
      `Are you sure you want to remove ${name}? Their assignments will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deletePerson(id),
        },
      ]
    );
  };

  const handleCancel = () => {
    setPersonName('');
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Manage People',
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
            <Text style={styles.headerTitle}>Household Members</Text>
            <Text style={styles.headerSubtitle}>
              Add people who will be assigned chores
            </Text>
          </View>

          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingId ? 'Edit Person' : 'Add New Person'}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={personName}
                  onChangeText={setPersonName}
                  placeholder="e.g., John"
                  placeholderTextColor={colors.textSecondary}
                  autoFocus
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
              <IconSymbol name="person.badge.plus" color={colors.card} size={24} />
              <Text style={styles.addButtonText}>Add New Person</Text>
            </Pressable>
          )}

          {/* People List */}
          {people.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="person.2" color={colors.textSecondary} size={48} />
              <Text style={styles.emptyStateTitle}>No People Yet</Text>
              <Text style={styles.emptyStateText}>
                Add household members to start assigning chores!
              </Text>
            </View>
          ) : (
            <View style={styles.peopleList}>
              {people.map((person) => (
                <View key={person.id} style={styles.personCard}>
                  <View style={styles.personInfo}>
                    <View style={styles.avatarCircle}>
                      <IconSymbol name="person.fill" color={colors.card} size={24} />
                    </View>
                    <Text style={styles.personName}>{person.name}</Text>
                  </View>
                  <View style={styles.personActions}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() => handleEdit(person.id, person.name)}
                    >
                      <IconSymbol name="pencil" color={colors.primary} size={20} />
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDelete(person.id, person.name)}
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
    marginBottom: 24,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.card,
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
  peopleList: {
    gap: 12,
  },
  personCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  personInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  personActions: {
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
