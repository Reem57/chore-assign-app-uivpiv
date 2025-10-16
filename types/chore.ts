
export interface Chore {
  id: string;
  name: string;
  timesPerWeek: number;
  createdAt: number;
}

export interface Person {
  id: string;
  name: string;
  createdAt: number;
}

export interface Assignment {
  id: string;
  choreId: string;
  personId: string;
  weekNumber: number;
  year: number;
  completed: boolean;
  assignedAt: number;
}
