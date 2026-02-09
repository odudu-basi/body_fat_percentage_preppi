import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const { width } = Dimensions.get('window');

const WaterIntakeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [waterLitres, setWaterLitres] = useState(2.5);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    navigation.navigate('FoodStruggles', {
      ...route.params,
      waterIntake: waterLitres,
    });
  };

  const handleDecrease = () => {
    setWaterLitres(prev => Math.max(0, prev - 0.5));
  };

  const handleIncrease = () => {
    setWaterLitres(prev => Math.min(5, prev + 0.5));
  };

  // Calculate circle progress (0 to 1)
  const progress = waterLitres / 5;

  // Circle parameters
  const circleSize = 240;
  const strokeWidth = 12;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressStroke = circumference * progress;

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
            <View style={[styles.progressBarFill, { width: '59%' }]} />
          </View>
        </View>

        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>How many litres of{'\n'}water do you drink{'\n'}each day?</Text>
        <Text style={styles.subtitle}>
          This will be used to predict your height potential & create your custom plan.
        </Text>

        {/* Circular Progress */}
        <View style={styles.circleContainer}>
          <Svg width={circleSize} height={circleSize}>
            {/* Background circle */}
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke={Colors.dark.surface}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              stroke={Colors.dark.primary}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${progressStroke} ${circumference}`}
              strokeLinecap="round"
              rotation="-90"
              origin={`${circleSize / 2}, ${circleSize / 2}`}
            />
          </Svg>

          {/* Center Text */}
          <View style={styles.circleCenter}>
            <Text style={styles.circleValue}>{waterLitres.toFixed(1)}L</Text>
          </View>
        </View>

        {/* +/- Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, waterLitres <= 0 && styles.controlButtonDisabled]}
            onPress={handleDecrease}
            disabled={waterLitres <= 0}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={32} color={waterLitres <= 0 ? Colors.dark.textSecondary : Colors.dark.textPrimary} />
          </TouchableOpacity>

          <View style={styles.valueDisplay}>
            <Text style={styles.valueText}>{waterLitres.toFixed(1)}L</Text>
          </View>

          <TouchableOpacity
            style={[styles.controlButton, waterLitres >= 5 && styles.controlButtonDisabled]}
            onPress={handleIncrease}
            disabled={waterLitres >= 5}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={32} color={waterLitres >= 5 ? Colors.dark.textSecondary : Colors.dark.textPrimary} />
          </TouchableOpacity>
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
    marginBottom: Spacing.xl,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xl,
    position: 'relative',
  },
  circleCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 56,
    color: Colors.dark.textPrimary,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl * 2,
    gap: Spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  controlButtonDisabled: {
    borderColor: Colors.dark.surface,
    opacity: 0.5,
  },
  valueDisplay: {
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 40,
    color: Colors.dark.textPrimary,
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

export default WaterIntakeScreen;
