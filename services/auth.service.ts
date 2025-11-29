import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase.config';
import { User } from '@/types/chore';

const ADMIN_EMAIL = 'admin@choreapp.com';
const ADMIN_PASSWORD = '110506';
const ADMIN_USERNAME = 'Reem';

export const authService = {
  // Sign in user
  async signIn(username: string, password: string): Promise<User | null> {
    try {
      // Use email as-is if it contains @, otherwise convert username to email format
      const email = username.includes('@') ? username : `${username.toLowerCase()}@choreapp.com`;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Try to get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      
      // If no Firestore document exists (manually created in Firebase Console), create one
      const newUser: User = {
        id: userCredential.user.uid,
        username: username.includes('@') ? username.split('@')[0] : username,
        password, // Store password for display
        personId: Date.now().toString(),
        isAdmin: username.toLowerCase() === ADMIN_USERNAME.toLowerCase() || email === ADMIN_EMAIL,
        createdAt: Date.now(),
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      return newUser;
    } catch (error: any) {
      console.error('Sign in error:', error.code, error.message);
      return null;
    }
  },

  // Sign up new user
  async signUp(username: string, password: string, name: string): Promise<User | null> {
    try {
      // Prevent admin username
      if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
        console.error('Sign up error: Admin username cannot be used');
        return null;
      }

      const email = `${username.toLowerCase()}@choreapp.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const newUser: User = {
        id: userCredential.user.uid,
        username,
        password, // Store for display purposes (not best practice but matching your requirements)
        personId: Date.now().toString(),
        isAdmin: false,
        createdAt: Date.now(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      return newUser;
    } catch (error: any) {
      console.error('Sign up error:', error.code, error.message);
      return null;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    await signOut(auth);
  },

  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  // Get a single user by Firebase UID
  async getUserByUid(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user by uid:', error);
      return null;
    }
  },

  // Update user password
  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, 'users', userId), { password: newPassword });
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  },

  // Reset user password (generate temporary)
  async resetUserPassword(userId: string): Promise<string | null> {
    try {
      const temp = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 90 + 10).toString();
      await updateDoc(doc(db, 'users', userId), { password: temp });
      return temp;
    } catch (error) {
      console.error('Error resetting password:', error);
      return null;
    }
  },

  // Auth state listener
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
