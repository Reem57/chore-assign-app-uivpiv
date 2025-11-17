
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

  // Create new assignments using round-robin
  const newAssignments: Assignment[] = [];
  let personIndex = 0;

  chores.forEach((chore) => {
    // If chore is assigned to a specific floor, only assign to people on that floor
    const eligiblePeople = chore.floor
      ? people.filter((p) => p.floor === chore.floor)
      : people;

    if (eligiblePeople.length === 0) {
      console.log(`Warning: No people available for chore "${chore.name}" on floor "${chore.floor}"`);
      return;
    }

    // Spread chore occurrences across the week: compute dayOfWeek for each occurrence
    // days are 0 (Sunday) .. 6 (Saturday)
    const occurrences = chore.timesPerWeek || 1;
    for (let i = 0; i < occurrences; i++) {
      // Distribute days fairly across the week
      const dayOfWeek = Math.floor((i * 7) / occurrences) % 7;

      const person = eligiblePeople[personIndex % eligiblePeople.length];

      newAssignments.push({
        id: `${chore.id}-${person.id}-${currentWeek}-${i}-${Date.now()}`,
        choreId: chore.id,
        personId: person.id,
        weekNumber: currentWeek,
        year: currentYear,
        completed: false,
        assignedAt: Date.now(),
        dayOfWeek,
      });

      personIndex++;
    }
  });

  console.log(`Created ${newAssignments.length} new assignments for week ${currentWeek}`);
  console.log('People count:', people.length);
  console.log('Total chores per week:', chores.reduce((sum, c) => sum + c.timesPerWeek, 0));
  console.log('New assignments:', newAssignments.map(a => ({ choreId: a.choreId, personId: a.personId })));
  
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
