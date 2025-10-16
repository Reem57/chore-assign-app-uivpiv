
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chore, Person, Assignment } from '@/types/chore';
import { assignChores } from '@/utils/choreAssignment';

const CHORES_KEY = '@chores';
const PEOPLE_KEY = '@people';
const ASSIGNMENTS_KEY = '@assignments';

export function useChoreData() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from storage
  useEffect(() => {
    loadData();
  }, []);

  // Auto-assign chores when chores or people change
  useEffect(() => {
    if (!loading && chores.length > 0 && people.length > 0) {
      const newAssignments = assignChores(chores, people, assignments);
      if (newAssignments.length !== assignments.length) {
        setAssignments(newAssignments);
        saveAssignments(newAssignments);
      }
    }
  }, [chores, people, loading]);

  const loadData = async () => {
    try {
      const [choresData, peopleData, assignmentsData] = await Promise.all([
        AsyncStorage.getItem(CHORES_KEY),
        AsyncStorage.getItem(PEOPLE_KEY),
        AsyncStorage.getItem(ASSIGNMENTS_KEY),
      ]);

      if (choresData) setChores(JSON.parse(choresData));
      if (peopleData) setPeople(JSON.parse(peopleData));
      if (assignmentsData) setAssignments(JSON.parse(assignmentsData));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveChores = async (newChores: Chore[]) => {
    try {
      await AsyncStorage.setItem(CHORES_KEY, JSON.stringify(newChores));
    } catch (error) {
      console.error('Error saving chores:', error);
    }
  };

  const savePeople = async (newPeople: Person[]) => {
    try {
      await AsyncStorage.setItem(PEOPLE_KEY, JSON.stringify(newPeople));
    } catch (error) {
      console.error('Error saving people:', error);
    }
  };

  const saveAssignments = async (newAssignments: Assignment[]) => {
    try {
      await AsyncStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(newAssignments));
    } catch (error) {
      console.error('Error saving assignments:', error);
    }
  };

  const addChore = (name: string, timesPerWeek: number) => {
    const newChore: Chore = {
      id: Date.now().toString(),
      name,
      timesPerWeek,
      createdAt: Date.now(),
    };
    const updatedChores = [...chores, newChore];
    setChores(updatedChores);
    saveChores(updatedChores);
  };

  const updateChore = (id: string, name: string, timesPerWeek: number) => {
    const updatedChores = chores.map((c) =>
      c.id === id ? { ...c, name, timesPerWeek } : c
    );
    setChores(updatedChores);
    saveChores(updatedChores);
  };

  const deleteChore = (id: string) => {
    const updatedChores = chores.filter((c) => c.id !== id);
    setChores(updatedChores);
    saveChores(updatedChores);

    // Remove assignments for this chore
    const updatedAssignments = assignments.filter((a) => a.choreId !== id);
    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);
  };

  const addPerson = (name: string) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      createdAt: Date.now(),
    };
    const updatedPeople = [...people, newPerson];
    setPeople(updatedPeople);
    savePeople(updatedPeople);
  };

  const updatePerson = (id: string, name: string) => {
    const updatedPeople = people.map((p) =>
      p.id === id ? { ...p, name } : p
    );
    setPeople(updatedPeople);
    savePeople(updatedPeople);
  };

  const deletePerson = (id: string) => {
    const updatedPeople = people.filter((p) => p.id !== id);
    setPeople(updatedPeople);
    savePeople(updatedPeople);

    // Remove assignments for this person
    const updatedAssignments = assignments.filter((a) => a.personId !== id);
    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);
  };

  const toggleChoreCompletion = (assignmentId: string) => {
    const updatedAssignments = assignments.map((a) =>
      a.id === assignmentId ? { ...a, completed: !a.completed } : a
    );
    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);
  };

  const reassignChores = () => {
    const newAssignments = assignChores(chores, people, []);
    setAssignments(newAssignments);
    saveAssignments(newAssignments);
  };

  return {
    chores,
    people,
    assignments,
    loading,
    addChore,
    updateChore,
    deleteChore,
    addPerson,
    updatePerson,
    deletePerson,
    toggleChoreCompletion,
    reassignChores,
  };
}
