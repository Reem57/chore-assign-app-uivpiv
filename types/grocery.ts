export interface GroceryItem {
  id: string;
  name: string;
  addedBy: string; // username of person who added it
  addedByPersonId?: string; // optional person id
  likedBy: string[]; // array of usernames who liked this item
  createdAt: number;
  purchased: boolean;
  purchasedAt?: number;
  purchasedBy?: string;
}
