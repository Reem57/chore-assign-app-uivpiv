
import { Chore, Person, Assignment } from '@/types/chore';

export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function assignChores(
  chores: Chore[],
  people: Person[],
  existingAssignments: Assignment[]
): Assignment[] {
  if (people.length === 0) {
    console.log('No people to assign chores to');
    return [];
  }

  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  // Filter out assignments for current week
  const currentWeekAssignments = existingAssignments.filter(
    (a) => a.weekNumber === currentWeek && a.year === currentYear
  );

  // If we already have assignments for this week AND we're not explicitly reassigning, return them
  if (currentWeekAssignments.length > 0 && existingAssignments.length > 0) {
    console.log('Using existing assignments for current week');
    return currentWeekAssignments;
  }

  // Create new assignments using round-robin balanced by task count, points, and day preferences
  const newAssignments: Assignment[] = [];
  
  // Track total points AND task count per person for fair distribution
  const pointsCount: Record<string, number> = {};
  const taskCount: Record<string, number> = {};
  people.forEach(p => {
    pointsCount[p.id] = 0;
    taskCount[p.id] = 0;
  });

  const today = now.getDay(); // 0=Sun, 6=Sat
  const remainingDaysInWeek = 7 - today;

  // Build a list of all chore occurrences with their ideal days
  const choreOccurrences: Array<{
    chore: Chore;
    dayOfWeek: number;
    points: number;
  }> = [];

  chores.forEach((chore) => {
    const totalOccurrences = chore.timesPerWeek || 1;
    const chorePoints = chore.points || 0;
    
    // Calculate how many occurrences should happen in the remaining days
    const remainingOccurrences = Math.round((totalOccurrences / 7) * remainingDaysInWeek);

    if (remainingOccurrences <= 0) {
      return;
    }

    for (let i = 0; i < remainingOccurrences; i++) {
      // Distribute chores fairly across the remaining days
      const dayOffset = remainingOccurrences > 1 
        ? Math.floor((i * (remainingDaysInWeek - 1)) / (remainingOccurrences - 1))
        : Math.floor(Math.random() * remainingDaysInWeek); // Random day if only 1 occurrence
      const dayOfWeek = Math.min(today + dayOffset, 6);
      
      choreOccurrences.push({
        chore,
        dayOfWeek,
        points: chorePoints,
      });
    }
  });

  // Shuffle to avoid always assigning in the same order
  choreOccurrences.sort(() => Math.random() - 0.5);

  choreOccurrences.forEach((occurrence) => {
    const chore = occurrence.chore;
    const dayOfWeek = occurrence.dayOfWeek;
    const chorePoints = occurrence.points;

    // If chore is assigned to a specific floor, only assign to people on that floor
    const eligiblePeople = chore.floor
      ? people.filter((p) => p.floor === chore.floor)
      : people;

    if (eligiblePeople.length === 0) {
      console.log(`Warning: No people available for chore "${chore.name}" on floor "${chore.floor}"`);
      return;
    }

    // Score each person based on task count, points, and day preferences
    // Lower score = better candidate
    const scoredPeople = eligiblePeople.map(p => {
      // Primary factor: task count (most important for equal distribution)
      // Secondary factor: points
      // We weight task count heavily to ensure equal task distribution
      let score = (taskCount[p.id] || 0) * 100 + (pointsCount[p.id] || 0);
      
      // Factor in day preferences (smaller impact to maintain fairness)
      const preference = p.dayPreferences?.[dayOfWeek];
      if (preference === 'unavailable') {
        // Strong penalty - try to avoid but don't break fairness
        score += chorePoints * 2; 
      } else if (preference === 'preferred') {
        // Small bonus for preferred days
        score -= chorePoints * 0.3;
      } else if (preference === 'available') {
        // Very small bonus for available
        score -= chorePoints * 0.1;
      }
      // No preference = neutral (score += 0)
      
      return { person: p, score };
    });

    // Find person with lowest score (best match)
    const bestMatch = scoredPeople.reduce((min, current) => 
      current.score < min.score ? current : min
    );
    
    const person = bestMatch.person;
    pointsCount[person.id] += chorePoints;
    taskCount[person.id] += 1;

    newAssignments.push({
      id: `${chore.id}-${person.id}-${currentWeek}-${Date.now()}-${Math.random()}`,
      choreId: chore.id,
      personId: person.id,
      weekNumber: currentWeek,
      year: currentYear,
      completed: false,
      assignedAt: Date.now(),
      dayOfWeek,
      points: chorePoints,
    });
  });

  console.log(`Created ${newAssignments.length} new assignments for week ${currentWeek}`);
  console.log('People count:', people.length);
  console.log('Total chores per week:', chores.reduce((sum, c) => sum + c.timesPerWeek, 0));
  console.log('Tasks per person:', taskCount);
  console.log('Points per person:', pointsCount);
  console.log('New assignments:', newAssignments.map(a => ({ choreId: a.choreId, personId: a.personId, points: a.points, dayOfWeek: a.dayOfWeek })));
  
  return newAssignments;
}

export function getAssignmentsByPerson(
  assignments: Assignment[],
  personId: string
): Assignment[] {
  return assignments.filter((a) => a.personId === personId);
}

export function getChoresByPerson(
  assignments: Assignment[],
  chores: Chore[],
  personId: string
): Chore[] {
  const personAssignments = getAssignmentsByPerson(assignments, personId);
  const choreIds = personAssignments.map((a) => a.choreId);
  return chores.filter((c) => choreIds.includes(c.id));
}
