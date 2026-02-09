import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const { width } = Dimensions.get('window');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BirthdayScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(0); // January
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(1998);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    const birthday = new Date(selectedYear, selectedMonth, selectedDay);
    navigation.navigate('HeightWeight', {
      ...route.params,
      birthday: birthday.toISOString(),
    });
  };

  // Generate days array (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Generate years array (current year - 100 to current year - 10)
  const years = Array.from({ length: 91 }, (_, i) => currentYear - 10 - i);

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
            <View style={[styles.progressBarFill, { width: '18%' }]} />
          </View>
        </View>

        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>When were you born?</Text>
        <Text style={styles.subtitle}>
          This will be used to predict your height potential & create your custom plan.
        </Text>

        {/* Date Picker */}
        <View style={styles.pickerContainer}>
          {/* Month Picker */}
          <View style={styles.pickerColumn}>
            <ScrollView
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={false}
            >
              {MONTHS.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.pickerItem,
                    selectedMonth === index && styles.pickerItemSelected,
                  ]}
                  onPress={() => setSelectedMonth(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedMonth === index && styles.pickerItemTextSelected,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Day Picker */}
          <View style={styles.pickerColumn}>
            <ScrollView
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={false}
            >
              {days.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.pickerItem,
                    selectedDay === day && styles.pickerItemSelected,
                  ]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDay === day && styles.pickerItemTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Year Picker */}
          <View style={styles.pickerColumn}>
            <ScrollView
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={false}
            >
              {years.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.pickerItem,
                    selectedYear === year && styles.pickerItemSelected,
                  ]}
                  onPress={() => setSelectedYear(year)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedYear === year && styles.pickerItemTextSelected,
                    ]}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  pickerContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    height: 280,
  },
  pickerColumn: {
    flex: 1,
  },
  pickerScrollView: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: Spacing.md,
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
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  pickerItemTextSelected: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
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

export default BirthdayScreen;
