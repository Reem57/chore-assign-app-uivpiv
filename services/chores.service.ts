import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  getDocs,
  updateDoc,
  writeBatch,
  deleteField
} from 'firebase/firestore';
import { db } from './firebase.config';
import { Chore, Person, Assignment } from '@/types/chore';

export const choresService = {
  // Subscribe to chores (real-time)
  subscribeToChores(callback: (chores: Chore[]) => void) {
    const q = query(collection(db, 'chores'));
    return onSnapshot(
      q,
      (snapshot) => {
        const chores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chore));
        callback(chores);
      },
      (error: any) => {
        if (error.code === 'permission-denied') {
          console.error('Permission denied: Check Firestore rules. User must be authenticated.', error);
        } else {
          console.warn('Chores snapshot error:', error);
        }
        callback([]);
      }
    );
  },

  // Subscribe to people (real-time)
  subscribeToPeople(callback: (people: Person[]) => void) {
    const q = query(collection(db, 'people'));
    return onSnapshot(
      q,
      (snapshot) => {
        const people = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Person));
        callback(people);
      },
      (error: any) => {
        if (error.code === 'permission-denied') {
          console.error('Permission denied: Check Firestore rules. User must be authenticated.', error);
        } else {
          console.warn('People snapshot error:', error);
        }
        callback([]);
      }
    );
  },

  // Subscribe to assignments (real-time)
  subscribeToAssignments(callback: (assignments: Assignment[]) => void) {
    const q = query(collection(db, 'assignments'));
    return onSnapshot(
      q,
      (snapshot) => {
        const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
        callback(assignments);
      },
      (error: any) => {
        if (error.code === 'permission-denied') {
          console.error('Permission denied: Check Firestore rules. User must be authenticated.', error);
        } else {
          console.warn('Assignments snapshot error:', error);
        }
        callback([]);
      }
    );
  },

  // Add chore
  async addChore(chore: Chore): Promise<void> {
    // Remove undefined fields
    const cleanChore = Object.fromEntries(
      Object.entries(chore).filter(([_, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'chores', chore.id), cleanChore);
  },

  // Update chore
  async updateChore(id: string, updates: Partial<Chore>): Promise<void> {
    // Remove undefined fields
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, 'chores', id), cleanUpdates);
  },

  // Delete chore
  async deleteChore(id: string): Promise<void> {
    console.log('deleteChore: Deleting chore:', id);
    try {
      await deleteDoc(doc(db, 'chores', id));
      console.log('deleteChore: Chore deleted, now deleting assignments');
      // Delete associated assignments
      const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
      console.log('deleteChore: Found', assignmentsSnapshot.docs.length, 'total assignments');
      const batch = writeBatch(db);
      let deleteCount = 0;
      assignmentsSnapshot.docs.forEach((assignmentDoc) => {
        const assignment = assignmentDoc.data() as Assignment;
        if (assignment.choreId === id) {
          batch.delete(doc(db, 'assignments', assignmentDoc.id));
          deleteCount++;
        }
      });
      console.log('deleteChore: Deleting', deleteCount, 'assignments for this chore');
      await batch.commit();
      console.log('deleteChore: Successfully deleted chore and assignments');
    } catch (error) {
      console.error('deleteChore: Error deleting chore:', error);
      throw error;
    }
  },

  // Add person
  async addPerson(person: Person): Promise<void> {
    // Remove undefined fields
    const cleanPerson = Object.fromEntries(
      Object.entries(person).filter(([_, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'people', person.id), cleanPerson);
  },

  // Update person
  async updatePerson(id: string, updates: Partial<Person>): Promise<void> {
    // Remove undefined fields
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, 'people', id), cleanUpdates);
  },

  // Delete person
  async deletePerson(id: string): Promise<void> {
    await deleteDoc(doc(db, 'people', id));
    // Delete associated assignments
    const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
    const batch = writeBatch(db);
    assignmentsSnapshot.docs.forEach((assignmentDoc) => {
      const assignment = assignmentDoc.data() as Assignment;
      if (assignment.personId === id) {
        batch.delete(doc(db, 'assignments', assignmentDoc.id));
      }
    });
    await batch.commit();
  },

  // Add/Update assignment
  async saveAssignment(assignment: Assignment): Promise<void> {
    await setDoc(doc(db, 'assignments', assignment.id), assignment);
  },

  // Update assignment (toggle completion, add ratings, etc.)
  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<void> {
    // Remove undefined fields
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, 'assignments', id), cleanUpdates);
  },

  // Batch save assignments (for reassignment)
  async saveAssignments(assignments: Assignment[]): Promise<void> {
    const batch = writeBatch(db);
    assignments.forEach((assignment) => {
      const assignmentRef = doc(db, 'assignments', assignment.id);
      batch.set(assignmentRef, assignment);
    });
    await batch.commit();
  },

  // Delete assignments for current week (for reassignment)
  async deleteCurrentWeekAssignments(weekNumber: number, year: number): Promise<void> {
    const assignmentsSnapshot = await getDocs(collection(db, 'assignments'));
    const batch = writeBatch(db);
    assignmentsSnapshot.docs.forEach((assignmentDoc) => {
      const assignment = assignmentDoc.data() as Assignment;
      if (assignment.weekNumber === weekNumber && assignment.year === year) {
        batch.delete(doc(db, 'assignments', assignmentDoc.id));
      }
    });
    await batch.commit();
  },
};
