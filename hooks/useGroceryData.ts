import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GroceryItem } from '@/types/grocery';

const GROCERIES_KEY = '@groceries';

export function useGroceryData() {
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroceries();
  }, []);

  const loadGroceries = async () => {
    try {
      const data = await AsyncStorage.getItem(GROCERIES_KEY);
      if (data) {
        setGroceries(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading groceries:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGroceries = async (items: GroceryItem[]) => {
    try {
      await AsyncStorage.setItem(GROCERIES_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving groceries:', error);
    }
  };

  const addItem = (name: string, username: string, personId?: string) => {
    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: name.trim(),
      addedBy: username,
      addedByPersonId: personId,
      likedBy: [],
      createdAt: Date.now(),
      purchased: false,
    };
    const updated = [...groceries, newItem];
    setGroceries(updated);
    saveGroceries(updated);
  };

  const toggleLike = (itemId: string, username: string) => {
    const updated = groceries.map((item) => {
      if (item.id === itemId) {
        const likedBy = item.likedBy.includes(username)
          ? item.likedBy.filter((u) => u !== username)
          : [...item.likedBy, username];
        return { ...item, likedBy };
      }
      return item;
    });
    setGroceries(updated);
    saveGroceries(updated);
  };

  const togglePurchased = (itemId: string, username: string) => {
    const updated = groceries.map((item) => {
      if (item.id === itemId) {
        const purchased = !item.purchased;
        return {
          ...item,
          purchased,
          purchasedAt: purchased ? Date.now() : undefined,
          purchasedBy: purchased ? username : undefined,
        };
      }
      return item;
    });
    setGroceries(updated);
    saveGroceries(updated);
  };

  const deleteItem = (itemId: string) => {
    const updated = groceries.filter((item) => item.id !== itemId);
    setGroceries(updated);
    saveGroceries(updated);
  };

  const clearPurchased = () => {
    const updated = groceries.filter((item) => !item.purchased);
    setGroceries(updated);
    saveGroceries(updated);
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
