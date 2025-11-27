
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Chore, Person, Assignment, PointsData } from '@/types/chore';
import { assignChores, getWeekNumber } from '@/utils/choreAssignment';

const CHORES_KEY = '@chores';
const PEOPLE_KEY = '@people';
const ASSIGNMENTS_KEY = '@assignments';
const POINTS_KEY = '@points';
const RATED_KEY = '@rated_assignments';
const USER_PERSON_MAP_KEY = '@user_person_map';

export function useChoreData() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pointsData, setPointsData] = useState<PointsData[]>([]);
  const [localRatedAssignments, setLocalRatedAssignments] = useState<string[]>([]);
  const [userPersonMap, setUserPersonMap] = useState<Record<string, string>>({});
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
      const [choresData, peopleData, assignmentsData, pointsDataStr, ratedAssignments, mapData] = await Promise.all([
        AsyncStorage.getItem(CHORES_KEY),
        AsyncStorage.getItem(PEOPLE_KEY),
        AsyncStorage.getItem(ASSIGNMENTS_KEY),
        AsyncStorage.getItem(POINTS_KEY),
        AsyncStorage.getItem(RATED_KEY),
        AsyncStorage.getItem(USER_PERSON_MAP_KEY),
      ]);

      if (choresData) setChores(JSON.parse(choresData));
      if (peopleData) setPeople(JSON.parse(peopleData));
      if (assignmentsData) setAssignments(JSON.parse(assignmentsData));
      if (pointsDataStr) setPointsData(JSON.parse(pointsDataStr));
      if (ratedAssignments) setLocalRatedAssignments(JSON.parse(ratedAssignments));
      if (mapData) setUserPersonMap(JSON.parse(mapData));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await loadData();
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

  const saveLocalRated = async (rated: string[]) => {
    try {
      await AsyncStorage.setItem(RATED_KEY, JSON.stringify(rated));
    } catch (error) {
      console.error('Error saving rated assignments:', error);
    }
  };

  const saveUserPersonMap = async (map: Record<string, string>) => {
    try {
      await AsyncStorage.setItem(USER_PERSON_MAP_KEY, JSON.stringify(map));
    } catch (error) {
      console.error('Error saving user-person map:', error);
    }
  };

  const linkUserToPerson = async (username: string, personId: string) => {
    const key = username.trim().toLowerCase();
    const updated = { ...userPersonMap, [key]: personId };
    setUserPersonMap(updated);
    await saveUserPersonMap(updated);
  };

  const getPersonForUsername = (username?: string): Person | undefined => {
    if (!username) return undefined;
    const key = username.trim().toLowerCase();
    // 1) mapping takes precedence
    const mappedId = userPersonMap[key];
    if (mappedId) {
      const byId = people.find((p) => p.id === mappedId);
      if (byId) return byId;
    }
    // 2) tolerant name match
    const uname = key;
    const exact = people.find((p) => p.name && p.name.trim().toLowerCase() === uname);
    if (exact) return exact;
    const contains = people.find((p) => p.name && p.name.trim().toLowerCase().includes(uname));
    if (contains) return contains;
    const reverseContains = people.find((p) => p.name && uname.includes(p.name.trim().toLowerCase()));
    if (reverseContains) return reverseContains;
    return undefined;
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
        const base = chore?.points || 10;
        // If there are ratings, compute average and apply penalty if avg < 3
        const ratings = a.ratings || [];
        let penalty = 0;
        if (ratings.length > 0) {
          const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
          if (avg < 3) {
            penalty = Math.round((3 - avg) * base);
          }
        }
        const net = Math.max(0, base - penalty);
        return sum + net;
      }, 0);

      // Calculate yearly points (all completed assignments this year)
      const yearlyAssignments = personAssignments.filter(
        (a) => a.year === currentYear && a.completed
      );
      const yearlyPoints = yearlyAssignments.reduce((sum, a) => {
        const chore = chores.find((c) => c.id === a.choreId);
        const base = chore?.points || 10;
        const ratings = a.ratings || [];
        let penalty = 0;
        if (ratings.length > 0) {
          const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
          if (avg < 3) {
            penalty = Math.round((3 - avg) * base);
          }
        }
        const net = Math.max(0, base - penalty);
        return sum + net;
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

  const addRating = (assignmentId: string, rating: number) => {
    // rating should be 1..5
    if (rating < 1 || rating > 5) return;

    const updatedAssignments = assignments.map((a) => {
      if (a.id === assignmentId) {
        const existing = a.ratings || [];
        return { ...a, ratings: [...existing, rating] };
      }
      return a;
    });

    setAssignments(updatedAssignments);
    saveAssignments(updatedAssignments);

    // Mark locally rated to prevent duplicate ratings from this device
    if (!localRatedAssignments.includes(assignmentId)) {
      const next = [...localRatedAssignments, assignmentId];
      setLocalRatedAssignments(next);
      saveLocalRated(next);
    }
  };

  const hasLocallyRated = (assignmentId: string) => {
    return localRatedAssignments.includes(assignmentId);
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

  const addChore = (name: string, timesPerWeek: number, points: number = 10, description: string = '', floor: string = '') => {
    const newChore: Chore = {
      id: Date.now().toString(),
      name,
      description,
      timesPerWeek,
      points,
      createdAt: Date.now(),
      floor: floor || undefined,
    };
    const updatedChores = [...chores, newChore];
    setChores(updatedChores);
    saveChores(updatedChores);
  };

  const updateChore = (id: string, name: string, timesPerWeek: number, points: number = 10, description: string = '', floor: string = '') => {
    const updatedChores = chores.map((c) =>
      c.id === id ? { ...c, name, timesPerWeek, points, description, floor: floor || undefined } : c
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

  const addPerson = (name: string, floor?: string) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      createdAt: Date.now(),
      floor,
    };
    const updatedPeople = [...people, newPerson];
    setPeople(updatedPeople);
    savePeople(updatedPeople);
  };

  const updatePerson = (id: string, name: string, floor?: string) => {
    const updatedPeople = people.map((p) =>
      p.id === id ? { ...p, name, floor } : p
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

  const reassignChores = async () => {
    // Force create new assignments for current week only, clearing all current week assignments
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();
    
    // Keep only previous weeks' assignments
    const previousAssignments = assignments.filter(
      (a) => !(a.weekNumber === currentWeek && a.year === currentYear)
    );
    
    // Create completely fresh assignments (pass empty array to force creation)
    const newCurrentWeekAssignments = assignChores(chores, people, []);
    
    // Combine previous weeks with new current week assignments
    const allAssignments = [...previousAssignments, ...newCurrentWeekAssignments];
    
    console.log('Reassigning chores - total assignments after reassign:', allAssignments.length);
    console.log('Current week assignments:', newCurrentWeekAssignments.length);
    
    setAssignments(allAssignments);
    try {
      await saveAssignments(allAssignments);
    } catch (err) {
      console.error('Failed saving assignments after reassign:', err);
      throw err;
    }
    return allAssignments.length;
  };

  return {
    chores,
    people,
    assignments,
    pointsData,
    loading,
    userPersonMap,
    addChore,
    updateChore,
    deleteChore,
    addPerson,
    updatePerson,
    deletePerson,
    toggleChoreCompletion,
    reassignChores,
    addRating,
    hasLocallyRated,
    refreshData,
    getPersonPoints,
    getPersonForUsername,
    linkUserToPerson,
  };
}
