
import React, { useState, useEffect } from 'react';
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
import { useChoreData } from '@/hooks/useChoreData';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
  },
  peopleList: {
    marginTop: 10,
  },
  personCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  personActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    padding: 8,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
});

export default function PeopleScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { people, addPerson, updatePerson, deletePerson } = useChoreData();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      router.replace('/(tabs)/(home)/');
    }
  }, [isAdmin]);

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    addPerson(name);
    setName('');
  };

  const handleUpdate = () => {
    if (!editingId || !name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    updatePerson(editingId, name);
    handleCancel();
  };

  const handleEdit = (id: string, personName: string) => {
    setEditingId(id);
    setName(personName);
  };

  const handleDelete = (id: string, personName: string) => {
    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete "${personName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePerson(id),
        },
      ]
    );
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage People',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingId ? 'Edit Person' : 'Add New Person'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Person name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.buttonRow}>
            {editingId && (
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.button}
              onPress={editingId ? handleUpdate : handleAdd}
            >
              <Text style={styles.buttonText}>
                {editingId ? 'Update' : 'Add'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.peopleList}>
          {people.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No people added yet</Text>
            </View>
          ) : (
            people.map((person) => (
              <View key={person.id} style={styles.personCard}>
                <View style={styles.personHeader}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <View style={styles.personActions}>
                    <Pressable
                      style={styles.iconButton}
                      onPress={() => handleEdit(person.id, person.name)}
                    >
                      <IconSymbol name="pencil" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      style={styles.iconButton}
                      onPress={() => handleDelete(person.id, person.name)}
                    >
                      <IconSymbol name="trash" size={20} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
