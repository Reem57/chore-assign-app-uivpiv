
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/chore';

const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@current_user';

// Hardcoded admin credentials — change these to your preferred admin username/password
const ADMIN_USERNAME = 'Reem';
const ADMIN_PASSWORD = '110506';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  setUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => Promise<string | null>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const [usersData, currentUserData] = await Promise.all([
        AsyncStorage.getItem(USERS_KEY),
        AsyncStorage.getItem(CURRENT_USER_KEY),
      ]);

      if (usersData) {
        setUsers(JSON.parse(usersData));
      }
      if (currentUserData) {
        setCurrentUser(JSON.parse(currentUserData));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUsers = async (newUsers: User[]) => {
    try {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
      setUsers(newUsers);
    } catch (error) {
      console.error('Error saving users:', error);
    }
  };

  const saveCurrentUser = async (user: User | null) => {
    try {
      if (user) {
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(CURRENT_USER_KEY);
      }
      setCurrentUser(user);
    } catch (error) {
      console.error('Error saving current user:', error);
    }
  };

  const setUserPassword = async (userId: string, newPassword: string) => {
    try {
      const updatedUsers = users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u));
      await saveUsers(updatedUsers);
      // If the current user changed their own password, update currentUser
      if (currentUser && currentUser.id === userId) {
        await saveCurrentUser({ ...currentUser, password: newPassword });
      }
      return true;
    } catch (error) {
      console.error('Error setting user password:', error);
      return false;
    }
  };

  const resetUserPassword = async (userId: string) => {
    try {
      // generate a temporary 8-character alphanumeric password
      const temp = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 90 + 10).toString();
      const updatedUsers = users.map((u) => (u.id === userId ? { ...u, password: temp } : u));
      await saveUsers(updatedUsers);
      if (currentUser && currentUser.id === userId) {
        await saveCurrentUser({ ...currentUser, password: temp });
      }
      return temp;
    } catch (error) {
      console.error('Error resetting user password:', error);
      return null;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    // Check if trying to login as admin
    if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD) {
      const adminUser: User = {
        id: 'admin_id',
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        personId: 'admin_person_id',
        isAdmin: true,
        createdAt: Date.now(),
      };
      await saveCurrentUser(adminUser);
      return true;
    }

    // Check regular users
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (user) {
      await saveCurrentUser(user);
      return true;
    }
    return false;
  };

  const signup = async (username: string, password: string, name: string): Promise<boolean> => {
    // Prevent signup with admin username
    if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      return false;
    }

    // Check if username already exists
    const existingUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
      return false;
    }

    // All new signups are regular users (not admin)
    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      personId: Date.now().toString() + '_person',
      isAdmin: false,
      createdAt: Date.now(),
    };

    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);
    await saveCurrentUser(newUser);

    return true;
  };

  const logout = async () => {
    await saveCurrentUser(null);
  };

  const isAdmin = () => {
    return currentUser?.isAdmin || false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        signup,
        logout,
        isAdmin,
        setUserPassword,
        resetUserPassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
