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
      console.log('signIn called with:', { username, usernameType: typeof username, passwordType: typeof password });
      
      // Validate inputs
      if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
        console.error('Invalid username or password type');
        return null;
      }
      
      // Use email as-is if it contains @, otherwise convert username to email format
      const email = username.includes('@') ? username : `${username.toLowerCase()}@choreapp.com`;
      console.log('Attempting sign in with email:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful, fetching user doc');
      
      // Try to get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      console.log('User doc exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data retrieved:', { id: userDoc.id, username: userData?.username, personId: userData?.personId });
        
        const existingUser = { id: userDoc.id, ...userData } as User;
        
        // Validate user data
        if (!existingUser.username || typeof existingUser.username !== 'string') {
          console.error('Invalid user data: missing or invalid username');
          return null;
        }
        
        // Ensure a Person document exists matching existingUser.personId; if not, try to attach or create
        // Firestore doc IDs must be strings; coerce if stored as number
        const personId = String((existingUser as any).personId);
        // If the saved user doc has a numeric personId, normalize it to string
        if ((existingUser as any).personId !== personId) {
          try {
            await updateDoc(doc(db, 'users', existingUser.id), { personId });
          } catch (e) {
            console.warn('Unable to normalize personId to string:', e);
          }
          (existingUser as any).personId = personId;
        }
        const personRef = doc(db, 'people', personId);
        const personSnap = await getDoc(personRef);
        console.log('Person doc exists:', personSnap.exists());
        
        if (!personSnap.exists()) {
          // Try to find a person by name first
          const peopleSnap = await getDocs(collection(db, 'people'));
          const match = peopleSnap.docs.find(d => {
            const data = d.data() as any;
            const dataName = data?.name;
            const userName = existingUser?.username;
            
            // Safe string comparison
            if (typeof dataName === 'string' && typeof userName === 'string') {
              return dataName.trim().toLowerCase() === userName.trim().toLowerCase();
            }
            return false;
          });
          if (match) {
            // Update user.personId to match found person
            await updateDoc(doc(db, 'users', existingUser.id), { personId: match.id });
            existingUser.personId = match.id;
          } else {
            // Create new Person doc (use normalized string ID)
            const newPersonId = personId;
            await setDoc(doc(db, 'people', newPersonId), {
              id: newPersonId,
              name: existingUser.username,
              createdAt: Date.now(),
            });
          }
        }
        return existingUser;
      }
      
      // If no Firestore document exists (manually created in Firebase Console), create one
      const newUser: User = {
        id: userCredential.user.uid,
        username: username.includes('@') ? username.split('@')[0] : username,
        password,
        personId: Date.now().toString(),
        isAdmin: username.toLowerCase() === ADMIN_USERNAME.toLowerCase() || email === ADMIN_EMAIL,
        createdAt: Date.now(),
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      // Create corresponding Person doc
      await setDoc(doc(db, 'people', newUser.personId), {
        id: newUser.personId,
        name: newUser.username,
        createdAt: Date.now(),
      });
      return newUser;
    } catch (error: any) {
      console.error('Sign in error:', error?.code || 'unknown', error?.message || String(error));
      return null;
    }
  },

  // Sign up new user
  async signUp(username: string, password: string, name: string): Promise<User | null> {
    try {
      // Basic validation and normalization
      if (!username || typeof username !== 'string') {
        console.error('Sign up error: username missing or invalid');
        return null;
      }
      if (!password || typeof password !== 'string' || password.length < 4) {
        console.error('Sign up error: password missing or too short');
        return null;
      }
      const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
      if (!cleanUsername) {
        console.error('Sign up error: username empty after trimming');
        return null;
      }

      // Prevent admin username
      if (cleanUsername === ADMIN_USERNAME.toLowerCase()) {
        console.error('Sign up error: Admin username cannot be used');
        return null;
      }

      // If the provided username already looks like an email, use it directly
      const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@choreapp.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const newUser: User = {
        id: userCredential.user.uid,
        username: cleanUsername.includes('@') ? cleanUsername.split('@')[0] : cleanUsername,
        password,
        personId: Date.now().toString(),
        isAdmin: false,
        createdAt: Date.now(),
      };
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      } catch (e: any) {
        console.error('Sign up error: failed to write users doc', e?.code, e?.message);
        throw e; // rethrow to surface permission-denied
      }
      // Create Person doc with provided name (fallback to username if blank)
      try {
        await setDoc(doc(db, 'people', newUser.personId), {
          id: newUser.personId,
          name: (typeof name === 'string' && name.trim()) ? name.trim() : newUser.username,
          createdAt: Date.now(),
        });
      } catch (e: any) {
        console.error('Sign up error: failed to write people doc', e?.code, e?.message);
        throw e;
      }
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
