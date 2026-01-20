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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import ExerciseCard from './ExerciseCard';
import {
  getTodaysExercises,
  addExercise,
  toggleExerciseCompletion,
  deleteExercise,
} from '../../services/exerciseStorage';

// Available icons for exercises
const EXERCISE_ICONS = [
  { name: 'fitness', label: 'Fitness' },
  { name: 'heart', label: 'Cardio' },
  { name: 'barbell', label: 'Weights' },
  { name: 'bicycle', label: 'Cycling' },
  { name: 'walk', label: 'Walking' },
  { name: 'body', label: 'Yoga' },
  { name: 'football', label: 'Sports' },
  { name: 'water', label: 'Swimming' },
];

const ExerciseList = ({ onExerciseCaloriesChange }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExercise, setNewExercise] = useState({
    title: '',
    description: '',
    duration: '',
    calories: '',
    icon: 'fitness',
  });
  const [saving, setSaving] = useState(false);

  // Load exercises from database
  const loadExercises = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTodaysExercises();
      setExercises(data);
      
      // Calculate and notify parent of burned calories
      const burnedCalories = data
        .filter(ex => ex.is_completed)
        .reduce((total, ex) => total + (ex.calories || 0), 0);
      if (onExerciseCaloriesChange) {
        onExerciseCaloriesChange(burnedCalories);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  }, [onExerciseCaloriesChange]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Handle toggling exercise completion
  const handleToggleExercise = async (exerciseId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const newStatus = !exercise.is_completed;
    
    // Optimistic update
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId ? { ...ex, is_completed: newStatus } : ex
    ));

    // Update burned calories immediately
    const updatedExercises = exercises.map(ex => 
      ex.id === exerciseId ? { ...ex, is_completed: newStatus } : ex
    );
    const burnedCalories = updatedExercises
      .filter(ex => ex.is_completed)
      .reduce((total, ex) => total + (ex.calories || 0), 0);
    if (onExerciseCaloriesChange) {
      onExerciseCaloriesChange(burnedCalories);
    }

    // Save to database
    const result = await toggleExerciseCompletion(exerciseId, newStatus);
    if (!result) {
      // Revert on failure
      setExercises(prev => prev.map(ex => 
        ex.id === exerciseId ? { ...ex, is_completed: !newStatus } : ex
      ));
      Alert.alert('Error', 'Failed to update exercise. Please try again.');
    }
  };

  // Handle deleting exercise
  const handleDeleteExercise = async (exerciseId) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteExercise(exerciseId);
            if (success) {
              setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
              // Recalculate burned calories
              const remaining = exercises.filter(ex => ex.id !== exerciseId);
              const burnedCalories = remaining
                .filter(ex => ex.is_completed)
                .reduce((total, ex) => total + (ex.calories || 0), 0);
              if (onExerciseCaloriesChange) {
                onExerciseCaloriesChange(burnedCalories);
              }
            } else {
              Alert.alert('Error', 'Failed to delete exercise. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle adding new exercise
  const handleAddExercise = async () => {
    if (!newExercise.title.trim()) {
      Alert.alert('Error', 'Please enter an exercise name.');
      return;
    }
    if (!newExercise.calories || parseInt(newExercise.calories) <= 0) {
      Alert.alert('Error', 'Please enter calories burned.');
      return;
    }

    setSaving(true);
    try {
      const exerciseData = {
        title: newExercise.title.trim(),
        description: newExercise.description.trim(),
        duration: newExercise.duration.trim(),
        calories: parseInt(newExercise.calories),
        icon: newExercise.icon,
      };

      const result = await addExercise(exerciseData);
      if (result) {
        setExercises(prev => [...prev, result]);
        setShowAddModal(false);
        resetNewExercise();
      } else {
        Alert.alert('Error', 'Failed to add exercise. Please try again.');
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
      Alert.alert('Error', 'Failed to add exercise. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetNewExercise = () => {
    setNewExercise({
      title: '',
      description: '',
      duration: '',
      calories: '',
      icon: 'fitness',
    });
  };

  const totalCalories = exercises.reduce((sum, ex) => sum + (ex.calories || 0), 0);
  const burnedCalories = exercises
    .filter(ex => ex.is_completed)
    .reduce((sum, ex) => sum + (ex.calories || 0), 0);
  const checkedCount = exercises.filter(ex => ex.is_completed).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Today's Workout</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={Colors.dark.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.totalCalories}>
            <Text style={styles.totalLabel}>Total: </Text>
            <Text style={styles.totalValue}>{totalCalories} kcal</Text>
          </View>
          {burnedCalories > 0 && (
            <View style={styles.burnedCalories}>
              <Text style={styles.burnedLabel}>Burned: </Text>
              <Text style={styles.burnedValue}>{burnedCalories} kcal</Text>
            </View>
          )}
        </View>
        {checkedCount > 0 && (
          <Text style={styles.completedText}>
            {checkedCount} of {exercises.length} completed
          </Text>
        )}
      </View>

      {/* Exercise Cards */}
      <View style={styles.cardsContainer}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness-outline" size={48} color={Colors.dark.textSecondary} />
            <Text style={styles.emptyText}>No exercises for today</Text>
            <Text style={styles.emptySubtext}>Tap + to add an exercise</Text>
          </View>
        ) : (
          exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              title={exercise.title}
              description={exercise.description}
              duration={exercise.duration}
              calories={exercise.calories}
              icon={exercise.icon}
              isChecked={exercise.is_completed}
              onToggle={() => handleToggleExercise(exercise.id)}
              onLongPress={() => exercise.is_custom && handleDeleteExercise(exercise.id)}
            />
          ))
        )}
      </View>

      {/* Add Exercise Modal */}
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
                  resetNewExercise();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <TouchableOpacity
                onPress={handleAddExercise}
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
              {/* Exercise Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Exercise Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Morning Run"
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={newExercise.title}
                  onChangeText={(text) => setNewExercise(prev => ({ ...prev, title: text }))}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe your exercise..."
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={newExercise.description}
                  onChangeText={(text) => setNewExercise(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Duration and Calories Row */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Duration</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 30 min"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={newExercise.duration}
                    onChangeText={(text) => setNewExercise(prev => ({ ...prev, duration: text }))}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                  <Text style={styles.inputLabel}>Calories Burned *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 300"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={newExercise.calories}
                    onChangeText={(text) => setNewExercise(prev => ({ ...prev, calories: text.replace(/[^0-9]/g, '') }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Icon Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Icon</Text>
                <View style={styles.iconGrid}>
                  {EXERCISE_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon.name}
                      style={[
                        styles.iconOption,
                        newExercise.icon === icon.name && styles.iconOptionSelected,
                      ]}
                      onPress={() => setNewExercise(prev => ({ ...prev, icon: icon.name }))}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={icon.name}
                        size={24}
                        color={newExercise.icon === icon.name ? Colors.dark.primary : Colors.dark.textSecondary}
                      />
                      <Text style={[
                        styles.iconLabel,
                        newExercise.icon === icon.name && styles.iconLabelSelected,
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
  header: {
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
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
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  totalCalories: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  totalValue: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
  },
  burnedCalories: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  burnedLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  burnedValue: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: '#4CAF50',
  },
  completedText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.xs,
    color: '#4CAF50',
    marginTop: 4,
  },
  cardsContainer: {
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  iconOption: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(232, 93, 4, 0.1)',
  },
  iconLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  iconLabelSelected: {
    color: Colors.dark.primary,
  },
});

export default ExerciseList;
