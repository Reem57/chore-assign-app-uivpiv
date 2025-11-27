import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Platform, Alert } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useGroceryData } from '@/hooks/useGroceryData';
import { useAuth } from '@/contexts/AuthContext';

export default function GroceriesScreen() {
  const { groceries, loading, addItem, toggleLike, togglePurchased, deleteItem, clearPurchased } = useGroceryData();
  const { currentUser } = useAuth();
  const [newItemName, setNewItemName] = useState('');

  const handleAdd = () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }
    if (!currentUser) return;
    
    addItem(newItemName, currentUser.username, currentUser.personId);
    setNewItemName('');
  };

  const handleDelete = (itemId: string, itemName: string) => {
    Alert.alert(
      'Delete Item',
      `Remove "${itemName}" from the list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteItem(itemId) },
      ]
    );
  };

  const handleClearPurchased = () => {
    const purchasedCount = groceries.filter((g) => g.purchased).length;
    if (purchasedCount === 0) return;
    
    Alert.alert(
      'Clear Purchased',
      `Remove ${purchasedCount} purchased item${purchasedCount > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearPurchased },
      ]
    );
  };

  const activeItems = groceries.filter((g) => !g.purchased).sort((a, b) => b.likedBy.length - a.likedBy.length);
  const purchasedItems = groceries.filter((g) => g.purchased);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS !== 'ios' && styles.scrollContentWithTabBar,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Grocery List</Text>
          <Text style={styles.headerSubtitle}>
            Add items needed for the house
          </Text>
        </View>

        {/* Add Item Input */}
        <View style={styles.addCard}>
          <TextInput
            style={styles.input}
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="e.g., Paper towels, Milk, Eggs..."
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <IconSymbol name="plus.circle.fill" color={colors.card} size={24} />
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {/* Clear Purchased Button */}
        {purchasedItems.length > 0 && (
          <Pressable style={styles.clearButton} onPress={handleClearPurchased}>
            <IconSymbol name="trash" color={colors.danger} size={18} />
            <Text style={styles.clearButtonText}>Clear {purchasedItems.length} Purchased</Text>
          </Pressable>
        )}

        {/* Active Items */}
        {activeItems.length === 0 && purchasedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="cart" color={colors.textSecondary} size={48} />
            <Text style={styles.emptyStateTitle}>No Items Yet</Text>
            <Text style={styles.emptyStateText}>
              Add items your household needs to the list!
            </Text>
          </View>
        ) : (
          <>
            {activeItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Shopping List ({activeItems.length})
                </Text>
                <View style={styles.itemsList}>
                  {activeItems.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                      <Pressable
                        style={styles.checkbox}
                        onPress={() => currentUser && togglePurchased(item.id, currentUser.username)}
                      >
                        {item.purchased && (
                          <IconSymbol name="checkmark" color={colors.success} size={16} />
                        )}
                      </Pressable>

                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemMeta}>
                          Added by {item.addedBy}
                        </Text>
                      </View>

                      <View style={styles.itemActions}>
                        <Pressable
                          style={[
                            styles.likeButton,
                            currentUser && item.likedBy.includes(currentUser.username) && styles.likeButtonActive,
                          ]}
                          onPress={() => currentUser && toggleLike(item.id, currentUser.username)}
                        >
                          <IconSymbol
                            name="heart.fill"
                            color={currentUser && item.likedBy.includes(currentUser.username) ? colors.danger : colors.textSecondary}
                            size={20}
                          />
                          {item.likedBy.length > 0 && (
                            <Text style={[
                              styles.likeCount,
                              currentUser && item.likedBy.includes(currentUser.username) && styles.likeCountActive,
                            ]}>
                              {item.likedBy.length}
                            </Text>
                          )}
                        </Pressable>

                        {currentUser && item.addedBy === currentUser.username && (
                          <Pressable
                            style={styles.deleteIconButton}
                            onPress={() => handleDelete(item.id, item.name)}
                          >
                            <IconSymbol name="trash" color={colors.danger} size={18} />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Purchased Items */}
            {purchasedItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Purchased ({purchasedItems.length})
                </Text>
                <View style={styles.itemsList}>
                  {purchasedItems.map((item) => (
                    <View key={item.id} style={[styles.itemCard, styles.itemCardPurchased]}>
                      <Pressable
                        style={[styles.checkbox, styles.checkboxChecked]}
                        onPress={() => currentUser && togglePurchased(item.id, currentUser.username)}
                      >
                        <IconSymbol name="checkmark" color={colors.card} size={16} />
                      </Pressable>

                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, styles.itemNamePurchased]}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemMeta}>
                          Purchased by {item.purchasedBy || 'Someone'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    // Push content slightly lower so headers sit a bit further down
    paddingTop: 28,
    paddingBottom: 16,
  },
  scrollContentWithTabBar: {
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  header: {
    // Extra top margin to avoid iOS notch overlay and move header down
    marginTop: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  addCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  clearButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  itemCardPurchased: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  itemNamePurchased: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  itemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  likeButtonActive: {
    backgroundColor: colors.highlight,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  likeCountActive: {
    color: colors.danger,
  },
  deleteIconButton: {
    padding: 6,
  },
});
