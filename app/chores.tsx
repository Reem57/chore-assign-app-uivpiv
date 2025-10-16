
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
  choresList: {
    marginTop: 10,
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
  },
  choreName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  choreDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
  },
  choreActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    padding: 8,
  },
  reassignButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
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

export default function ChoresScreen() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { chores, addChore, updateChore, deleteChore, reassignChores } = useChoreData();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [timesPerWeek, setTimesPerWeek] = useState('');
  const [points, setPoints] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      router.replace('/(tabs)/(home)/');
    }
  }, [isAdmin]);

  const handleAdd = () => {
    if (!name.trim() || !timesPerWeek) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const times = parseInt(timesPerWeek);
    const chorePoints = points ? parseInt(points) : 10;

    if (times <= 0) {
      Alert.alert('Error', 'Times per week must be greater than 0');
      return;
    }

    addChore(name, times, chorePoints);
    setName('');
    setTimesPerWeek('');
    setPoints('');
  };

  const handleUpdate = () => {
    if (!editingId || !name.trim() || !timesPerWeek) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const times = parseInt(timesPerWeek);
    const chorePoints = points ? parseInt(points) : 10;

    if (times <= 0) {
      Alert.alert('Error', 'Times per week must be greater than 0');
      return;
    }

    updateChore(editingId, name, times, chorePoints);
    handleCancel();
  };

  const handleEdit = (id: string, choreName: string, times: number, chorePoints: number) => {
    setEditingId(id);
    setName(choreName);
    setTimesPerWeek(times.toString());
    setPoints(chorePoints.toString());
  };

  const handleDelete = (id: string, choreName: string) => {
    Alert.alert(
      'Delete Chore',
      `Are you sure you want to delete "${choreName}"?`,
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
    setEditingId(null);
    setName('');
    setTimesPerWeek('');
    setPoints('');
  };

  const handleReassign = () => {
    Alert.alert(
      'Reassign Chores',
      'This will create new assignments for the current week. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reassign',
          onPress: () => {
            reassignChores();
            Alert.alert('Success', 'Chores have been reassigned');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Manage Chores',
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
            {editingId ? 'Edit Chore' : 'Add New Chore'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Chore name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Times per week"
            placeholderTextColor={colors.textSecondary}
            value={timesPerWeek}
            onChangeText={setTimesPerWeek}
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Points (default: 10)"
            placeholderTextColor={colors.textSecondary}
            value={points}
            onChangeText={setPoints}
            keyboardType="number-pad"
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

        <Pressable style={styles.reassignButton} onPress={handleReassign}>
          <Text style={styles.buttonText}>Reassign All Chores</Text>
        </Pressable>

        <View style={styles.choresList}>
          {chores.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No chores added yet</Text>
            </View>
          ) : (
            chores.map((chore) => (
              <View key={chore.id} style={styles.choreCard}>
                <View style={styles.choreHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.choreName}>{chore.name}</Text>
                    <Text style={styles.choreDetails}>
                      {chore.timesPerWeek}x per week • {chore.points || 10} points
                    </Text>
                  </View>
                  <View style={styles.choreActions}>
                    <Pressable
                      style={styles.iconButton}
                      onPress={() =>
                        handleEdit(
                          chore.id,
                          chore.name,
                          chore.timesPerWeek,
                          chore.points || 10
                        )
                      }
                    >
                      <IconSymbol name="pencil" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      style={styles.iconButton}
                      onPress={() => handleDelete(chore.id, chore.name)}
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
