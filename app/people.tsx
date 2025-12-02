
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useThemedStyles } from '@/styles/commonStyles';
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';

export default function PeopleScreen() {
  const router = useRouter();
  const { people, addPerson, updatePerson, deletePerson } = useChoreData();
  const { isAdmin, users, setUserPassword, resetUserPassword } = useAuth();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeUserId, setChangeUserId] = useState<string | null>(null);
  const [changePasswordValue, setChangePasswordValue] = useState('');
  
  const floors = ['Floor 1', 'Floor 2']; // Available floors

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert('Access Denied', 'Only admins can manage people');
      router.back();
    }
  }, [isAdmin]);

  const handleAdd = () => {
    if (!personName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    
    if (!selectedFloor) {
      Alert.alert('Error', 'Please select a floor');
      return;
    }

    addPerson(personName.trim(), selectedFloor);
    setPersonName('');
    setSelectedFloor('');
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editingId || !personName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    
    if (!selectedFloor) {
      Alert.alert('Error', 'Please select a floor');
      return;
    }

    updatePerson(editingId, personName.trim(), selectedFloor);
    setPersonName('');
    setSelectedFloor('');
    setEditingId(null);
  };

  const handleEdit = (id: string, name: string, floor?: string) => {
    setEditingId(id);
    setPersonName(name);
    setSelectedFloor(floor || '');
    setIsAdding(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Remove ${name}? This will delete their assignments.`
      );
      if (confirmed) {
        deletePerson(id);
      }
      return;
    }

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
    setSelectedFloor('');
    setIsAdding(false);
    setEditingId(null);
  };

  if (!isAdmin()) {
    return null;
  }

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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Floor</Text>
                <View style={styles.floorButtonsContainer}>
                  {floors.map((floor) => (
                    <Pressable
                      key={floor}
                      style={[
                        styles.floorButton,
                        selectedFloor === floor && styles.floorButtonSelected,
                      ]}
                      onPress={() => setSelectedFloor(floor)}
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
                    <View style={styles.personTextContainer}>
                      <Text style={styles.personName}>{person.name}</Text>
                      {person.floor && (
                        <Text style={styles.personFloor}>{person.floor}</Text>
                      )}

                      {/* Show linked user login info for admins */}
                      {isAdmin() && (
                        (() => {
                          const linkedUser = users.find((u) => String(u.personId) === String(person.id));
                          if (!linkedUser) {
                            return <Text style={styles.usernameText}>No account</Text>;
                          }
                          const revealed = !!revealedPasswords[linkedUser.id];
                          return (
                            <View>
                              <Text style={styles.usernameText}>Username: {linkedUser.username}</Text>
                              <View style={styles.passwordRow}>
                                <Text style={styles.passwordText}>
                                  Password: {revealed ? linkedUser.password : '••••••••'}
                                </Text>
                                <Pressable
                                  onPress={() =>
                                    setRevealedPasswords((s) => ({ ...s, [linkedUser.id]: !s[linkedUser.id] }))
                                  }
                                >
                                  <Text style={styles.showPasswordText}>{revealed ? 'Hide' : 'Show'}</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })()
                      )}
                    </View>
                  </View>
                  <View style={styles.personActions}>
                    <Pressable
                      style={styles.editButton}
                      onPress={() => handleEdit(person.id, person.name, person.floor)}
                    >
                      <IconSymbol name="pencil" color={colors.primary} size={20} />
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDelete(person.id, person.name)}
                    >
                      <IconSymbol name="trash" color={colors.danger} size={20} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Edit Modal: Add password change/reset fields when editing */}
          {(isAdding || editingId) && (
            <Modal
              visible={!!editingId}
              transparent
              animationType="fade"
              onRequestClose={handleCancel}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{editingId ? 'Edit Person' : 'Add New Person'}</Text>
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
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Floor</Text>
                    <View style={styles.floorButtonsContainer}>
                      {floors.map((floor) => (
                        <Pressable
                          key={floor}
                          style={[
                            styles.floorButton,
                            selectedFloor === floor && styles.floorButtonSelected,
                          ]}
                          onPress={() => setSelectedFloor(floor)}
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
                  {/* Password change/reset for linked user */}
                  {editingId && (() => {
                    const linkedUser = users.find((u) => String(u.personId) === String(editingId));
                    if (!linkedUser) {
                      return <Text style={styles.usernameText}>No account</Text>;
                    }
                    return (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.inputLabel}>Change Password</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="New password"
                          placeholderTextColor={colors.textSecondary}
                          secureTextEntry
                          value={changePasswordValue}
                          onChangeText={setChangePasswordValue}
                        />
                        <Pressable
                          style={[styles.modalButton, { backgroundColor: colors.danger, marginTop: 8 }]}
                          onPress={async () => {
                            const temp = await resetUserPassword(linkedUser.id);
                            if (temp) {
                              Alert.alert('Temporary Password', `New temporary password for ${personName}: ${temp}`);
                            } else {
                              Alert.alert('Error', 'Failed to reset password');
                            }
                          }}
                        >
                          <Text style={styles.modalButtonText}>Reset Password</Text>
                        </Pressable>
                      </View>
                    );
                  })()}
                  <View style={styles.modalButtons}>
                    <Pressable
                      style={[styles.modalButton, { backgroundColor: colors.accent }]}
                      onPress={handleCancel}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.modalButton, { backgroundColor: colors.primary }]}
                      onPress={async () => {
                        if (!personName.trim()) {
                          Alert.alert('Error', 'Please enter a name');
                          return;
                        }
                        if (!selectedFloor) {
                          Alert.alert('Error', 'Please select a floor');
                          return;
                        }
                        if (editingId) {
                          updatePerson(editingId, personName.trim(), selectedFloor);
                          // If password field is filled, update password
                          const linkedUser = users.find((u) => u.personId === editingId);
                          if (linkedUser && changePasswordValue.length >= 4) {
                            await setUserPassword(linkedUser.id, changePasswordValue);
                            Alert.alert('Success', 'Password updated');
                          }
                        } else {
                          addPerson(personName.trim(), selectedFloor);
                        }
                        setPersonName('');
                        setSelectedFloor('');
                        setChangePasswordValue('');
                        setEditingId(null);
                      }}
                    >
                      <Text style={styles.modalButtonText}>{editingId ? 'Update' : 'Add'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
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
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
    marginBottom: 2,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  personTextContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  personName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
  personFloor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
    flexWrap: 'nowrap',
  },
  usernameText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
    flexWrap: 'nowrap',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  passwordText: {
    fontSize: 13,
    color: colors.textSecondary,
    flexWrap: 'nowrap',
  },
  showPasswordText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  personActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  smallActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.background,
    marginRight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  smallActionText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    marginLeft: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 2,
  },
  // ...removed duplicate smallActionButton and smallActionText styles...
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.accent,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalButtonText: {
    color: colors.card,
    fontWeight: '700',
  },
});
  }
}
