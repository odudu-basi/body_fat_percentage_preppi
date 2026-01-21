import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import ChecklistItem from './ChecklistItem';
import {
  getTodaysChecklist,
  addChecklistItem,
  toggleChecklistCompletion,
  deleteChecklistItem,
} from '../../services/checklistStorage';
import { useAuth } from '../../context/AuthContext';
import { BODY_FAT_LOSS_HABITS } from '../../constants/checklistHabits';

/**
 * Get a deterministic random selection of items based on date
 * This ensures the same 7 items are shown throughout the day
 */
const getRandomItemsForToday = (items, count = 7) => {
  if (!items || items.length === 0) return [];
  if (items.length <= count) return items;

  // Use today's date as a seed for consistent daily selection
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Simple seeded random number generator
  const seededRandom = (seed) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Create a shuffled copy using the seeded random
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
};

// Available icons for checklist items
const CHECKLIST_ICONS = [
  { name: 'checkbox', label: 'Default', color: '#E85D04' },
  { name: 'water', label: 'Water', color: '#2196F3' },
  { name: 'barbell', label: 'Workout', color: '#E85D04' },
  { name: 'nutrition', label: 'Nutrition', color: '#4CAF50' },
  { name: 'moon', label: 'Sleep', color: '#9C27B0' },
  { name: 'footsteps', label: 'Steps', color: '#FF9800' },
  { name: 'restaurant', label: 'Meals', color: '#F44336' },
  { name: 'medkit', label: 'Health', color: '#00BCD4' },
  { name: 'book', label: 'Reading', color: '#795548' },
  { name: 'time', label: 'Time', color: '#607D8B' },
  { name: 'heart', label: 'Cardio', color: '#E91E63' },
  { name: 'happy', label: 'Mood', color: '#FFEB3B' },
  { name: 'sunny', label: 'Sunlight', color: '#FFA726' },
  { name: 'leaf', label: 'Veggies', color: '#66BB6A' },
  { name: 'fitness', label: 'Strength', color: '#E85D04' },
  { name: 'body', label: 'Stretch', color: '#AB47BC' },
  { name: 'fast-food', label: 'Food', color: '#FF7043' },
  { name: 'walk', label: 'Walk', color: '#FF9800' },
  { name: 'calendar', label: 'Plan', color: '#42A5F5' },
  { name: 'camera', label: 'Photo', color: '#26A69A' },
  { name: 'close-circle', label: 'Avoid', color: '#EF5350' },
  { name: 'checkmark-done', label: 'Done', color: '#66BB6A' },
];

const DailyChecklist = () => {
  const { profile } = useAuth();
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    subtitle: '',
    icon: 'checkbox',
    icon_color: '#E85D04',
    is_recurring: false,
  });
  const [saving, setSaving] = useState(false);

  // Load checklist: predefined body fat loss habits + custom user items
  const loadChecklist = useCallback(async () => {
    try {
      setLoading(true);

      // Get today's 7 random items from predefined habits
      const todaysHabits = getRandomItemsForToday(BODY_FAT_LOSS_HABITS, 7);

      // Get custom user items from database
      const customItems = await getTodaysChecklist();

      // Format predefined habits for display
      const formattedHabits = todaysHabits.map((habit, index) => ({
        id: `habit-${index}`,
        title: habit.title,
        subtitle: habit.subtitle,
        icon: habit.icon,
        iconColor: habit.iconColor,
        is_completed: false,
        is_recurring: true,
        is_custom: false,
        sort_order: index,
      }));

      // Merge with custom items
      const allItems = [...formattedHabits, ...customItems.map(item => ({ ...item, is_custom: true }))];

      setChecklistItems(allItems);
    } catch (error) {
      console.error('Error loading checklist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  // Handle toggling item completion
  const handleToggleItem = async (item) => {
    const newStatus = !item.is_completed;

    // Optimistic update
    setChecklistItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, is_completed: newStatus } : i
    ));

    // Only save to database if it's a custom item
    if (item.is_custom) {
      const result = await toggleChecklistCompletion(item.id, newStatus, item.completion_id);
      if (!result) {
        // Revert on failure
        setChecklistItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, is_completed: !newStatus } : i
        ));
        Alert.alert('Error', 'Failed to update item. Please try again.');
      } else {
        // Update completion_id if it was newly created
        if (!item.completion_id) {
          setChecklistItems(prev => prev.map(i =>
            i.id === item.id ? { ...i, completion_id: result.id } : i
          ));
        }
      }
    }
    // For AI-generated items, just keep the state locally (resets daily)
  };

  // Handle deleting item
  const handleDeleteItem = async (itemId) => {
    const item = checklistItems.find(i => i.id === itemId);
    if (!item) return;

    Alert.alert(
      'Delete Item',
      item.is_recurring 
        ? 'This is a recurring item. Deleting it will remove it from all future days. Continue?'
        : 'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteChecklistItem(itemId);
            if (success) {
              setChecklistItems(prev => prev.filter(i => i.id !== itemId));
            } else {
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle adding new item
  const handleAddItem = async () => {
    if (!newItem.title.trim()) {
      Alert.alert('Error', 'Please enter an item name.');
      return;
    }

    setSaving(true);
    try {
      const itemData = {
        title: newItem.title.trim(),
        subtitle: newItem.subtitle.trim(),
        icon: newItem.icon,
        icon_color: newItem.icon_color,
        is_recurring: newItem.is_recurring,
      };

      const result = await addChecklistItem(itemData);
      if (result) {
        setChecklistItems(prev => [...prev, result]);
        setShowAddModal(false);
        resetNewItem();
      } else {
        Alert.alert('Error', 'Failed to add item. Please try again.');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetNewItem = () => {
    setNewItem({
      title: '',
      subtitle: '',
      icon: 'checkbox',
      icon_color: '#E85D04',
      is_recurring: false,
    });
  };

  const handleIconSelect = (icon) => {
    setNewItem(prev => ({
      ...prev,
      icon: icon.name,
      icon_color: icon.color,
    }));
  };

  const completedCount = checklistItems.filter(item => item.is_completed).length;
  const totalCount = checklistItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressTextContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.progressTitle}>Today's Goals</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={Colors.dark.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.progressSubtitle}>
            {completedCount} of {totalCount} completed
          </Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progressPercent}%` }
            ]} 
          />
        </View>
      </View>

      {/* Checklist Items - sorted with unchecked first, checked at bottom */}
      <View style={styles.checklistContainer}>
        {checklistItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkbox-outline" size={48} color={Colors.dark.textSecondary} />
            <Text style={styles.emptyText}>No checklist items</Text>
            <Text style={styles.emptySubtext}>Tap + to add a goal</Text>
          </View>
        ) : (
          [...checklistItems]
            .sort((a, b) => {
              const aChecked = a.is_completed || false;
              const bChecked = b.is_completed || false;
              if (aChecked === bChecked) return (a.sort_order || 0) - (b.sort_order || 0);
              return aChecked ? 1 : -1;
            })
            .map((item) => (
              <ChecklistItem
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                icon={item.icon}
                iconColor={item.iconColor}
                isChecked={item.is_completed}
                isRecurring={item.is_recurring}
                onPress={() => handleToggleItem(item)}
                onLongPress={() => item.is_custom && handleDeleteItem(item.id)}
              />
            ))
        )}
      </View>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  resetNewItem();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Goal</Text>
              <TouchableOpacity
                onPress={handleAddItem}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.dark.primary} />
                ) : (
                  <Text style={styles.doneButton}>Done</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Item Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Goal *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Meditate for 10 minutes"
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={newItem.title}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, title: text }))}
                />
              </View>

              {/* Subtitle */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Add a note or reminder..."
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={newItem.subtitle}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, subtitle: text }))}
                />
              </View>

              {/* Recurring Toggle */}
              <View style={styles.toggleGroup}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>Recurring</Text>
                  <Text style={styles.toggleDescription}>
                    {newItem.is_recurring 
                      ? 'Shows every day' 
                      : 'Shows only today'}
                  </Text>
                </View>
                <Switch
                  value={newItem.is_recurring}
                  onValueChange={(value) => setNewItem(prev => ({ ...prev, is_recurring: value }))}
                  trackColor={{ false: Colors.dark.background, true: Colors.dark.primary }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={Colors.dark.background}
                />
              </View>

              {/* Icon Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Icon</Text>
                <View style={styles.iconGrid}>
                  {CHECKLIST_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon.name}
                      style={[
                        styles.iconOption,
                        newItem.icon === icon.name && styles.iconOptionSelected,
                      ]}
                      onPress={() => handleIconSelect(icon)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconPreview, { backgroundColor: `${icon.color}20` }]}>
                        <Ionicons
                          name={icon.name}
                          size={24}
                          color={icon.color}
                        />
                      </View>
                      <Text style={[
                        styles.iconLabel,
                        newItem.icon === icon.name && styles.iconLabelSelected,
                      ]}>
                        {icon.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  progressTextContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    marginRight: Spacing.md,
  },
  progressSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  progressPercent: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
  },
  progressBarContainer: {
    marginBottom: Spacing.lg,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.dark.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 4,
  },
  checklistContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.background,
  },
  cancelButton: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  modalTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  doneButton: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.primary,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
  },
  toggleDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconOption: {
    width: '23%',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(232, 93, 4, 0.1)',
  },
  iconPreview: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  iconLabelSelected: {
    color: Colors.dark.primary,
  },
});

export default DailyChecklist;
