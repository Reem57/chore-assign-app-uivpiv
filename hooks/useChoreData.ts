
import { useState, useEffect } from 'react';
import { Chore, Person, Assignment, PointsData } from '@/types/chore';
import { assignChores, getWeekNumber } from '@/utils/choreAssignment';
import { choresService } from '@/services/chores.service';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/services/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

export function useChoreData() {
  const { currentUser, loading: authLoading } = useAuth();
  const [firebaseAuthed, setFirebaseAuthed] = useState<boolean>(!!auth.currentUser);
  const [chores, setChores] = useState<Chore[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [pointsData, setPointsData] = useState<PointsData[]>([]);
  const [localRatedAssignments, setLocalRatedAssignments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Track Firebase auth state (distinct from local admin mode)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setFirebaseAuthed(!!u));
    return unsub;
  }, []);

  // Subscribe to real-time updates from Firebase once Firebase auth is present
  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!firebaseAuthed) {
      // Not authenticated with Firebase; don't subscribe but don't block UI
      setLoading(false);
      setChores([]);
      setPeople([]);
      setAssignments([]);
      return;
    }

    setLoading(true);

    const unsubscribeChores = choresService.subscribeToChores((updatedChores) => {
      setChores(updatedChores);
    });

    const unsubscribePeople = choresService.subscribeToPeople((updatedPeople) => {
      setPeople(updatedPeople);
    });

    const unsubscribeAssignments = choresService.subscribeToAssignments((updatedAssignments) => {
      setAssignments(updatedAssignments);
      // Set loading to false only after first load of assignments
      setLoading(false);
    });

    return () => {
      unsubscribeChores();
      unsubscribePeople();
      unsubscribeAssignments();
    };
  }, [authLoading, firebaseAuthed]);

  // Auto-assign chores when chores or people change
  useEffect(() => {
    if (!loading && chores.length > 0 && people.length > 0) {
      const newAssignments = assignChores(chores, people, assignments);
      if (newAssignments.length !== assignments.length) {
        setAssignments(newAssignments);
        choresService.saveAssignments(newAssignments);
      }
    }
  }, [chores, people, loading]);

  // Update points when assignments change
  useEffect(() => {
    if (!loading) {
      updatePoints();
    }
  }, [assignments, loading]);

  const updatePoints = () => {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    const updatedPointsData: PointsData[] = [];

    people.forEach((person) => {
      const personAssignments = assignments.filter((a) => a.personId === person.id);

      const weeklyAssignments = personAssignments.filter(
        (a) => a.weekNumber === currentWeek && a.year === currentYear && a.completed
      );
      const weeklyPoints = weeklyAssignments.reduce((sum, a) => {
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
  };

  const addRating = async (assignmentId: string, rating: number) => {
    if (rating < 1 || rating > 5) return;

    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;

    const existing = assignment.ratings || [];
    await choresService.updateAssignment(assignmentId, {
      ratings: [...existing, rating],
    });

    if (!localRatedAssignments.includes(assignmentId)) {
      setLocalRatedAssignments([...localRatedAssignments, assignmentId]);
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

  const getPersonForUser = (): Person | undefined => {
    if (!currentUser) return undefined;
    return people.find(p => p.id === currentUser.personId);
  };

  const addChore = async (name: string, timesPerWeek: number, points: number = 10, description: string = '', floor: string = '') => {
    const newChore: Chore = {
      id: Date.now().toString(),
      name,
      description,
      timesPerWeek,
      points,
      createdAt: Date.now(),
      floor: floor || undefined,
    };
    await choresService.addChore(newChore);
  };

  const updateChore = async (id: string, name: string, timesPerWeek: number, points: number = 10, description: string = '', floor: string = '') => {
    await choresService.updateChore(id, {
      name,
      timesPerWeek,
      points,
      description,
      floor: floor || undefined,
    });
  };

  const deleteChore = async (id: string) => {
    await choresService.deleteChore(id);
  };

  const addPerson = async (name: string, floor?: string) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
      createdAt: Date.now(),
      floor,
    };
    await choresService.addPerson(newPerson);
  };

  const updatePerson = async (id: string, name: string, floor?: string) => {
    await choresService.updatePerson(id, { name, floor });
  };

  const deletePerson = async (id: string) => {
    await choresService.deletePerson(id);
  };

  const toggleChoreCompletion = async (assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) return;

    // Check if the assignment has a specific day assigned
    if (typeof assignment.dayOfWeek === 'number') {
      const today = new Date();
      const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Only allow completion on the assigned day
      if (currentDayOfWeek !== assignment.dayOfWeek) {
        return; // Silently fail - UI will prevent clicking
      }
    }

    const completed = !assignment.completed;
    const updates: any = { completed };
    
    // Add or remove completedAt field
    if (completed) {
      updates.completedAt = Date.now();
    }
    // Note: If uncompleting, the updateAssignment function will filter out undefined values
    // so we don't need to explicitly delete the field
    
    await choresService.updateAssignment(assignmentId, updates);
  };

  const canCompleteTask = (assignment: Assignment): { canComplete: boolean; reason?: 'future' | 'past' | 'today' } => {
    // If no specific day assigned, can complete anytime during the week
    if (typeof assignment.dayOfWeek !== 'number') {
      return { canComplete: true, reason: 'today' };
    }

    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    if (currentDayOfWeek === assignment.dayOfWeek) {
      return { canComplete: true, reason: 'today' };
    } else if (currentDayOfWeek < assignment.dayOfWeek) {
      return { canComplete: false, reason: 'future' };
    } else {
      return { canComplete: false, reason: 'past' };
    }
  };

  const reassignChores = async () => {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();
    
    // Delete current week assignments from Firebase
    await choresService.deleteCurrentWeekAssignments(currentWeek, currentYear);
    
    // Create new assignments
    const newCurrentWeekAssignments = assignChores(chores, people, []);
    
    // Save new assignments to Firebase
    await choresService.saveAssignments(newCurrentWeekAssignments);
    
    console.log('Reassigning chores - new assignments:', newCurrentWeekAssignments.length);
    
    return newCurrentWeekAssignments.length;
  };

  const refreshData = async () => {
    setLoading(true);
    // Firebase real-time listeners will automatically refresh the data
  };

  return {
    chores,
    people,
    assignments,
    pointsData,
    loading,
    // linking removed: rely on currentUser.personId
    addChore,
    updateChore,
    deleteChore,
    addPerson,
    updatePerson,
    deletePerson,
    toggleChoreCompletion,
    canCompleteTask,
    reassignChores,
    addRating,
    hasLocallyRated,
    refreshData,
    getPersonPoints,
    getPersonForUser,
  };
}
