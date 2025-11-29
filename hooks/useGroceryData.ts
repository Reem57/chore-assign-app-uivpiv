import { useState, useEffect } from 'react';
import { GroceryItem } from '@/types/grocery';
import { groceriesService } from '@/services/groceries.service';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/services/firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

export function useGroceryData() {
  const { loading: authLoading } = useAuth();
  const [firebaseAuthed, setFirebaseAuthed] = useState<boolean>(!!auth.currentUser);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Track Firebase auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setFirebaseAuthed(!!u));
    return unsub;
  }, []);

  // Subscribe to real-time updates from Firebase once authenticated
  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!firebaseAuthed) {
      // Not authenticated with Firebase; don't subscribe but don't block UI
      setLoading(false);
      setGroceries([]);
      return;
    }

    const unsubscribe = groceriesService.subscribeToGroceries((updatedGroceries) => {
      setGroceries(updatedGroceries);
      setLoading(false);
    });

    return unsubscribe;
  }, [authLoading, firebaseAuthed]);

  const addItem = async (name: string, username: string, personId?: string) => {
    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: name.trim(),
      addedBy: username,
      addedByPersonId: personId,
      likedBy: [],
      createdAt: Date.now(),
      purchased: false,
    };
    await groceriesService.addGroceryItem(newItem);
  };

  const toggleLike = async (itemId: string, username: string) => {
    const item = groceries.find((g) => g.id === itemId);
    if (!item) return;

    const likedBy = item.likedBy.includes(username)
      ? item.likedBy.filter((u) => u !== username)
      : [...item.likedBy, username];

    await groceriesService.updateGroceryItem(itemId, { likedBy });
  };

  const togglePurchased = async (itemId: string, username: string) => {
    const item = groceries.find((g) => g.id === itemId);
    if (!item) return;

    const purchased = !item.purchased;
    const updates: any = { purchased };
    
    if (purchased) {
      updates.purchasedAt = Date.now();
      updates.purchasedBy = username;
    }
    // If unpurchasing, the updateGroceryItem function will filter out undefined values
    
    await groceriesService.updateGroceryItem(itemId, updates);
  };

  const deleteItem = async (itemId: string) => {
    await groceriesService.deleteGroceryItem(itemId);
  };

  const clearPurchased = async () => {
    await groceriesService.clearPurchasedItems();
  };

  return {
    groceries,
    loading,
    addItem,
    toggleLike,
    togglePurchased,
    deleteItem,
    clearPurchased,
  };
}
