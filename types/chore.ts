
export interface Chore {
  id: string;
  name: string;
  timesPerWeek: number;
  createdAt: number;
  points?: number;
}

export interface Person {
  id: string;
  name: string;
  createdAt: number;
  isAdmin?: boolean;
  weeklyPoints?: number;
  yearlyPoints?: number;
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
  points?: number;
  startTime?: number; // Unix timestamp for when this assignment period starts
  endTime?: number; // Unix timestamp for when this assignment period ends
  notificationId?: string; // ID of the scheduled notification
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
