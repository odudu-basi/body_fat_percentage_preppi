import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

// Kitchen Items organized by category
const KITCHEN_ITEMS = {
  protein: {
    title: 'Protein',
    minSelect: 2,
    items: [
      { id: 'chicken', label: 'Chicken', emoji: '🍗' },
      { id: 'beef', label: 'Beef', emoji: '🥩' },
      { id: 'fish', label: 'Fish', emoji: '🐟' },
      { id: 'tuna', label: 'Tuna', emoji: '🥫' },
      { id: 'shrimp', label: 'Shrimp', emoji: '🍤' },
      { id: 'egg', label: 'Egg', emoji: '🥚' },
      { id: 'turkey', label: 'Turkey', emoji: '🦃' },
      { id: 'pork', label: 'Pork', emoji: '🥓' },
      { id: 'ham', label: 'Ham', emoji: '🍖' },
      { id: 'tofu', label: 'Tofu', emoji: '🧈' },
      { id: 'soy_meat', label: 'Soy Meat', emoji: '🫘' },
      { id: 'tempeh', label: 'Tempeh', emoji: '🍞' },
      { id: 'seitan', label: 'Seitan', emoji: '🥖' },
      { id: 'protein_powder', label: 'Protein Powder', emoji: '🥤' },
    ],
  },
  carbohydrates: {
    title: 'Carbohydrates',
    minSelect: 3,
    items: [
      { id: 'rice', label: 'Rice', emoji: '🍚' },
      { id: 'potato', label: 'Potato', emoji: '🥔' },
      { id: 'sweet_potato', label: 'Sweet Potato', emoji: '🍠' },
      { id: 'pasta', label: 'Pasta', emoji: '🍝' },
      { id: 'bread', label: 'Bread', emoji: '🍞' },
      { id: 'oats', label: 'Oats', emoji: '🥣' },
      { id: 'quinoa', label: 'Quinoa', emoji: '🌾' },
      { id: 'couscous', label: 'Couscous', emoji: '🍚' },
      { id: 'tortilla', label: 'Tortilla', emoji: '🫓' },
    ],
  },
  vegetables: {
    title: 'Vegetables',
    minSelect: 3,
    items: [
      { id: 'broccoli', label: 'Broccoli', emoji: '🥦' },
      { id: 'spinach', label: 'Spinach', emoji: '🥬' },
      { id: 'carrot', label: 'Carrot', emoji: '🥕' },
      { id: 'tomato', label: 'Tomato', emoji: '🍅' },
      { id: 'onion', label: 'Onion', emoji: '🧅' },
      { id: 'garlic', label: 'Garlic', emoji: '🧄' },
      { id: 'pepper', label: 'Pepper', emoji: '🫑' },
      { id: 'cucumber', label: 'Cucumber', emoji: '🥒' },
      { id: 'lettuce', label: 'Lettuce', emoji: '🥬' },
      { id: 'cauliflower', label: 'Cauliflower', emoji: '🥦' },
      { id: 'zucchini', label: 'Zucchini', emoji: '🥒' },
      { id: 'asparagus', label: 'Asparagus', emoji: '🌿' },
    ],
  },
  fruits: {
    title: 'Fruits',
    minSelect: 2,
    items: [
      { id: 'banana', label: 'Banana', emoji: '🍌' },
      { id: 'apple', label: 'Apple', emoji: '🍎' },
      { id: 'orange', label: 'Orange', emoji: '🍊' },
      { id: 'berries', label: 'Berries', emoji: '🫐' },
      { id: 'strawberry', label: 'Strawberry', emoji: '🍓' },
      { id: 'mango', label: 'Mango', emoji: '🥭' },
      { id: 'pineapple', label: 'Pineapple', emoji: '🍍' },
      { id: 'watermelon', label: 'Watermelon', emoji: '🍉' },
      { id: 'grapes', label: 'Grapes', emoji: '🍇' },
      { id: 'avocado', label: 'Avocado', emoji: '🥑' },
    ],
  },
  dairy: {
    title: 'Dairy & Alternatives',
    minSelect: 1,
    items: [
      { id: 'milk', label: 'Milk', emoji: '🥛' },
      { id: 'yogurt', label: 'Yogurt', emoji: '🥛' },
      { id: 'cheese', label: 'Cheese', emoji: '🧀' },
      { id: 'butter', label: 'Butter', emoji: '🧈' },
      { id: 'almond_milk', label: 'Almond Milk', emoji: '🥛' },
      { id: 'soy_milk', label: 'Soy Milk', emoji: '🥛' },
      { id: 'oat_milk', label: 'Oat Milk', emoji: '🥛' },
    ],
  },
  seasonings: {
    title: 'Seasonings & Oils',
    minSelect: 2,
    items: [
      { id: 'olive_oil', label: 'Olive Oil', emoji: '🫒' },
      { id: 'coconut_oil', label: 'Coconut Oil', emoji: '🥥' },
      { id: 'salt', label: 'Salt', emoji: '🧂' },
      { id: 'pepper', label: 'Black Pepper', emoji: '🌶️' },
      { id: 'paprika', label: 'Paprika', emoji: '🌶️' },
      { id: 'cumin', label: 'Cumin', emoji: '🌿' },
      { id: 'oregano', label: 'Oregano', emoji: '🌿' },
      { id: 'basil', label: 'Basil', emoji: '🌿' },
      { id: 'soy_sauce', label: 'Soy Sauce', emoji: '🥫' },
      { id: 'hot_sauce', label: 'Hot Sauce', emoji: '🌶️' },
    ],
  },
};

const KitchenItemsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useAuth();
  const [selectedItems, setSelectedItems] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Load existing kitchen items when screen mounts
  useEffect(() => {
    if (profile?.kitchen_items && Array.isArray(profile.kitchen_items)) {
      const initialSelections = {};
      profile.kitchen_items.forEach(itemId => {
        initialSelections[itemId] = true;
      });
      setSelectedItems(initialSelections);
    }
  }, [profile]);

  const toggleItem = (itemId) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const selectAllInCategory = (category) => {
    const newSelections = { ...selectedItems };
    KITCHEN_ITEMS[category].items.forEach(item => {
      newSelections[item.id] = true;
    });
    setSelectedItems(newSelections);
  };

  const getSelectedCountInCategory = (category) => {
    return KITCHEN_ITEMS[category].items.filter(item => selectedItems[item.id]).length;
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Convert selectedItems object to array of selected item IDs
      const selectedItemsArray = Object.keys(selectedItems).filter(
        itemId => selectedItems[itemId]
      );

      console.log('[KitchenItems] Saving items:', selectedItemsArray);

      // Save to profile
      await updateProfile({
        kitchen_items: selectedItemsArray,
      });

      console.log('[KitchenItems] Kitchen items saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('[KitchenItems] Error saving kitchen items:', error);
      Alert.alert('Error', 'Failed to save kitchen items. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🍎</Text>
          </View>
          <Text style={styles.title}>Select your available foods</Text>
          <Text style={styles.subtitle}>Your meal plan depends on it</Text>
        </View>

        {/* Categories */}
        {Object.keys(KITCHEN_ITEMS).map((categoryKey) => {
          const category = KITCHEN_ITEMS[categoryKey];
          const selectedCount = getSelectedCountInCategory(categoryKey);

          return (
            <View key={categoryKey} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySubtitle}>
                    Select at least {category.minSelect}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={() => selectAllInCategory(categoryKey)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectAllText}>Select all</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.itemsGrid}>
                {category.items.map((item) => {
                  const isSelected = selectedItems[item.id];
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.itemButton,
                        isSelected && styles.itemButtonSelected,
                      ]}
                      onPress={() => toggleItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.itemEmoji}>{item.emoji}</Text>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(232, 93, 4, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 24,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: Spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  categorySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  selectAllButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  selectAllText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  itemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemButtonSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(232, 93, 4, 0.1)',
  },
  itemEmoji: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  itemLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.surface,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
});

export default KitchenItemsScreen;
