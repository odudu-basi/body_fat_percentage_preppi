import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

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

const OnboardingKitchenItemsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedItems, setSelectedItems] = useState({});
  const [customItems, setCustomItems] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingToCategory, setAddingToCategory] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

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
    const baseItems = KITCHEN_ITEMS[category].items.filter(item => selectedItems[item.id]).length;
    const customCategoryItems = customItems[category] || [];
    const customSelected = customCategoryItems.filter(item => selectedItems[item.id]).length;
    return baseItems + customSelected;
  };

  const handleAddItem = (category) => {
    setAddingToCategory(category);
    setNewItemName('');
    setShowAddModal(true);
  };

  const confirmAddItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    const itemId = `custom_${addingToCategory}_${Date.now()}`;
    const newItem = {
      id: itemId,
      label: newItemName.trim(),
      emoji: '✨',
    };

    // Add to custom items
    setCustomItems(prev => ({
      ...prev,
      [addingToCategory]: [...(prev[addingToCategory] || []), newItem],
    }));

    // Auto-select the new item
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: true,
    }));

    setShowAddModal(false);
    setNewItemName('');
    setAddingToCategory(null);
  };

  const handleNext = () => {
    // Convert selectedItems object to array of selected item IDs
    const selectedItemsArray = Object.keys(selectedItems).filter(
      itemId => selectedItems[itemId]
    );

    console.log('[OnboardingKitchen] Selected items:', selectedItemsArray);

    navigation.navigate('Allergies', {
      ...route.params,
      kitchen_items: selectedItemsArray,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.textPrimary} />
        </TouchableOpacity>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>
        </View>

        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
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
          <Text style={styles.title}>What do you cook with?</Text>
          <Text style={styles.subtitle}>Select ingredients you regularly have in your kitchen</Text>
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
                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddItem(categoryKey)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle" size={20} color={Colors.dark.primary} />
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={() => selectAllInCategory(categoryKey)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectAllText}>Select all</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemsGrid}>
                {/* Base items */}
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
                {/* Custom items */}
                {(customItems[categoryKey] || []).map((item) => {
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

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Item</Text>
            <Text style={styles.modalSubtitle}>
              {addingToCategory && KITCHEN_ITEMS[addingToCategory]?.title}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter item name"
              placeholderTextColor={Colors.dark.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              autoFocus
              autoCapitalize="words"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmAddItem}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextConfirm}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Next Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.dark.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
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
    fontSize: Fonts.sizes.xxxl,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  addButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
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
  footer: {
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
  nextButton: {
    width: '100%',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.textSecondary,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.dark.primary,
  },
  modalButtonTextCancel: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  modalButtonTextConfirm: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
  },
});

export default OnboardingKitchenItemsScreen;
