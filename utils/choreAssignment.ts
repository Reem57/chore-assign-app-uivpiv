
import { Chore, Person, Assignment } from '@/types/chore';

export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Calculate time slots for assignments to avoid overlap
function calculateTimeSlots(
  timesPerWeek: number,
  weekStartTime: number
): { startTime: number; endTime: number }[] {
  const weekDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  const slotDuration = weekDuration / timesPerWeek;
  
  const slots: { startTime: number; endTime: number }[] = [];
  
  for (let i = 0; i < timesPerWeek; i++) {
    const startTime = weekStartTime + (i * slotDuration);
    const endTime = startTime + slotDuration;
    slots.push({ startTime, endTime });
  }
  
  return slots;
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

  // Calculate the start of the current week (Sunday at midnight)
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartTime = weekStart.getTime();

  // Filter out assignments for current week
  const currentWeekAssignments = existingAssignments.filter(
    (a) => a.weekNumber === currentWeek && a.year === currentYear
  );

  // If we already have assignments for this week, return them
  if (currentWeekAssignments.length > 0) {
    console.log('Using existing assignments for current week');
    return currentWeekAssignments;
  }

  // Create new assignments using round-robin with time constraints
  const newAssignments: Assignment[] = [];
  let personIndex = 0;

  chores.forEach((chore) => {
    // Calculate time slots for this chore
    const timeSlots = calculateTimeSlots(chore.timesPerWeek, weekStartTime);
    
    for (let i = 0; i < chore.timesPerWeek; i++) {
      const person = people[personIndex % people.length];
      const slot = timeSlots[i];
      
      newAssignments.push({
        id: `${chore.id}-${person.id}-${currentWeek}-${i}-${Date.now()}`,
        choreId: chore.id,
        personId: person.id,
        weekNumber: currentWeek,
        year: currentYear,
        completed: false,
        assignedAt: Date.now(),
        startTime: slot.startTime,
        endTime: slot.endTime,
      });

      personIndex++;
    }
  });

  console.log(`Created ${newAssignments.length} new assignments for week ${currentWeek}`);
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
