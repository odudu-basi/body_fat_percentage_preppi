import React, { useState } from 'react';
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

const HeightWeightScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  const [isMetric, setIsMetric] = useState(false);

  // Imperial values
  const [selectedFeet, setSelectedFeet] = useState(5);
  const [selectedInches, setSelectedInches] = useState(7);
  const [selectedLbs, setSelectedLbs] = useState(150);

  // Metric values
  const [selectedCm, setSelectedCm] = useState(170);
  const [selectedKg, setSelectedKg] = useState(68);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    // Calculate height and weight in consistent units
    let heightInCm, weightInKg;

    if (isMetric) {
      heightInCm = selectedCm;
      weightInKg = selectedKg;
    } else {
      // Convert imperial to metric
      heightInCm = Math.round((selectedFeet * 12 + selectedInches) * 2.54);
      weightInKg = Math.round(selectedLbs * 0.453592);
    }

    navigation.navigate('Ethnicity', {
      ...route.params,
      height_cm: heightInCm,
      weight_kg: weightInKg,
      heightUnit: isMetric ? 'cm' : 'ft',
      weightUnit: isMetric ? 'kg' : 'lbs',
    });
  };

  // Generate arrays for pickers
  const feet = Array.from({ length: 5 }, (_, i) => i + 3); // 3-7 ft
  const inches = Array.from({ length: 12 }, (_, i) => i); // 0-11 in
  const lbs = Array.from({ length: 201 }, (_, i) => i + 80); // 80-280 lbs
  const cm = Array.from({ length: 151 }, (_, i) => i + 100); // 100-250 cm
  const kg = Array.from({ length: 151 }, (_, i) => i + 30); // 30-180 kg

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
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>
        </View>

        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Height & weight</Text>
        <Text style={styles.subtitle}>
          This will be used to predict your height potential & create your custom plan.
        </Text>

        {/* Pickers Container */}
        <View style={styles.pickersContainer}>
          {/* Height Section */}
          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Height</Text>
            <View style={styles.pickerColumns}>
              {!isMetric ? (
                <>
                  {/* Feet */}
                  <ScrollView
                    style={styles.pickerScrollView}
                    contentContainerStyle={styles.pickerContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {feet.map((ft) => (
                      <TouchableOpacity
                        key={ft}
                        style={[
                          styles.pickerItem,
                          selectedFeet === ft && styles.pickerItemSelected,
                        ]}
                        onPress={() => setSelectedFeet(ft)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedFeet === ft && styles.pickerItemTextSelected,
                          ]}
                        >
                          {ft} ft
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Inches */}
                  <ScrollView
                    style={styles.pickerScrollView}
                    contentContainerStyle={styles.pickerContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {inches.map((inch) => (
                      <TouchableOpacity
                        key={inch}
                        style={[
                          styles.pickerItem,
                          selectedInches === inch && styles.pickerItemSelected,
                        ]}
                        onPress={() => setSelectedInches(inch)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedInches === inch && styles.pickerItemTextSelected,
                          ]}
                        >
                          {inch} in
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                /* Centimeters */
                <ScrollView
                  style={[styles.pickerScrollView, { flex: 1 }]}
                  contentContainerStyle={styles.pickerContent}
                  showsVerticalScrollIndicator={false}
                >
                  {cm.map((centimeter) => (
                    <TouchableOpacity
                      key={centimeter}
                      style={[
                        styles.pickerItem,
                        selectedCm === centimeter && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedCm(centimeter)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedCm === centimeter && styles.pickerItemTextSelected,
                        ]}
                      >
                        {centimeter} cm
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Weight Section */}
          <View style={styles.pickerSection}>
            <Text style={styles.pickerLabel}>Weight</Text>
            <ScrollView
              style={styles.pickerScrollView}
              contentContainerStyle={styles.pickerContent}
              showsVerticalScrollIndicator={false}
            >
              {!isMetric ? (
                lbs.map((pound) => (
                  <TouchableOpacity
                    key={pound}
                    style={[
                      styles.pickerItem,
                      selectedLbs === pound && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedLbs(pound)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedLbs === pound && styles.pickerItemTextSelected,
                      ]}
                    >
                      {pound} lb
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                kg.map((kilogram) => (
                  <TouchableOpacity
                    key={kilogram}
                    style={[
                      styles.pickerItem,
                      selectedKg === kilogram && styles.pickerItemSelected,
                    ]}
                    onPress={() => setSelectedKg(kilogram)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedKg === kilogram && styles.pickerItemTextSelected,
                      ]}
                    >
                      {kilogram} kg
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Unit Toggle */}
        <View style={styles.toggleContainer}>
          <Text
            style={[
              styles.toggleLabel,
              !isMetric && styles.toggleLabelActive,
            ]}
          >
            Imperial
          </Text>
          <TouchableOpacity
            style={styles.toggleSwitch}
            onPress={() => setIsMetric(!isMetric)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.toggleThumb,
              isMetric && styles.toggleThumbActive,
            ]} />
          </TouchableOpacity>
          <Text
            style={[
              styles.toggleLabel,
              isMetric && styles.toggleLabelActive,
            ]}
          >
            Metric
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
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  pickersContainer: {
    flexDirection: 'row',
    gap: Spacing.lg,
    height: 300,
    marginBottom: Spacing.xl,
  },
  pickerSection: {
    flex: 1,
  },
  pickerLabel: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  pickerColumns: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flex: 1,
  },
  pickerScrollView: {
    flex: 1,
  },
  pickerContent: {
    paddingVertical: Spacing.sm,
  },
  pickerItem: {
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  pickerItemSelected: {
    backgroundColor: Colors.dark.surface,
  },
  pickerItemText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  pickerItemTextSelected: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  toggleLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  toggleLabelActive: {
    fontFamily: 'Rubik_600SemiBold',
    color: Colors.dark.textPrimary,
  },
  toggleSwitch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surface,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
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

export default HeightWeightScreen;
