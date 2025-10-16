
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/chore';

const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@current_user';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
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

  const login = async (username: string, password: string): Promise<boolean> => {
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
    // Check if username already exists
    const existingUser = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
      return false;
    }

    // First user is admin
    const isFirstUser = users.length === 0;

    const newUser: User = {
      id: Date.now().toString(),
      username,
      password,
      personId: Date.now().toString() + '_person',
      isAdmin: isFirstUser,
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
