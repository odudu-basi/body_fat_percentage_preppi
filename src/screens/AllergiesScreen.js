import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Dairy',
  'Eggs',
  'Soy',
  'Wheat/Gluten',
  'Fish',
  'Shellfish',
  'Sesame',
];

const DIETARY_RESTRICTIONS = [
  { id: 'none', label: 'No Restrictions' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

const AllergiesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useAuth();
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedDietaryRestriction, setSelectedDietaryRestriction] = useState('none');
  const [customAllergies, setCustomAllergies] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAllergyName, setNewAllergyName] = useState('');

  // Load existing allergies and dietary restriction when screen mounts
  useEffect(() => {
    if (profile?.allergies && Array.isArray(profile.allergies)) {
      // Separate base allergies from custom ones
      const baseAllergies = profile.allergies.filter(a => ALLERGIES.includes(a));
      const custom = profile.allergies.filter(a => !ALLERGIES.includes(a));

      setSelectedAllergies(profile.allergies);
      setCustomAllergies(custom);
    }

    if (profile?.dietary_restriction) {
      setSelectedDietaryRestriction(profile.dietary_restriction);
    }
  }, [profile]);

  const toggleAllergy = (allergy) => {
    setSelectedAllergies((prev) => {
      if (prev.includes(allergy)) {
        return prev.filter((a) => a !== allergy);
      } else {
        return [...prev, allergy];
      }
    });
  };

  const handleAddAllergy = () => {
    setNewAllergyName('');
    setShowAddModal(true);
  };

  const confirmAddAllergy = () => {
    if (!newAllergyName.trim()) {
      Alert.alert('Error', 'Please enter an allergy name');
      return;
    }

    const allergyName = newAllergyName.trim();

    // Check if already exists
    const allAllergies = [...ALLERGIES, ...customAllergies];
    if (allAllergies.includes(allergyName)) {
      Alert.alert('Error', 'This allergy already exists');
      return;
    }

    // Add to custom allergies
    setCustomAllergies(prev => [...prev, allergyName]);

    // Auto-select the new allergy
    setSelectedAllergies(prev => [...prev, allergyName]);

    setShowAddModal(false);
    setNewAllergyName('');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      console.log('[AllergiesScreen] Saving allergies:', selectedAllergies);
      console.log('[AllergiesScreen] Saving dietary restriction:', selectedDietaryRestriction);

      // Save to profile
      await updateProfile({
        allergies: selectedAllergies,
        dietary_restriction: selectedDietaryRestriction,
      });

      console.log('[AllergiesScreen] Allergies saved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('[AllergiesScreen] Error saving allergies:', error);
      Alert.alert('Error', 'Failed to save allergies. Please try again.');
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
            <Text style={styles.iconEmoji}>🥜</Text>
          </View>
          <Text style={styles.title}>Allergies & Restrictions</Text>
          <Text style={styles.subtitle}>
            Help us personalize your meal plans
          </Text>
        </View>

        {/* Dietary Restrictions Section */}
        <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
        <View style={styles.optionsContainer}>
          {DIETARY_RESTRICTIONS.map((restriction) => (
            <TouchableOpacity
              key={restriction.id}
              style={[
                styles.dietaryButton,
                selectedDietaryRestriction === restriction.id && styles.dietaryButtonSelected,
              ]}
              onPress={() => setSelectedDietaryRestriction(restriction.id)}
              activeOpacity={0.7}
            >
              <View style={styles.radioContainer}>
                {selectedDietaryRestriction === restriction.id ? (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.dark.primary} />
                ) : (
                  <View style={styles.radioCircle} />
                )}
              </View>
              <Text
                style={[
                  styles.dietaryText,
                  selectedDietaryRestriction === restriction.id && styles.dietaryTextSelected,
                ]}
              >
                {restriction.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Allergies Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Food Allergies (Select all that apply)</Text>
          <TouchableOpacity
            style={styles.addAllergyButton}
            onPress={handleAddAllergy}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color={Colors.dark.primary} />
            <Text style={styles.addAllergyButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.allergiesContainer}>
          {/* Base allergies */}
          {ALLERGIES.map((allergy) => (
            <TouchableOpacity
              key={allergy}
              style={[
                styles.allergyChip,
                selectedAllergies.includes(allergy) && styles.allergyChipSelected,
              ]}
              onPress={() => toggleAllergy(allergy)}
              activeOpacity={0.7}
            >
              {selectedAllergies.includes(allergy) && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={Colors.dark.primary}
                  style={styles.chipIcon}
                />
              )}
              <Text
                style={[
                  styles.allergyText,
                  selectedAllergies.includes(allergy) && styles.allergyTextSelected,
                ]}
              >
                {allergy}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Custom allergies */}
          {customAllergies.map((allergy) => (
            <TouchableOpacity
              key={allergy}
              style={[
                styles.allergyChip,
                selectedAllergies.includes(allergy) && styles.allergyChipSelected,
              ]}
              onPress={() => toggleAllergy(allergy)}
              activeOpacity={0.7}
            >
              {selectedAllergies.includes(allergy) && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={Colors.dark.primary}
                  style={styles.chipIcon}
                />
              )}
              <Text
                style={[
                  styles.allergyText,
                  selectedAllergies.includes(allergy) && styles.allergyTextSelected,
                ]}
              >
                {allergy}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add Allergy Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Allergy</Text>
            <Text style={styles.modalSubtitle}>
              Enter an allergy that's not listed
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter allergy name"
              placeholderTextColor={Colors.dark.textSecondary}
              value={newAllergyName}
              onChangeText={setNewAllergyName}
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
                onPress={confirmAddAllergy}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextConfirm}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  sectionTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  addAllergyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  addAllergyButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
  },
  optionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dietaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dietaryButtonSelected: {
    backgroundColor: 'rgba(242, 100, 25, 0.15)',
    borderColor: 'transparent',
  },
  radioContainer: {
    marginRight: Spacing.md,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
  },
  dietaryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
  },
  dietaryTextSelected: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.dark.primary,
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  allergyChipSelected: {
    backgroundColor: 'rgba(242, 100, 25, 0.15)',
    borderColor: Colors.dark.primary,
  },
  chipIcon: {
    marginRight: Spacing.xs,
  },
  allergyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
  },
  allergyTextSelected: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.dark.primary,
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

export default AllergiesScreen;
