
export interface Chore {
  id: string;
  name: string;
  description?: string;
  timesPerWeek: number;
  createdAt: number;
  points?: number;
  floor?: string; // Optional: if set, only people on this floor get assigned
}

export interface Person {
  id: string;
  name: string;
  createdAt: number;
  isAdmin?: boolean;
  weeklyPoints?: number;
  yearlyPoints?: number;
  floor?: string; // Optional: which floor the person lives on
}

export interface Assignment {
  id: string;
  choreId: string;
  personId: string;
  weekNumber: number;
  year: number;
  completed: boolean;
  assignedAt: number;
  completedAt?: number;
  dayOfWeek?: number; // 0 = Sunday, 6 = Saturday
  points?: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  personId: string;
  isAdmin: boolean;
  createdAt: number;
}

export interface PointsData {
  personId: string;
  weekNumber: number;
  year: number;
  weeklyPoints: number;
  yearlyPoints: number;
  lastUpdated: number;
}
