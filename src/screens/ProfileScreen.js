import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { calculateNutritionTargets } from '../utils/calorieCalculator';
import { getTodaysExercises, deleteExercise, deleteAllTodaysExercises } from '../services/exerciseStorage';
import { getTodayLocalDate } from '../utils/dateUtils';

// Profile Card Component
const ProfileCard = ({ icon, label, value, onPress, showChevron = true }) => {
  const content = (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color={Colors.dark.textPrimary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>{label}</Text>
          {value && <Text style={styles.cardValue}>{value}</Text>}
        </View>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

// Section Header Component
const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// Selection Modal Component (reusable for radio options)
const SelectionModal = ({ visible, onClose, title, options, currentValue, onSelect }) => {
  const [selected, setSelected] = useState(currentValue);

  const handleSave = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.difficultyOption}
                onPress={() => setSelected(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.difficultyOptionLeft}>
                  <View style={[
                    styles.radio,
                    selected === option.value && styles.radioSelected
                  ]}>
                    {selected === option.value && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.difficultyLabel}>{option.label}</Text>
                    {option.description && (
                      <Text style={styles.difficultyDescription}>{option.description}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Edit Modal Component
const EditModal = ({ visible, onClose, title, fields, onSave }) => {
  const [values, setValues] = useState(fields.reduce((acc, field) => ({
    ...acc,
    [field.key]: field.value || ''
  }), {}));

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleSave} activeOpacity={0.7}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {fields.map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={values[field.key]?.toString() || ''}
                  onChangeText={(text) => setValues({ ...values, [field.key]: text })}
                  keyboardType={field.keyboardType || 'default'}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, updateProfile, deleteAccount } = useAuth();
  const { isPro, isLoading: subLoading } = useSubscription();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editModalConfig, setEditModalConfig] = useState(null);
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [selectionModalConfig, setSelectionModalConfig] = useState(null);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } else {
              // Account deleted, navigation will be handled by auth state change
              Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
            }
          },
        },
      ]
    );
  };

  const handlePrivacyPolicy = async () => {
    const url = 'https://docs.google.com/document/d/1mXe679mfO1NQ2mP9ZdNAdvl0b3m9lEHV/edit';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open Privacy Policy');
    }
  };

  const handleTermsOfService = async () => {
    const url = 'https://docs.google.com/document/d/1NH_MOmWCBbD4ZVtiQOqC5DsdOk7P147I/edit';
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Unable to open Terms of Service');
    }
  };

  const openEditModal = (title, fields, onSave) => {
    setEditModalConfig({ title, fields, onSave });
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditModalConfig(null);
  };

  const openSelectionModal = (title, options, currentValue, onSelect) => {
    setSelectionModalConfig({ title, options, currentValue, onSelect });
    setSelectionModalVisible(true);
  };

  const closeSelectionModal = () => {
    setSelectionModalVisible(false);
    setSelectionModalConfig(null);
  };

  // Helper to recalculate nutrition targets after profile changes
  const recalculateNutrition = async (updatedFields) => {
    try {
      // Merge updated fields with current profile
      const updatedProfile = { ...profile, ...updatedFields };

      // Only recalculate if we have all required fields
      if (updatedProfile.weight_kg && updatedProfile.height_cm && updatedProfile.age && updatedProfile.gender) {
        const difficulty = updatedProfile.difficulty || 'medium';
        const nutritionTargets = calculateNutritionTargets(updatedProfile, difficulty);
        console.log('[ProfileScreen] Recalculated nutrition targets:', nutritionTargets);

        // Update profile with new targets
        await updateProfile({
          ...updatedFields,
          ...nutritionTargets,
        });

        Alert.alert(
          'Profile Updated',
          'Your nutrition targets have been recalculated based on your new information.',
          [{ text: 'OK' }]
        );
      } else {
        // Just update without recalculation
        await updateProfile(updatedFields);
      }
    } catch (error) {
      console.error('[ProfileScreen] Error recalculating nutrition:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Edit Handlers
  const handleEditAge = () => {
    openEditModal(
      'Edit Age',
      [{ key: 'age', label: 'Age', placeholder: 'Enter your age', value: profile?.age, keyboardType: 'numeric' }],
      async (values) => {
        await recalculateNutrition({ age: parseInt(values.age) || profile?.age });
      }
    );
  };

  const handleEditHeight = () => {
    const heightCm = profile?.height_cm || 0;
    const totalInches = heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);

    openEditModal(
      'Edit Height',
      [
        { key: 'feet', label: 'Feet', placeholder: 'Enter feet', value: feet, keyboardType: 'numeric' },
        { key: 'inches', label: 'Inches', placeholder: 'Enter inches', value: inches, keyboardType: 'numeric' },
      ],
      async (values) => {
        const totalInches = (parseInt(values.feet) || 0) * 12 + (parseInt(values.inches) || 0);
        const heightCm = totalInches * 2.54;
        await recalculateNutrition({ height_cm: heightCm });
      }
    );
  };

  const handleEditWeight = () => {
    const weightKg = profile?.weight_kg || 0;
    const lbs = Math.round(weightKg * 2.20462);

    openEditModal(
      'Edit Weight',
      [{ key: 'weight', label: 'Weight (lbs)', placeholder: 'Enter weight in lbs', value: lbs, keyboardType: 'numeric' }],
      async (values) => {
        const weightKg = (parseInt(values.weight) || 0) / 2.20462;
        await recalculateNutrition({ weight_kg: weightKg });
      }
    );
  };

  const handleEditGender = () => {
    const genderOptions = [
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'other', label: 'Other' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ];

    openSelectionModal(
      'Select Gender',
      genderOptions,
      profile?.gender || 'male',
      async (selectedGender) => {
        await recalculateNutrition({ gender: selectedGender });
      }
    );
  };

  const handleEditActivityLevel = () => {
    const activityOptions = [
      { value: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
      { value: 'lightly_active', label: 'Lightly Active', description: '1-2 days/week' },
      { value: 'moderately_active', label: 'Moderately Active', description: '3-5 days/week' },
      { value: 'very_active', label: 'Very Active', description: '6-7 days/week' },
      { value: 'extra_active', label: 'Extra Active', description: 'Intense daily' },
    ];

    openSelectionModal(
      'Select Activity Level',
      activityOptions,
      profile?.activity_level || 'moderately_active',
      async (selectedLevel) => {
        // Map activity_level to workout_frequency for calorie calculation
        const activityToWorkoutFrequency = {
          sedentary: '0-2',
          lightly_active: '0-2',
          moderately_active: '3-5',
          very_active: '6+',
          extra_active: '6+',
        };

        await recalculateNutrition({
          activity_level: selectedLevel,
          workout_frequency: activityToWorkoutFrequency[selectedLevel],
        });
      }
    );
  };

  const handleEditFitnessGoal = () => {
    const goalOptions = [
      { value: 'lose_weight', label: 'Lose Body Fat', description: 'Reduce body fat percentage' },
      { value: 'maintain_weight', label: 'Maintain Weight', description: 'Stay at current weight' },
    ];

    openSelectionModal(
      'Select Fitness Goal',
      goalOptions,
      profile?.fitness_goal || 'lose_weight',
      async (selectedGoal) => {
        await recalculateNutrition({ fitness_goal: selectedGoal });
      }
    );
  };

  const handleEditDifficulty = async (newDifficulty) => {
    try {
      console.log(`[ProfileScreen] Changing difficulty from ${profile?.difficulty} to ${newDifficulty}`);

      // Recalculate nutrition targets based on new difficulty
      const nutritionTargets = calculateNutritionTargets(profile, newDifficulty);
      console.log('[ProfileScreen] New nutrition targets:', nutritionTargets);

      // Update profile with new difficulty and nutrition targets
      await updateProfile({
        difficulty: newDifficulty,
        ...nutritionTargets,
      });

      // Delete ALL of today's exercises so they can be recreated with the new difficulty
      console.log('[ProfileScreen] Deleting ALL exercises for today...');
      const deleteResult = await deleteAllTodaysExercises();
      console.log(`[ProfileScreen] Deleted ${deleteResult.deleted} exercises`);

      Alert.alert(
        'Difficulty Updated',
        'Your difficulty level has been changed. Calories, macros, and exercises have been updated.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[ProfileScreen] Error updating difficulty:', error);
      Alert.alert('Error', 'Failed to update difficulty. Please try again.');
    }
  };

  // Format display values
  const getGenderDisplay = () => {
    if (!profile?.gender) return 'Not set';
    return profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).replace('_', ' ');
  };

  const getActivityLevelDisplay = () => {
    if (!profile?.activity_level) return 'Not set';
    const levels = {
      sedentary: 'Sedentary (Little to no exercise)',
      lightly_active: 'Lightly Active (1-2 days/week)',
      moderately_active: 'Moderately Active (3-5 days/week)',
      very_active: 'Very Active (6-7 days/week)',
      extra_active: 'Extra Active (Intense daily)',
    };
    return levels[profile.activity_level] || 'Not set';
  };

  const getFitnessGoalDisplay = () => {
    if (!profile?.fitness_goal) return 'Not set';
    const goals = {
      lose_weight: 'Lose Body Fat',
      maintain_weight: 'Maintain Weight',
    };
    return goals[profile.fitness_goal] || 'Not set';
  };

  const getDifficultyDisplay = () => {
    if (!profile?.difficulty) return 'Medium';
    const difficulties = {
      easy: 'Easy (2 exercises/day)',
      medium: 'Medium (4 exercises/day)',
      hard: 'Hard (6 exercises/day)',
    };
    return difficulties[profile.difficulty] || 'Medium';
  };

  const getHeightDisplay = () => {
    if (!profile?.height_cm) return 'Not set';
    const totalInches = profile.height_cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}" (${Math.round(profile.height_cm)} cm)`;
  };

  const getWeightDisplay = () => {
    if (!profile?.weight_kg) return 'Not set';
    const lbs = Math.round(profile.weight_kg * 2.20462);
    return `${lbs} lbs (${Math.round(profile.weight_kg)} kg)`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.full_name || 'User'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'No email'}
            </Text>
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionLabel}>Subscribed: </Text>
              <Text style={[
                styles.subscriptionValue,
                isPro ? styles.subscriptionActive : styles.subscriptionInactive
              ]}>
                {subLoading ? 'Loading...' : (isPro ? 'Yes' : 'No')}
              </Text>
            </View>
          </View>
        </View>

        {/* Personal Details Section */}
        <SectionHeader title="Personal Details" />
        <View style={styles.section}>
          <ProfileCard
            icon="person-outline"
            label="Gender"
            value={getGenderDisplay()}
            onPress={handleEditGender}
          />
          <ProfileCard
            icon="calendar-outline"
            label="Age"
            value={profile?.age ? `${profile.age} years old` : 'Not set'}
            onPress={handleEditAge}
          />
          <ProfileCard
            icon="resize-outline"
            label="Height"
            value={getHeightDisplay()}
            onPress={handleEditHeight}
          />
          <ProfileCard
            icon="speedometer-outline"
            label="Weight"
            value={getWeightDisplay()}
            onPress={handleEditWeight}
          />
        </View>

        {/* Fitness Goals Section */}
        <SectionHeader title="Fitness Goals" />
        <View style={styles.section}>
          <ProfileCard
            icon="trophy-outline"
            label="Goal"
            value={getFitnessGoalDisplay()}
            onPress={handleEditFitnessGoal}
          />
          <ProfileCard
            icon="barbell-outline"
            label="Activity Level"
            value={getActivityLevelDisplay()}
            onPress={handleEditActivityLevel}
          />
          <ProfileCard
            icon="fitness-outline"
            label="Difficulty"
            value={getDifficultyDisplay()}
            onPress={() => {
              const difficultyOptions = [
                { value: 'easy', label: 'Easy', description: '2 exercises per day' },
                { value: 'medium', label: 'Medium', description: '4 exercises per day' },
                { value: 'hard', label: 'Hard', description: '6 exercises per day' },
              ];
              openSelectionModal(
                'Select Difficulty',
                difficultyOptions,
                profile?.difficulty || 'medium',
                handleEditDifficulty
              );
            }}
          />
        </View>

        {/* Nutrition Targets Section */}
        <SectionHeader title="Nutrition Targets" />
        <View style={styles.section}>
          <ProfileCard
            icon="flame-outline"
            label="Daily Calories"
            value={profile?.daily_calorie_target ? `${profile.daily_calorie_target} kcal` : 'Not set'}
            showChevron={false}
          />
          <ProfileCard
            icon="nutrition-outline"
            label="Protein"
            value={profile?.daily_protein_target ? `${profile.daily_protein_target}g` : 'Not set'}
            showChevron={false}
          />
          <ProfileCard
            icon="nutrition-outline"
            label="Carbohydrates"
            value={profile?.daily_carbs_target ? `${profile.daily_carbs_target}g` : 'Not set'}
            showChevron={false}
          />
          <ProfileCard
            icon="nutrition-outline"
            label="Fats"
            value={profile?.daily_fat_target ? `${profile.daily_fat_target}g` : 'Not set'}
            showChevron={false}
          />
        </View>

        {/* Account Section */}
        <SectionHeader title="Account" />
        <View style={styles.section}>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Feedback' })} activeOpacity={0.7}>
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="chatbox-outline" size={22} color={Colors.dark.textPrimary} />
                </View>
                <Text style={styles.cardLabel}>Send Feedback</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePrivacyPolicy} activeOpacity={0.7}>
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="shield-checkmark-outline" size={22} color={Colors.dark.textPrimary} />
                </View>
                <Text style={styles.cardLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleTermsOfService} activeOpacity={0.7}>
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="document-text-outline" size={22} color={Colors.dark.textPrimary} />
                </View>
                <Text style={styles.cardLabel}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.dark.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, styles.iconContainerDanger]}>
                  <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                </View>
                <Text style={[styles.cardLabel, styles.cardLabelDanger]}>Sign Out</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.7}>
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, styles.iconContainerCritical]}>
                  <Ionicons name="trash-outline" size={22} color="#DC2626" />
                </View>
                <Text style={[styles.cardLabel, styles.cardLabelCritical]}>Delete Account</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.3.0 (23)</Text>
      </ScrollView>

      {/* Edit Modal */}
      {editModalConfig && (
        <EditModal
          visible={editModalVisible}
          onClose={closeEditModal}
          title={editModalConfig.title}
          fields={editModalConfig.fields}
          onSave={editModalConfig.onSave}
        />
      )}

      {/* Selection Modal (for Gender, Activity, Goal, Difficulty) */}
      {selectionModalConfig && (
        <SelectionModal
          visible={selectionModalVisible}
          onClose={closeSelectionModal}
          title={selectionModalConfig.title}
          options={selectionModalConfig.options}
          currentValue={selectionModalConfig.currentValue}
          onSelect={selectionModalConfig.onSelect}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 34,
    color: Colors.dark.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  subscriptionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  subscriptionValue: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
  },
  subscriptionActive: {
    color: '#4CAF50',
  },
  subscriptionInactive: {
    color: '#FF5252',
  },

  // Section
  sectionHeader: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  section: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  iconContainerDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  iconContainerCritical: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: 2,
  },
  cardLabelDanger: {
    color: '#EF4444',
  },
  cardLabelCritical: {
    color: '#DC2626',
  },
  cardValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },

  // Version
  versionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '70%',
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
  saveButton: {
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

  // Difficulty Modal
  difficultyOption: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.background,
  },
  difficultyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.dark.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.primary,
  },
  difficultyLabel: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  difficultyDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
});

export default ProfileScreen;
