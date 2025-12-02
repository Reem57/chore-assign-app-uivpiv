
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/chore';
import { authService } from '@/services/auth.service';

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
    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in; load their profile without re-authenticating
        const user = await authService.getUserByUid(firebaseUser.uid);
        setCurrentUser(user);
        // Only admins need the full user list
        if (user?.isAdmin) {
          await loadUsers();
        } else {
          setUsers([]);
        }
      } else {
        setCurrentUser(null);
        setUsers([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUsers = async () => {
    const allUsers = await authService.getAllUsers();
    setUsers(allUsers);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    console.log('AuthContext login called with:', { username, password: '***', usernameType: typeof username, passwordType: typeof password });
    const user = await authService.signIn(username, password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const signup = async (username: string, password: string, name: string): Promise<boolean> => {
    const user = await authService.signUp(username, password, name);
    if (user) {
      setCurrentUser(user);
      await loadUsers();
      return true;
    }
    return false;
  };

  const logout = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  const isAdmin = () => {
    return currentUser?.isAdmin || false;
  };

  const setUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    const success = await authService.updateUserPassword(userId, newPassword);
    if (success && currentUser?.id === userId) {
      setCurrentUser({ ...currentUser, password: newPassword });
    }
    await loadUsers();
    return success;
  };

  const resetUserPassword = async (userId: string): Promise<string | null> => {
    const temp = await authService.resetUserPassword(userId);
    if (temp && currentUser?.id === userId) {
      setCurrentUser({ ...currentUser, password: temp });
    }
    await loadUsers();
    return temp;
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
