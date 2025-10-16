
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chore, Person, Assignment, PointsData } from '@/types/chore';
import { assignChores, getWeekNumber } from '@/utils/choreAssignment';

const CHORES_KEY = '@chores';
const PEOPLE_KEY = '@people';
const ASSIGNMENTS_KEY = '@assignments';
const POINTS_KEY = '@points';

export function useChoreData() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pointsData, setPointsData] = useState<PointsData[]>([]);
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

  // Update points when assignments change
  useEffect(() => {
    if (!loading) {
      updatePoints();
    }
  }, [assignments, loading]);

  const loadData = async () => {
    try {
      const [choresData, peopleData, assignmentsData, pointsDataStr] = await Promise.all([
        AsyncStorage.getItem(CHORES_KEY),
        AsyncStorage.getItem(PEOPLE_KEY),
        AsyncStorage.getItem(ASSIGNMENTS_KEY),
        AsyncStorage.getItem(POINTS_KEY),
      ]);

      if (choresData) setChores(JSON.parse(choresData));
      if (peopleData) setPeople(JSON.parse(peopleData));
      if (assignmentsData) setAssignments(JSON.parse(assignmentsData));
      if (pointsDataStr) setPointsData(JSON.parse(pointsDataStr));
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

  const savePointsData = async (newPointsData: PointsData[]) => {
    try {
      await AsyncStorage.setItem(POINTS_KEY, JSON.stringify(newPointsData));
    } catch (error) {
      console.error('Error saving points data:', error);
    }
  };

  const updatePoints = () => {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    const updatedPointsData: PointsData[] = [];

    people.forEach((person) => {
      // Get all assignments for this person
      const personAssignments = assignments.filter((a) => a.personId === person.id);

      // Calculate weekly points (current week only)
      const weeklyAssignments = personAssignments.filter(
        (a) => a.weekNumber === currentWeek && a.year === currentYear && a.completed
      );
      const weeklyPoints = weeklyAssignments.reduce((sum, a) => {
        const chore = chores.find((c) => c.id === a.choreId);
        return sum + (chore?.points || 10);
      }, 0);

      // Calculate yearly points (all completed assignments this year)
      const yearlyAssignments = personAssignments.filter(
        (a) => a.year === currentYear && a.completed
      );
      const yearlyPoints = yearlyAssignments.reduce((sum, a) => {
        const chore = chores.find((c) => c.id === a.choreId);
        return sum + (chore?.points || 10);
      }, 0);

      updatedPointsData.push({
        personId: person.id,
        weekNumber: currentWeek,
        year: currentYear,
        weeklyPoints,
        yearlyPoints,
        lastUpdated: Date.now(),
      });
    });

    setPointsData(updatedPointsData);
    savePointsData(updatedPointsData);
  };

  const getPersonPoints = (personId: string) => {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    const personPointsData = pointsData.find(
      (pd) => pd.personId === personId && pd.weekNumber === currentWeek && pd.year === currentYear
    );

    return {
      weeklyPoints: personPointsData?.weeklyPoints || 0,
      yearlyPoints: personPointsData?.yearlyPoints || 0,
    };
  };

  const addChore = (name: string, timesPerWeek: number, points: number = 10) => {
    const newChore: Chore = {
      id: Date.now().toString(),
      name,
      timesPerWeek,
      points,
      createdAt: Date.now(),
    };
    const updatedChores = [...chores, newChore];
    setChores(updatedChores);
    saveChores(updatedChores);
  };

  const updateChore = (id: string, name: string, timesPerWeek: number, points: number = 10) => {
    const updatedChores = chores.map((c) =>
      c.id === id ? { ...c, name, timesPerWeek, points } : c
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

    // Remove points data for this person
    const updatedPointsData = pointsData.filter((pd) => pd.personId !== id);
    setPointsData(updatedPointsData);
    savePointsData(updatedPointsData);
  };

  const toggleChoreCompletion = (assignmentId: string) => {
    const updatedAssignments = assignments.map((a) => {
      if (a.id === assignmentId) {
        const completed = !a.completed;
        return {
          ...a,
          completed,
          completedAt: completed ? Date.now() : undefined,
        };
      }
      return a;
    });
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
    pointsData,
    loading,
    addChore,
    updateChore,
    deleteChore,
    addPerson,
    updatePerson,
    deletePerson,
    toggleChoreCompletion,
    reassignChores,
    getPersonPoints,
  };
}
