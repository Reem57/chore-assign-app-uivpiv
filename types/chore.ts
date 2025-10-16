
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
  isAdmin?: boolean;
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

export interface User {
  id: string;
  username: string;
  password: string;
  personId: string;
  isAdmin: boolean;
  createdAt: number;
}
