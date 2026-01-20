import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const AccuracyScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    // Navigate to Paywall with all onboarding data
    navigation.navigate('Paywall', {
      ...route.params,
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
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>
        </View>

        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>How accurate is our{'\n'}body fat analysis?</Text>
        <Text style={styles.subtitle}>
          Our AI-powered analysis provides professional-grade precision for your body composition
        </Text>

        {/* Accuracy Display */}
        <View style={styles.accuracyContainer}>
          {/* Tolerance Badge */}
          <View style={styles.toleranceBadge}>
            <Text style={styles.plusMinus}>±</Text>
            <Text style={styles.toleranceNumber}>3%</Text>
          </View>

          {/* Hand-drawn arrow and label */}
          <View style={styles.annotationContainer}>
            <Svg width={200} height={100} viewBox="0 0 200 100" style={styles.arrow}>
              {/* Curved arrow path */}
              <Path
                d="M 20 80 Q 50 40, 100 20 L 95 15 M 100 20 L 95 25"
                stroke="#FFFFFF"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.accuracyLabel}>Tolerance</Text>
          </View>

          {/* Explanation */}
          <Text style={styles.explanation}>
            Clinical-grade accuracy comparable to professional body fat measurement devices
          </Text>
        </View>
      </View>

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
    marginBottom: Spacing.xl * 2,
  },
  accuracyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: -Spacing.xl * 2,
  },
  toleranceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl * 2,
    borderWidth: 3,
    borderColor: Colors.dark.primary,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  plusMinus: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 100,
    color: Colors.dark.primary,
    lineHeight: 100,
    marginRight: Spacing.xs,
  },
  toleranceNumber: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 100,
    color: Colors.dark.textPrimary,
    lineHeight: 100,
  },
  annotationContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  arrow: {
    position: 'absolute',
    top: -60,
    left: -40,
  },
  accuracyLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.textPrimary,
    fontStyle: 'italic',
    transform: [{ rotate: '-8deg' }],
  },
  explanation: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
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

export default AccuracyScreen;
