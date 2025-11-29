import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  updateDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase.config';
import { GroceryItem } from '@/types/grocery';

export const groceriesService = {
  // Subscribe to groceries (real-time)
  subscribeToGroceries(callback: (groceries: GroceryItem[]) => void) {
    const q = query(collection(db, 'groceries'));
    return onSnapshot(
      q,
      (snapshot) => {
        const groceries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroceryItem));
        callback(groceries);
      },
      (error) => {
        console.warn('Groceries snapshot error:', error);
        callback([]);
      }
    );
  },

  // Add grocery item
  async addGroceryItem(item: GroceryItem): Promise<void> {
    await setDoc(doc(db, 'groceries', item.id), item);
  },

  // Update grocery item
  async updateGroceryItem(id: string, updates: Partial<GroceryItem>): Promise<void> {
    // Remove undefined fields
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, 'groceries', id), cleanUpdates);
  },

  // Delete grocery item
  async deleteGroceryItem(id: string): Promise<void> {
    await deleteDoc(doc(db, 'groceries', id));
  },

  // Clear all purchased items
  async clearPurchasedItems(): Promise<void> {
    const groceriesSnapshot = await getDocs(collection(db, 'groceries'));
    const batch = writeBatch(db);
    groceriesSnapshot.docs.forEach((groceryDoc) => {
      const item = groceryDoc.data() as GroceryItem;
      if (item.purchased) {
        batch.delete(doc(db, 'groceries', groceryDoc.id));
      }
    });
    await batch.commit();
  },
};
