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

const TargetBodyFatScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  const [selectedBodyFat, setSelectedBodyFat] = useState(15);

  const scrollViewRef = useRef(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    navigation.navigate('WaterIntake', {
      ...route.params,
      target_body_fat_percentage: selectedBodyFat,
    });
  };

  // Generate array for body fat percentages (5% - 40%)
  const bodyFatPercentages = Array.from({ length: 36 }, (_, i) => i + 5);

  // Scroll to selected value on mount
  useEffect(() => {
    const scrollToValue = () => {
      if (scrollViewRef.current) {
        const index = bodyFatPercentages.indexOf(selectedBodyFat);
        if (index !== -1) {
          scrollViewRef.current.scrollTo({
            y: index * ITEM_HEIGHT,
            animated: false,
          });
        }
      }
    };
    setTimeout(scrollToValue, 100);
  }, []);

  const renderPicker = () => {
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
            if (bodyFatPercentages[index] !== undefined) {
              setSelectedBodyFat(bodyFatPercentages[index]);
            }
          }}
        >
          {bodyFatPercentages.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.pickerItem}
              onPress={() => {
                setSelectedBodyFat(value);
                const index = bodyFatPercentages.indexOf(value);
                scrollViewRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
              }}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  value === selectedBodyFat && styles.pickerItemTextSelected,
                ]}
              >
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.unitLabel}>%</Text>
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
            <View style={[styles.progressBarFill, { width: '50%' }]} />
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
          <Text style={styles.iconEmoji}>📊</Text>
        </View>

        <Text style={styles.title}>What's your target body fat %?</Text>
        <Text style={styles.subtitle}>
          Choose your ideal body fat percentage goal
        </Text>

        {/* Picker */}
        <View style={styles.pickersContainer}>
          <View style={styles.pickerSection}>
            {renderPicker()}
          </View>
        </View>

        {/* Body Fat Reference */}
        <View style={styles.referenceContainer}>
          <Text style={styles.referenceTitle}>Reference Guide:</Text>
          <View style={styles.referenceRow}>
            <Text style={styles.referenceLabel}>Essential:</Text>
            <Text style={styles.referenceValue}>5-9%</Text>
          </View>
          <View style={styles.referenceRow}>
            <Text style={styles.referenceLabel}>Athletic:</Text>
            <Text style={styles.referenceValue}>10-14%</Text>
          </View>
          <View style={styles.referenceRow}>
            <Text style={styles.referenceLabel}>Fitness:</Text>
            <Text style={styles.referenceValue}>15-19%</Text>
          </View>
          <View style={styles.referenceRow}>
            <Text style={styles.referenceLabel}>Average:</Text>
            <Text style={styles.referenceValue}>20-24%</Text>
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
  referenceContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  referenceTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  referenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  referenceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  referenceValue: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.sm,
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

export default TargetBodyFatScreen;
