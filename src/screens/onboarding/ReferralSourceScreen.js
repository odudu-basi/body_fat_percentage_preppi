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

const REFERRAL_OPTIONS = [
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { id: 'tiktok', label: 'TikTok', icon: 'musical-notes' },
  { id: 'friend_or_family', label: 'Friend or Family', icon: 'people' },
  { id: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
  { id: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
  { id: 'ai', label: 'AI (ChatGPT, etc.)', icon: 'sparkles' },
  { id: 'x', label: 'X (Twitter)', icon: 'logo-twitter' },
];

const ReferralSourceScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedSource, setSelectedSource] = useState(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    if (selectedSource) {
      // Navigate to next screen with accumulated data
      navigation.navigate('WorkoutFrequency', {
        ...route.params,
        referral_source: selectedSource,
      });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.textPrimary} />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '35%' }]} />
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Where did you hear about us?</Text>
        <Text style={styles.subtitle}>
          Help us understand how you discovered BodyMax so we can continue reaching more people like you.
        </Text>

        {/* Referral Options */}
        <View style={styles.optionsContainer}>
          {REFERRAL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                selectedSource === option.id && styles.optionButtonSelected,
              ]}
              onPress={() => setSelectedSource(option.id)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={selectedSource === option.id ? Colors.dark.primary : Colors.dark.textPrimary}
                />
                <Text
                  style={[
                    styles.optionText,
                    selectedSource === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </View>
              {selectedSource === option.id && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.dark.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Next Button (appears when selection made) */}
      {selectedSource && (
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl * 2,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(242, 100, 25, 0.15)',
    borderColor: Colors.dark.primary,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  optionTextSelected: {
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
});

export default ReferralSourceScreen;
