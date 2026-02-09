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

const AllergiesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [selectedDietaryRestriction, setSelectedDietaryRestriction] = useState('none');
  const [customAllergies, setCustomAllergies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAllergyName, setNewAllergyName] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

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

  const handleNext = () => {
    navigation.navigate('Difficulty', {
      ...route.params,
      allergies: selectedAllergies,
      dietary_restriction: selectedDietaryRestriction,
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
            <View style={[styles.progressBarFill, { width: '88%' }]} />
          </View>
        </View>

        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🥜</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Allergies & Restrictions</Text>
        <Text style={styles.subtitle}>
          Help us personalize your meal plans by selecting any allergies or dietary restrictions.
        </Text>

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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(232, 93, 4, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    alignSelf: 'center',
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
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
  footer: {
    paddingHorizontal: Spacing.lg,
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

export default AllergiesScreen;
