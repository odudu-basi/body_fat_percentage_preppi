import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const DIFFICULTY_OPTIONS = [
  {
    id: 'easy',
    label: 'Easy',
    subtitle: 'Light calorie deficit, light cardio',
    description: 'Sustainable approach with gentle deficit (~250 cal). Perfect for beginners or those who prefer a slower pace.',
    icon: 'walk-outline',
  },
  {
    id: 'medium',
    label: 'Medium',
    subtitle: 'Sustainable calorie deficit, medium cardio',
    description: 'Balanced approach with moderate deficit (~500 cal). Recommended for most people seeking steady progress.',
    icon: 'fitness-outline',
  },
  {
    id: 'hard',
    label: 'Hard',
    subtitle: 'Intense calorie deficit, intense cardio',
    description: 'Aggressive approach with higher deficit (~750 cal). For experienced individuals seeking faster results.',
    icon: 'flame-outline',
  },
];

const DifficultyScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    if (selectedDifficulty) {
      navigation.navigate('Testimonials', {
        ...route.params,
        difficulty: selectedDifficulty,
      });
    }
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
            <View style={[styles.progressBarFill, { width: '94%' }]} />
          </View>
        </View>

        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Choose your{'\n'}difficulty level</Text>
        <Text style={styles.subtitle}>
          Select how aggressive you want your fat loss plan to be
        </Text>

        {/* Difficulty Options */}
        <View style={styles.optionsContainer}>
          {DIFFICULTY_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedDifficulty === option.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedDifficulty(option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionHeader}>
                <View style={[
                  styles.iconContainer,
                  selectedDifficulty === option.id && styles.iconContainerSelected,
                ]}>
                  <Ionicons
                    name={option.icon}
                    size={28}
                    color={selectedDifficulty === option.id ? Colors.dark.primary : Colors.dark.textSecondary}
                  />
                </View>
                <View style={styles.optionTitleContainer}>
                  <Text style={[
                    styles.optionLabel,
                    selectedDifficulty === option.id && styles.optionLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
              </View>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Next Button */}
      {selectedDifficulty && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
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
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl * 1.5,
  },
  optionsContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  optionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(242, 100, 25, 0.1)',
    borderColor: Colors.dark.primary,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(242, 100, 25, 0.2)',
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.dark.primary,
  },
  optionSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  optionDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
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
});

export default DifficultyScreen;
