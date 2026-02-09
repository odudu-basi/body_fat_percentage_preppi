import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 60;

const TargetWeightScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  // Get current weight from previous screen
  const currentWeightKg = route.params?.weight_kg || 70;
  const currentWeightLbs = Math.round(currentWeightKg / 0.453592);

  const [isMetric, setIsMetric] = useState(false);

  // Imperial value
  const [selectedLbs, setSelectedLbs] = useState(Math.max(80, currentWeightLbs - 20));

  // Metric value
  const [selectedKg, setSelectedKg] = useState(Math.max(30, currentWeightKg - 10));

  const scrollViewRef = useRef(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    // Calculate target weight in kg
    let targetWeightKg;

    if (isMetric) {
      targetWeightKg = selectedKg;
    } else {
      // Convert lbs to kg
      targetWeightKg = Math.round(selectedLbs * 0.453592);
    }

    navigation.navigate('TargetBodyFat', {
      ...route.params,
      target_weight_kg: targetWeightKg,
      targetWeightUnit: isMetric ? 'kg' : 'lbs',
    });
  };

  // Generate arrays for pickers - only weights below current weight
  const maxLbs = currentWeightLbs - 1;
  const minLbs = 80;
  const lbs = Array.from({ length: maxLbs - minLbs + 1 }, (_, i) => i + minLbs).filter(w => w < currentWeightLbs);

  const maxKg = currentWeightKg - 1;
  const minKg = 30;
  const kg = Array.from({ length: maxKg - minKg + 1 }, (_, i) => i + minKg).filter(w => w < currentWeightKg);

  // Scroll to selected value on mount or unit change
  useEffect(() => {
    const scrollToValue = () => {
      if (scrollViewRef.current) {
        const array = isMetric ? kg : lbs;
        const selectedValue = isMetric ? selectedKg : selectedLbs;
        const index = array.indexOf(selectedValue);
        if (index !== -1) {
          scrollViewRef.current.scrollTo({
            y: index * ITEM_HEIGHT,
            animated: false,
          });
        }
      }
    };
    setTimeout(scrollToValue, 100);
  }, [isMetric]);

  const renderPicker = (values, selectedValue, onValueChange, unit) => {
    return (
      <View style={styles.pickerColumn}>
        <View style={styles.pickerSelector} />
        <ScrollView
          ref={scrollViewRef}
          style={styles.pickerScrollView}
          contentContainerStyle={{
            paddingVertical: ITEM_HEIGHT * 2,
          }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const yOffset = e.nativeEvent.contentOffset.y;
            const index = Math.round(yOffset / ITEM_HEIGHT);
            if (values[index] !== undefined) {
              onValueChange(values[index]);
            }
          }}
        >
          {values.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.pickerItem}
              onPress={() => {
                onValueChange(value);
                const index = values.indexOf(value);
                scrollViewRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
              }}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  value === selectedValue && styles.pickerItemTextSelected,
                ]}
              >
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.unitLabel}>{unit}</Text>
      </View>
    );
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
            <View style={[styles.progressBarFill, { width: '47%' }]} />
          </View>
        </View>

        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>🎯</Text>
        </View>

        <Text style={styles.title}>What's your target weight?</Text>
        <Text style={styles.subtitle}>
          Your current weight: {isMetric ? `${currentWeightKg} kg` : `${currentWeightLbs} lbs`}
        </Text>

        {/* Unit Toggle */}
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitButton, !isMetric && styles.unitButtonActive]}
            onPress={() => setIsMetric(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.unitButtonText, !isMetric && styles.unitButtonTextActive]}>
              LBS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitButton, isMetric && styles.unitButtonActive]}
            onPress={() => setIsMetric(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.unitButtonText, isMetric && styles.unitButtonTextActive]}>
              KG
            </Text>
          </TouchableOpacity>
        </View>

        {/* Picker */}
        <View style={styles.pickersContainer}>
          <View style={styles.pickerSection}>
            {isMetric ? (
              renderPicker(kg, selectedKg, setSelectedKg, 'kg')
            ) : (
              renderPicker(lbs, selectedLbs, setSelectedLbs, 'lbs')
            )}
          </View>
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
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.xl,
    alignSelf: 'center',
  },
  unitButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  unitButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  unitButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  unitButtonTextActive: {
    color: '#FFFFFF',
  },
  pickersContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSection: {
    width: width * 0.4,
    height: ITEM_HEIGHT * 5,
    position: 'relative',
  },
  pickerColumn: {
    flex: 1,
    position: 'relative',
  },
  pickerSelector: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    zIndex: 1,
    pointerEvents: 'none',
  },
  pickerScrollView: {
    flex: 1,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textSecondary,
  },
  pickerItemTextSelected: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.primary,
  },
  unitLabel: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2 + ITEM_HEIGHT / 2 - 12,
    right: Spacing.md,
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.primary,
    zIndex: 2,
    pointerEvents: 'none',
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

export default TargetWeightScreen;
